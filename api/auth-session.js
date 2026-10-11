import bcrypt from "bcryptjs";
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

async function findAuthUserByEmail(supabase, email) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const matchingUser = data.users.find((user) => user.email?.toLowerCase() === email);
    if (matchingUser) return matchingUser;
    if (data.users.length < 1000) return null;
  }

  throw new Error("Unable to locate the existing authentication account.");
}

function getInactiveAccountMessage(user) {
  const deactivatedAt = new Date(user.deactivated_at || user.updated_at);
  const deletionDate = new Date(deactivatedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(deletionDate.getTime())) {
    return "Your account has been deactivated and is scheduled for permanent deletion after 30 days. Contact the Branch Coordinator for assistance.";
  }

  return `Your account has been deactivated and is scheduled for permanent deletion on ${deletionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}. Contact the Branch Coordinator before then if you need assistance.`;
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
    if (!email || !password) {
      return sendJson(res, 400, { error: "Email and password are required." });
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, auth_user_id, email, password_hash, full_name, first_name, last_name, middle_name, sex, birth_date, contact_number, profile_picture_url, role, status, deactivated_at, updated_at")
      .eq("email", email)
      .maybeSingle();

    if (userError) throw userError;
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return sendJson(res, 401, { error: "Invalid email or password." });
    }

    if (user.status === "inactive") {
      return sendJson(res, 403, { error: getInactiveAccountMessage(user) });
    }
    if (user.status === "suspended") {
      return sendJson(res, 403, { error: "This account has been suspended." });
    }

    let authUser = null;
    if (user.auth_user_id) {
      const { data, error } = await supabase.auth.admin.getUserById(user.auth_user_id);
      if (error && error.status !== 404) throw error;
      authUser = data?.user || null;
      if (authUser && authUser.email?.toLowerCase() !== email) {
        return sendJson(res, 409, {
          error: "This account's secure sign-in link needs administrator assistance.",
        });
      }
    }

    if (!authUser) {
      authUser = await findAuthUserByEmail(supabase, email);
    }

    if (authUser) {
      const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
      });
      if (error) throw error;
      authUser = data.user;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      authUser = data.user;
    }

    if (!authUser?.id) {
      throw new Error("Supabase Auth did not return the migrated account.");
    }

    if (user.auth_user_id !== authUser.id) {
      const { error: linkError } = await supabase
        .from("users")
        .update({ auth_user_id: authUser.id, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (linkError) throw linkError;
    }

    const { password_hash: _passwordHash, auth_user_id: _authUserId, ...userWithoutSecrets } = user;
    return sendJson(res, 200, { success: true, user: userWithoutSecrets });
  } catch (error) {
    console.error("Authentication migration error:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    return sendJson(res, 500, {
      error: /auth_user_id|schema cache|column .* does not exist/i.test(errorMessage)
        ? "Supabase Auth migration is not complete. Run STUDENT_AUTH_RLS_MIGRATION.sql in Supabase, then try again."
        : "Unable to sign in right now. Please try again later.",
    });
  }
}
