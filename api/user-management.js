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

async function findAuthUserByEmail(supabase, email) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const matchingUser = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (matchingUser) return matchingUser;
    if (data.users.length < 1000) return null;
  }

  throw new Error("Unable to locate the linked authentication account.");
}

async function deleteAuthUserForAccount(supabase, { email, auth_user_id }) {
  let authUser = null;
  if (auth_user_id) {
    const { data, error } = await supabase.auth.admin.getUserById(auth_user_id);
    if (error && error.status !== 404) throw error;
    authUser = data?.user || null;

    if (authUser && authUser.email?.toLowerCase() !== email.toLowerCase()) {
      throw new Error("The linked authentication account does not match the selected user.");
    }
  }

  if (!authUser) {
    authUser = await findAuthUserByEmail(supabase, email);
  }
  if (!authUser) return;

  const { error } = await supabase.auth.admin.deleteUser(authUser.id, false);
  if (error && error.status !== 404) throw error;
}

function isMissingColumn(error, column) {
  const message = String(error?.message || "");
  return (
    (error?.code === "42703" || error?.code === "PGRST204") &&
    message.toLowerCase().includes(column.toLowerCase())
  ) || new RegExp(`column .*${column}.* does not exist|could not find .*${column}`, "i").test(message);
}

async function getAccountEnrollmentIds(supabase, { id, email, auth_user_id }) {
  const enrollmentIds = new Set();
  const accountReferences = [
    ["student_id", id],
    ...(auth_user_id ? [["student_id", auth_user_id]] : []),
    ...(auth_user_id ? [["auth_user_id", auth_user_id], ["firebase_uid", auth_user_id]] : []),
    ["student_uid", id],
    ["user_uid", id],
    ...(auth_user_id ? [["student_uid", auth_user_id], ["user_uid", auth_user_id]] : []),
    ["user_id", id],
    ...(auth_user_id ? [["user_id", auth_user_id]] : []),
    ["user_id", email],
    ["email", email],
    ["student_email", email],
  ];

  for (const [column, value] of accountReferences) {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq(column, value)
        .range(offset, offset + 999);

      if (error) {
        if (isMissingColumn(error, column) || error.code === "22P02") break;
        throw error;
      }

      for (const enrollment of data || []) if (enrollment.id) enrollmentIds.add(enrollment.id);
      if (!data || data.length < 1000) break;
      offset += data.length;
    }
  }
  return [...enrollmentIds];
}

async function listStorageFiles(supabase, prefix) {
  const files = [];
  const folders = [prefix];
  const bucket = supabase.storage.from("enrollment_documents");

  while (folders.length > 0) {
    const folder = folders.pop();
    let offset = 0;

    while (true) {
      const { data, error } = await bucket.list(folder, { limit: 1000, offset });
      if (error) throw error;

      const entries = data || [];
      for (const entry of entries) {
        const path = `${folder}/${entry.name}`;
        if (entry.id === null) {
          folders.push(path);
        } else {
          files.push(path);
        }
      }

      if (entries.length < 1000) break;
      offset += entries.length;
    }
  }

  return files;
}

async function deleteAccountStorage(supabase, account, enrollmentIds) {
  const prefixes = [
    ...enrollmentIds,
    `receipts/${account.id}`,
    `profile-pictures/${account.id}`,
    ...(account.auth_user_id
      ? [`receipts/${account.auth_user_id}`, `profile-pictures/${account.auth_user_id}`]
      : []),
  ];
  const files = new Set();
  for (const prefix of prefixes) {
    for (const file of await listStorageFiles(supabase, prefix)) {
      files.add(file);
    }
  }

  const paths = [...files];
  for (let index = 0; index < paths.length; index += 1000) {
    const { error } = await supabase.storage
      .from("enrollment_documents")
      .remove(paths.slice(index, index + 1000));
    if (error) throw error;
  }
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
        .select("id, email, role, auth_user_id")
        .in("id", normalizedTargetUserIds)
        .eq("status", "inactive");

      if (lookupError) throw lookupError;
      if ((inactiveAccounts || []).length !== normalizedTargetUserIds.length) {
        return sendJson(res, 404, { error: "One or more selected accounts were not found or are not deactivated." });
      }

      for (const account of inactiveAccounts || []) {
        if (account.role === "student") {
          const enrollmentIds = await getAccountEnrollmentIds(supabase, account);
          await deleteAccountStorage(supabase, account, enrollmentIds);

          const { error: purgeError } = await supabase.rpc("purge_student_account_data", {
            p_student_id: account.id,
            p_email: account.email,
            p_auth_user_id: account.auth_user_id,
          });
          if (purgeError) {
            if (/purge_student_account_data/i.test(purgeError.message || "")) {
              throw new Error("Run STUDENT_ACCOUNT_PURGE_MIGRATION.sql in Supabase before permanently deleting student accounts.");
            }
            throw purgeError;
          }
        }

        await deleteAuthUserForAccount(supabase, account);
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
