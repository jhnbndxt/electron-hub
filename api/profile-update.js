import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

function sendJson(res, status, payload) {
  res.status(status).setHeader("Cache-Control", "no-store").json(payload);
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Profile update server configuration is incomplete.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed." });

  try {
    const { userId, fullName, contactNumber, dateOfBirth, sex, currentPassword } = req.body || {};
    const normalizedUserId = String(userId || "").trim();
    const normalizedContactNumber = String(contactNumber || "").trim();

    if (!normalizedUserId || !String(currentPassword || "")) {
      return sendJson(res, 400, { error: "Your current password is required." });
    }

    if (normalizedContactNumber && !/^\d{1,11}$/.test(normalizedContactNumber)) {
      return sendJson(res, 400, { error: "Contact number must contain numbers only and be at most 11 digits." });
    }

    if (dateOfBirth) {
      const normalizedBirthDate = String(dateOfBirth);
      const parsedBirthDate = new Date(`${normalizedBirthDate}T00:00:00`);
      const latestAllowedDate = new Date();
      latestAllowedDate.setHours(0, 0, 0, 0);
      latestAllowedDate.setDate(latestAllowedDate.getDate() - 1);
      const [year, month, day] = normalizedBirthDate.split("-").map(Number);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(normalizedBirthDate) ||
        Number.isNaN(parsedBirthDate.getTime()) ||
        parsedBirthDate.getFullYear() !== year ||
        parsedBirthDate.getMonth() !== month - 1 ||
        parsedBirthDate.getDate() !== day ||
        parsedBirthDate > latestAllowedDate
      ) {
        return sendJson(res, 400, { error: "Date of birth must be a valid date before today." });
      }
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, password_hash")
      .eq("id", normalizedUserId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user?.password_hash || !(await bcrypt.compare(String(currentPassword), user.password_hash))) {
      return sendJson(res, 401, { error: "The current password you entered is incorrect." });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: String(fullName || "").trim(),
        contact_number: normalizedContactNumber || null,
        birth_date: dateOfBirth || null,
        sex: sex || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", normalizedUserId);

    if (updateError) throw updateError;
    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return sendJson(res, 500, { error: "Unable to update your profile right now." });
  }
}
