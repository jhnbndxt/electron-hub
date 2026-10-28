import { createClient } from "@supabase/supabase-js";

function sendJson(res, status, payload) {
  res.status(status).setHeader("Cache-Control", "no-store").json(payload);
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Authentication server configuration is incomplete.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isValidPassword(password) {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const accessToken = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");

    if (!email || !accessToken || !isValidPassword(password)) {
      return sendJson(res, 400, { error: "A verified email and a valid password are required." });
    }

    const supabase = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (
      authError ||
      !authData.user ||
      authData.user.email?.toLowerCase() !== email ||
      !authData.user.email_confirmed_at
    ) {
      return sendJson(res, 401, { error: "Verify this email address before creating the account." });
    }

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existingUser) {
      return sendJson(res, 409, { error: "An account with this email already exists." });
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id, false);
    if (deleteError && deleteError.status !== 404) throw deleteError;

    const { data: replacementData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;
    if (!replacementData.user?.id) {
      throw new Error("Supabase Auth did not return the replacement account.");
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("Orphaned registration authentication cleanup error:", error);
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unable to prepare this account for registration.",
    });
  }
}
