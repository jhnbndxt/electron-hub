import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';

// Test users to seed into Supabase
const testUsers = [
  {
    email: "electronbranchcoor@gmail.com",
    password: "branchcoor123",
    full_name: "Branch Coordinator",
    role: "Branch Coordinator"
  },
  {
    email: "electronregistrar@gmail.com",
    password: "registrar123",
    full_name: "Registrar",
    role: "Registrar"
  },
  {
    email: "electroncashier123@gmail.com",
    password: "cashier123",
    full_name: "Cashier",
    role: "Cashier"
  },
  {
    email: "joshua@gmail.com",
    password: "root",
    full_name: "Joshua",
    role: "Student"
  }
];

export async function seedTestUsers() {
  console.log("Starting to seed test users...");
  
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();
      
      if (existingUser) {
        console.log(`✓ User ${user.email} already exists`);
        continue;
      }
      
      // Hash the password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(user.password, saltRounds);
      
      // Insert user into database
      const { data: newUser, error: dbError } = await supabase
        .from("users")
        .insert([{
          email: user.email,
          password_hash: password_hash,
          full_name: user.full_name,
          role: user.role,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (dbError) {
        console.error(`Error creating user ${user.email}:`, dbError);
        continue;
      }
      
      console.log(`✓ Test user created: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`Unexpected error for user ${user.email}:`, error);
    }
  }
  
  console.log("Test user seeding complete!");
}

// Run seeding (can be called from App.tsx on first load)
export async function initializeTestUsers() {
  try {
    // Check if seeding has already been done
    const { data: users } = await supabase
      .from("users")
      .select("email")
      .in("email", testUsers.map(u => u.email));
    
    if (!users || users.length < testUsers.length) {
      await seedTestUsers();
    } else {
      console.log("✓ Test users already exist in database");
    }
  } catch (error) {
    console.error("Error initializing test users:", error);
  }
}
