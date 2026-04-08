import { supabase } from "../utils/supabaseClient";

// Test users to seed into Supabase
const testUsers = [
  {
    email: "electronbranchcoor@gmail.com",
    password: "branchcoor123",
    name: "Branch Coordinator",
    role: "Branch Coordinator"
  },
  {
    email: "electronregistrar@gmail.com",
    password: "registrar123",
    name: "Registrar",
    role: "Registrar"
  },
  {
    email: "electroncashier123@gmail.com",
    password: "cashier123",
    name: "Cashier",
    role: "Cashier"
  },
  {
    email: "joshua@gmail.com",
    password: "root",
    name: "Joshua",
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
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
      });
      
      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        continue;
      }
      
      const userId = authData.user?.id;
      
      // Add user to users table
      const { error: dbError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: user.email,
          name: user.name,
          role: user.role,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (dbError) {
        console.error(`Error inserting user ${user.email} to database:`, dbError);
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
    
    if (!users || users.length === 0) {
      await seedTestUsers();
    } else {
      console.log("Test users already exist in database");
    }
  } catch (error) {
    console.error("Error initializing test users:", error);
  }
}
