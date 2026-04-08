import { supabase } from "../lib/supabase"

const testInsert = async () => {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email: "test123@gmail.com",
        password_hash: "123456",
        full_name: "Test User",
        role: "student"
      }
    ])

  console.log(data, error)
}

testInsert()
