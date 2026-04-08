import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';

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
 * @param {string} fullName - User full name
 * @returns {Promise} - New user data or error
 */
export async function registerUser(email, password, fullName) {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { error: 'Email already registered', user: null };
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash,
        full_name: fullName,
        role: 'student',
      }])
      .select()
      .single();

    if (insertError) {
      return { error: insertError.message, user: null };
    }

    // Remove password hash before returning
    const { password_hash: _, ...userWithoutPassword } = newUser;
    return { error: null, user: userWithoutPassword };
  } catch (error) {
    console.error('Register error:', error);
    return { error: error.message, user: null };
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
