import { supabase, supabaseConfigError } from '../supabase';
import bcrypt from 'bcryptjs';

function normalizeEmailAddress(email) {
  return String(email || '').trim().toLowerCase();
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmailAddress(email);

  if (!normalizedEmail) {
    return { error: 'Email is required', user: null };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    return { error: error.message, user: null };
  }

  return { error: null, user };
}

async function createUserRecord(email, passwordHash, profile = {}, authUserId = null) {
  const normalizedEmail = normalizeEmailAddress(email);

  if (!normalizedEmail) {
    return { error: 'Email is required', user: null };
  }

  const { user: existingUser, error: checkError } = await findUserByEmail(normalizedEmail);

  if (checkError) {
    console.error('Register lookup error:', checkError);
    return { error: checkError, user: null };
  }

  if (existingUser) {
    return { error: 'Email already registered', user: null };
  }

  // Build full name from first and last name
  const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');

  const payload = {
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name: fullName,
    first_name: profile.firstName || null,
    last_name: profile.lastName || null,
    middle_name: profile.middleName || null,
    sex: profile.sex || null,
    birth_date: profile.birthDate || null,
    role: 'student',
    contact_number: profile.contactNumber || null,
    ...(authUserId ? { auth_user_id: authUserId } : {}),
  };

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([payload])
    .select()
    .single();

  if (insertError) {
    const errorMessage = String(insertError.message || '');
    if (/auth_user_id|schema cache/i.test(errorMessage)) {
      return {
        error: 'The Supabase Auth database migration is not applied or its schema cache has not refreshed. Run STUDENT_AUTH_RLS_MIGRATION.sql in the Supabase SQL Editor, then try again.',
        user: null,
      };
    }

    return {
      error: insertError.code === '23505' ? 'Email already registered' : insertError.message,
      user: null,
    };
  }

  const { password_hash, ...userWithoutPassword } = newUser;
  return { error: null, user: userWithoutPassword };
}

function mapOtpSendError(error, email) {
  const errorCode = String(error?.code || '').toLowerCase();
  const errorMessage = String(error?.message || '').toLowerCase();

  if (errorCode === 'over_email_send_rate_limit' || error?.status === 429 || /rate.limit|too many requests/.test(errorMessage)) {
    return 'Verification email could not be sent because Supabase email sending is rate-limited. Try again later or configure custom SMTP in Supabase Auth settings.';
  }

  if (errorCode === 'email_address_not_authorized' || /email address not authorized|not authorized/.test(errorMessage)) {
    return `Verification email could not be sent to ${email}. Configure custom SMTP in Supabase Auth settings or authorize this recipient for the project sender.`;
  }

  return error?.message || 'Unable to send verification email right now.';
}

function mapOtpVerifyError(error) {
  const errorCode = String(error?.code || '').toLowerCase();
  const errorMessage = String(error?.message || '').toLowerCase();

  if (errorCode === 'otp_expired' || /expired/.test(errorMessage)) {
    return 'This verification code has expired. Request a new email and try again.';
  }

  if (errorCode === 'invalid_otp' || /invalid token|invalid otp|token has expired or is invalid/.test(errorMessage)) {
    return 'The verification code is invalid. Check the latest email or request a new one.';
  }

  return error?.message || 'Unable to verify your email right now.';
}

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Promise} - User data or error
 */
export async function loginUser(email, password) {
  try {
    const response = await fetch('/api/auth-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizeEmailAddress(email), password }),
    });
    const result = await response.json();
    if (!response.ok || !result.success || !result.user) {
      return { error: result.error || 'Unable to sign in right now.', user: null };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizeEmailAddress(email),
      password,
    });
    if (signInError) {
      console.error('Supabase Auth sign-in error after credential migration:', signInError);
      return { error: 'Your account was prepared for secure sign-in, but the session could not be started. Please try again.', user: null };
    }

    return { error: null, user: result.user };
  } catch (error) {
    console.error('Login error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unable to reach the authentication service.',
      user: null,
    };
  }
}

/**
 * Register new user
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @param {Object} profile - Profile fields collected during registration (firstName, lastName, middleName, sex, contactNumber)
 * @returns {Promise} - New user data or error
 */
export async function registerUser(email, password, profile = {}) {
  try {
    if (supabaseConfigError) {
      return { error: supabaseConfigError, user: null };
    }

    const normalizedEmail = normalizeEmailAddress(email);

    if (!normalizedEmail) {
      return { error: 'Email is required', user: null };
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    return await createUserRecord(normalizedEmail, password_hash, profile);
  } catch (error) {
    console.error('Register error:', error);
    return { error: error.message, user: null };
  }
}

/**
 * Create a verified custom user row using a precomputed password hash
 * @param {string} email - Verified email address
 * @param {string} password - Registration password
 * @param {Object} profile - Profile fields (firstName, lastName, middleName, sex, contactNumber)
 * @returns {Promise} - New user data or error
 */
export async function registerVerifiedUser(email, password, profile = {}) {
  try {
    if (!password) {
      return { error: 'Password is required', user: null };
    }

    const normalizedEmail = normalizeEmailAddress(email);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user || normalizeEmailAddress(authData.user.email) !== normalizedEmail) {
      return { error: 'Verify this email address before creating the account.', user: null };
    }

    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) throw passwordError;

    const passwordHash = await bcrypt.hash(password, 10);
    return await createUserRecord(normalizedEmail, passwordHash, profile, authData.user.id);
  } catch (error) {
    console.error('Verified register error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unable to reach the registration service.',
      user: null,
    };
  }
}

/**
 * Send a registration OTP to the email address before creating the custom user record
 * @param {string} email - User email
 * @returns {Promise<{error: string | null, success: boolean}>}
 */
export async function sendRegistrationOtp(email, emailRedirectTo = null) {
  try {
    const normalizedEmail = normalizeEmailAddress(email);
    if (!normalizedEmail) {
      return { error: 'Email is required', success: false };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      console.error('Send OTP error:', error);
      return { error: mapOtpSendError(error, normalizedEmail), success: false };
    }

    return { error: null, success: true };
  } catch (error) {
    console.error('Send OTP error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unable to reach the email verification service.',
      success: false,
    };
  }
}

/**
 * Verify registration OTP sent to email address
 * @param {string} email - User email
 * @param {string} token - OTP code
 * @returns {Promise<{error: string | null, success: boolean}>}
 */
export async function verifyRegistrationOtp(email, token) {
  try {
    const normalizedEmail = normalizeEmailAddress(email);
    const normalizedToken = String(token || '').trim();

    if (!normalizedEmail) {
      return { error: 'Email is required', success: false };
    }

    if (!normalizedToken) {
      return { error: 'Verification code is required', success: false };
    }

    if (!/^\d{8}$/.test(normalizedToken)) {
      return { error: 'Enter the complete 8-digit verification code from the latest email.', success: false };
    }

    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: 'email',
    });

    if (error) {
      console.error('Verify OTP error:', error);
      return { error: mapOtpVerifyError(error), success: false };
    }

    return { error: null, success: true };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unable to reach the email verification service.',
      success: false,
    };
  }
}

/**
 * Clear the temporary Supabase Auth session created by OTP verification.
 * @returns {Promise<{error: string | null}>}
 */
export async function clearRegistrationVerification() {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      console.error('Clear verification session error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Clear verification session error:', error);
    return { error: error.message };
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise} - User data or error
 */
export async function getUserById(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return { error: 'User not found', user: null };
    }

    const { password_hash, ...userWithoutPassword } = user;
    return { error: null, user: userWithoutPassword };
  } catch (error) {
    console.error('Get user error:', error);
    return { error: error.message, user: null };
  }
}

/**
 * Logout (client-side only, no server action needed)
 */
export function logout() {
  // Clear any local session data if you're using sessionStorage
  sessionStorage.removeItem('currentUser');
}
