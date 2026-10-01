import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const TOKEN_TTL_MINUTES = 30;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Password reset server configuration is incomplete.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppUrl(req) {
  const configuredUrl = process.env.APP_URL || process.env.VITE_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error("SMTP server configuration is incomplete.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
}

function getSender() {
  const email = process.env.SMTP_FROM || process.env.SMTP_USER;
  const name = process.env.SMTP_SENDER_NAME || "Electron Hub Support";
  return `"${name.replace(/"/g, "")}" <${email}>`;
}

function sendJson(res, status, payload) {
  res.status(status).setHeader("Cache-Control", "no-store").json(payload);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const { action, email, token, password } = req.body || {};
    const supabase = getSupabaseAdmin();

    if (action === "request") {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return sendJson(res, 400, { error: "Enter a valid email address." });
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (userError) throw userError;

      // Keep the response identical for known and unknown emails.
      if (!user) {
        return sendJson(res, 200, { success: true });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

      const { error: deleteError } = await supabase
        .from("password_reset_tokens")
        .delete()
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;

      const { error: tokenError } = await supabase
        .from("password_reset_tokens")
        .insert({ user_id: user.id, token_hash: hashToken(rawToken), expires_at: expiresAt });
      if (tokenError) throw tokenError;

      const resetUrl = `${getAppUrl(req)}/reset-password?token=${encodeURIComponent(rawToken)}`;
      const transporter = createTransporter();
      await transporter.sendMail({
        from: getSender(),
        to: normalizedEmail,
        subject: "Reset your Electron Hub password",
        text: `Hello${user.full_name ? ` ${user.full_name}` : ""},\n\nUse this link to reset your Electron Hub password:\n${resetUrl}\n\nThis link expires in ${TOKEN_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.`,
        html: `<p>Hello${user.full_name ? ` ${user.full_name}` : ""},</p><p>Use the button below to reset your Electron Hub password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#1e3a8a;color:#fff;text-decoration:none;border-radius:8px">Reset Password</a></p><p>This link expires in ${TOKEN_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.</p>`,
      });

      return sendJson(res, 200, { success: true });
    }

    if (action === "reset") {
      const rawToken = String(token || "").trim();
      const newPassword = String(password || "");
      if (!rawToken || newPassword.length < 8) {
        return sendJson(res, 400, { error: "The reset link or new password is invalid." });
      }

      const { data: resetToken, error: tokenError } = await supabase
        .from("password_reset_tokens")
        .select("id, user_id, expires_at, used_at")
        .eq("token_hash", hashToken(rawToken))
        .maybeSingle();

      if (tokenError) throw tokenError;
      if (!resetToken || resetToken.used_at || new Date(resetToken.expires_at).getTime() <= Date.now()) {
        return sendJson(res, 400, { error: "This reset link is invalid or has expired. Request a new one." });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await supabase
        .from("users")
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq("id", resetToken.user_id);
      if (updateError) throw updateError;

      const { error: consumeError } = await supabase
        .from("password_reset_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", resetToken.id)
        .is("used_at", null);
      if (consumeError) throw consumeError;

      return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 400, { error: "Invalid password reset action." });
  } catch (error) {
    console.error("Password reset error:", error);
    return sendJson(res, 500, { error: "Unable to process the password reset right now." });
  }
}
