import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigError =
  !supabaseUrl || supabaseUrl.includes('your-project-id') || !supabaseAnonKey || supabaseAnonKey.includes('your_supabase_anon_key_here')
    ? 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the Vite server.'
    : null

export const supabase = createClient(
  supabaseUrl || 'https://dbockaigmcebayvjkyzm.supabase.co',
  supabaseAnonKey || 'sb_publishable_A2jfyJDmiWi2KN-OgFP0iw_13vI0pew'
)
