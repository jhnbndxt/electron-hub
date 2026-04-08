import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';

// Test users to seed into Supabase
const testUsers = [
  {
    email: "electronbranchcoor@gmail.com",
    password: "branchcoor123",
    full_name: "Branch Coordinator",
    role: "admin",
    admin_type: "branchcoordinator",
    status: "active"
  },
  {
    email: "electronregistrar@gmail.com",
    password: "registrar123",
    full_name: "Registrar",
    role: "admin",
    admin_type: "registrar",
    status: "active"
  },
  {
    email: "electroncashier123@gmail.com",
    password: "cashier123",
    full_name: "Cashier",
    role: "admin",
    admin_type: "cashier",
    status: "active"
  },
  {
    email: "joshua@gmail.com",
    password: "root",
    full_name: "Joshua",
    role: "student",
    admin_type: null,
    status: "active"
  }
];

export async function seedTestUsers() {
  console.log("🌱 Starting to seed test users...");
  
  for (const user of testUsers) {
    try {
      console.log(`📝 Processing user: ${user.email}`);
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", user.email)
        .single();
      
      if (existingUser) {
        console.log(`✓ User ${user.email} already exists, skipping`);
        continue;
      }
      
      // Hash the password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(user.password, saltRounds);
      console.log(`🔐 Password hashed for ${user.email}`);
      
      // Insert user into database
      const { data: newUser, error: dbError } = await supabase
        .from("users")
        .insert([{
          email: user.email,
          password_hash: password_hash,
          full_name: user.full_name,
          role: user.role,
          admin_type: user.admin_type,
          status: user.status
        }])
        .select();
      
      if (dbError) {
        console.error(`❌ Error creating user ${user.email}:`, dbError.message, dbError.details);
        continue;
      }
      
      console.log(`✅ Test user created: ${user.email} (${user.full_name})`);
    } catch (error) {
      console.error(`❌ Unexpected error for user ${user.email}:`, error.message);
    }
  }
  
  console.log("✨ Test user seeding complete!");
}

// Run seeding (can be called from App.tsx on first load)
export async function initializeTestUsers() {
  try {
    console.log("🚀 Initializing test users...");
    
    // Check if seeding has already been done
    const { data: users, error: queryError } = await supabase
      .from("users")
      .select("email")
      .in("email", testUsers.map(u => u.email));
    
    if (queryError) {
      console.error("❌ Error querying users:", queryError.message);
      return;
    }
    
    console.log(`Found ${users?.length || 0} existing test users out of ${testUsers.length}`);
    
    if (!users || users.length < testUsers.length) {
      console.log("⏳ Some users missing, starting seeding...");
      await seedTestUsers();
    } else {
      console.log("✅ All test users already exist in database");
    }
  } catch (error) {
    console.error("❌ Error initializing test users:", error.message);
  }
}
