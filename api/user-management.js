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
    const { action, coordinatorId, coordinatorPassword, targetUserIds } = req.body || {};
    if (action !== "deactivate" && action !== "delete") {
      return sendJson(res, 400, { error: "Unsupported user management action." });
    }

    const normalizedCoordinatorId = String(coordinatorId || "").trim();
    const normalizedTargetUserIds = Array.isArray(targetUserIds)
      ? [...new Set(targetUserIds.map((id) => String(id || "").trim()).filter(Boolean))]
      : [];
    const password = String(coordinatorPassword || "");
    if (!normalizedCoordinatorId || normalizedTargetUserIds.length === 0 || !password) {
      return sendJson(res, 400, { error: "Coordinator credentials and at least one target account are required." });
    }
    if (normalizedTargetUserIds.length > 100) {
      return sendJson(res, 400, { error: "Select no more than 100 accounts at a time." });
    }
    if (normalizedTargetUserIds.includes(normalizedCoordinatorId)) {
      return sendJson(res, 400, { error: "You cannot change or delete your own account while logged in." });
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

    if (action === "delete") {
      const { data: inactiveAccounts, error: lookupError } = await supabase
        .from("users")
        .select("id")
        .in("id", normalizedTargetUserIds)
        .eq("status", "inactive");

      if (lookupError) throw lookupError;
      if ((inactiveAccounts || []).length !== normalizedTargetUserIds.length) {
        return sendJson(res, 404, { error: "One or more selected accounts were not found or are not deactivated." });
      }

      const { data: deletedAccounts, error: deleteError } = await supabase
        .from("users")
        .delete()
        .in("id", normalizedTargetUserIds)
        .eq("status", "inactive")
        .select("id");

      if (deleteError) throw deleteError;
      if ((deletedAccounts || []).length !== normalizedTargetUserIds.length) {
        return sendJson(res, 409, { error: "Some selected accounts could not be deleted. Refresh the list and try again." });
      }

      return sendJson(res, 200, { success: true, deletedIds: deletedAccounts.map(({ id }) => id) });
    }

    const { data: activeAccounts, error: lookupError } = await supabase
      .from("users")
      .select("id, status")
      .in("id", normalizedTargetUserIds);

    if (lookupError) throw lookupError;
    if (
      (activeAccounts || []).length !== normalizedTargetUserIds.length ||
      activeAccounts.some(({ status }) => status === "inactive")
    ) {
      return sendJson(res, 404, { error: "One or more selected accounts were not found or are already deactivated." });
    }

    const deactivatedAt = new Date().toISOString();
    const { data: updatedAccount, error: updateError } = await supabase
      .from("users")
      .update({
        status: "inactive",
        deactivated_at: deactivatedAt,
        updated_at: deactivatedAt,
      })
      .in("id", normalizedTargetUserIds)
      .select("id");

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
        .in("id", normalizedTargetUserIds)
        .select("id");

      if (fallbackResult.error) throw fallbackResult.error;
      if ((fallbackResult.data || []).length !== normalizedTargetUserIds.length) {
        return sendJson(res, 409, { error: "Some selected accounts could not be deactivated. Refresh the list and try again." });
      }

      return sendJson(res, 200, {
        success: true,
        updatedIds: fallbackResult.data.map(({ id }) => id),
        deactivatedAt,
        deletionScheduled: false,
        notice: "Account deactivated. Run the account retention migration to schedule permanent deletion after 30 days.",
      });
    }

    if (updateError) throw updateError;
    if ((updatedAccount || []).length !== normalizedTargetUserIds.length) {
      return sendJson(res, 409, { error: "Some selected accounts could not be deactivated. Refresh the list and try again." });
    }

    return sendJson(res, 200, {
      success: true,
      updatedIds: updatedAccount.map(({ id }) => id),
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
