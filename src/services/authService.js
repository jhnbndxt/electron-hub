import { supabase } from '../supabase';
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

async function createUserRecord(email, passwordHash, profile = {}) {
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
    role: 'student',
    contact_number: profile.contactNumber || null,
  };

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([payload])
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message, user: null };
  }

  const { password_hash, ...userWithoutPassword } = newUser;
  return { error: null, user: userWithoutPassword };
}

function mapOtpSendError(error, email) {
  const errorCode = String(error?.code || '').toLowerCase();
  const errorMessage = String(error?.message || '').toLowerCase();

  if (errorCode === 'over_email_send_rate_limit' || error?.status === 429 || /rate.limit|too many requests/.test(errorMessage)) {
    return 'Verification email could not be sent because the Supabase email sender is rate-limited right now. Supabase\'s default sender is often limited to only a few auth emails per hour. Try again later, or configure custom SMTP in Supabase Auth > Emails > SMTP Settings.';
  }

  if (errorCode === 'email_address_not_authorized' || /email address not authorized|not authorized/.test(errorMessage)) {
    return `Verification email could not be sent to ${email}. The current Supabase email sender only delivers to authorized project-team addresses. Configure custom SMTP or add this address in the Supabase organization team settings.`;
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
    // Query user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { error: 'User not found', user: null };
    }

    if (user.status === 'inactive') {
      return { error: 'This account has been deactivated', user: null };
    }

    if (user.status === 'suspended') {
      return { error: 'This account has been suspended', user: null };
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { error: 'Invalid password', user: null };
    }

    // Remove password hash before returning
    const { password_hash, ...userWithoutPassword } = user;
    return { error: null, user: userWithoutPassword };
  } catch (error) {
    console.error('Login error:', error);
    return { error: error.message, user: null };
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
 * @param {string} passwordHash - Precomputed password hash
 * @param {Object} profile - Profile fields (firstName, lastName, middleName, sex, contactNumber)
 * @returns {Promise} - New user data or error
 */
export async function registerVerifiedUser(email, passwordHash, profile = {}) {
  try {
    if (!passwordHash) {
      return { error: 'Password is required', user: null };
    }

    return await createUserRecord(email, passwordHash, profile);
  } catch (error) {
    console.error('Verified register error:', error);
    return { error: error.message, user: null };
  }
}

/**
 * Send registration OTP to email address before creating the custom user record
 * @param {string} email - User email
 * @returns {Promise<{error: string | null, success: boolean}>}
 */
export async function sendRegistrationOtp(email, emailRedirectTo = null) {
  try {
    const normalizedEmail = normalizeEmailAddress(email);

    if (!normalizedEmail) {
      return { error: 'Email is required', success: false };
    }

    const { user: existingUser, error: lookupError } = await findUserByEmail(normalizedEmail);

    if (lookupError) {
      console.error('OTP lookup error:', lookupError);
      return { error: lookupError, success: false };
    }

    if (existingUser) {
      return { error: 'Email already registered', success: false };
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
    return { error: error.message, success: false };
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
    return { error: error.message, success: false };
  }
}

/**
 * Clear temporary verification session created by Supabase OTP auth
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
