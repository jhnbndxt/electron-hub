ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

COMMENT ON COLUMN users.profile_picture_url IS 'Public URL for the user profile photo stored in Supabase Storage.';