import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

function sendJson(res, status, payload) {
  res.status(status).setHeader("Cache-Control", "no-store").json(payload);
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("User management server configuration is incomplete.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const { action, coordinatorId, coordinatorPassword, targetUserId } = req.body || {};
    if (action !== "deactivate") {
      return sendJson(res, 400, { error: "Unsupported user management action." });
    }

    const normalizedCoordinatorId = String(coordinatorId || "").trim();
    const normalizedTargetUserId = String(targetUserId || "").trim();
    const password = String(coordinatorPassword || "");
    if (!normalizedCoordinatorId || !normalizedTargetUserId || !password) {
      return sendJson(res, 400, { error: "Coordinator credentials and a target account are required." });
    }
    if (normalizedCoordinatorId === normalizedTargetUserId) {
      return sendJson(res, 400, { error: "You cannot deactivate your own account while logged in." });
    }

    const supabase = getSupabaseAdmin();
    const { data: coordinator, error: coordinatorError } = await supabase
      .from("users")
      .select("id, role, password_hash")
      .eq("id", normalizedCoordinatorId)
      .maybeSingle();

    if (coordinatorError) throw coordinatorError;
    if (
      !coordinator ||
      coordinator.role !== "branchcoordinator" ||
      !coordinator.password_hash ||
      !(await bcrypt.compare(password, coordinator.password_hash))
    ) {
      return sendJson(res, 401, { error: "Branch Coordinator authorization failed. Check your password and try again." });
    }

    const deactivatedAt = new Date().toISOString();
    const { data: updatedAccount, error: updateError } = await supabase
      .from("users")
      .update({
        status: "inactive",
        deactivated_at: deactivatedAt,
        updated_at: deactivatedAt,
      })
      .eq("id", normalizedTargetUserId)
      .neq("status", "inactive")
      .select("id")
      .maybeSingle();

    const updateErrorMessage = String(updateError?.message || "");
    const missingDeactivationColumn =
      /deactivated_at/i.test(updateErrorMessage) &&
      (
        updateError?.code === "42703" ||
        updateError?.code === "PGRST204" ||
        /column|schema cache|does not exist|could not find/i.test(updateErrorMessage)
      );

    if (updateError && missingDeactivationColumn) {
      const fallbackResult = await supabase
        .from("users")
        .update({ status: "inactive", updated_at: deactivatedAt })
        .eq("id", normalizedTargetUserId)
        .neq("status", "inactive")
        .select("id")
        .maybeSingle();

      if (fallbackResult.error) throw fallbackResult.error;
      if (!fallbackResult.data) {
        return sendJson(res, 404, { error: "The account was not found or is already deactivated." });
      }

      return sendJson(res, 200, {
        success: true,
        deactivatedAt,
        deletionScheduled: false,
        notice: "Account deactivated. Run the account retention migration to schedule permanent deletion after 30 days.",
      });
    }

    if (updateError) throw updateError;
    if (!updatedAccount) {
      return sendJson(res, 404, { error: "The account was not found or is already deactivated." });
    }

    return sendJson(res, 200, {
      success: true,
      deactivatedAt,
      deletionScheduled: true,
    });
  } catch (error) {
    console.error("User deactivation error:", error);
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unable to deactivate this account right now.",
    });
  }
}
