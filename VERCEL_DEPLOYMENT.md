# Vercel Deployment Guide - Electron Hub

Your code is ready for Vercel deployment! Follow these steps to deploy:

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `electron-hub` (or any name you prefer)
3. **DO NOT** initialize with README, .gitignore, or license
4. Click "Create repository"

## Step 2: Push Code to GitHub

Run these commands in your project directory:

```bash
git remote add origin https://github.com/YOUR_USERNAME/electron-hub.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

⚠️ **Important**: Make sure `.env` is in `.gitignore` (it already is) - your Supabase credentials will **NOT** be committed to GitHub.

## Step 3: Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with your GitHub account
3. Click "Import Project"
4. Select your `electron-hub` repository
5. **Framework**: Select "Vite"
6. Leave "Build Command" and "Output Directory" as default (Vercel will auto-detect)

## Step 4: Add Environment Variables in Vercel

Before deploying, add your Supabase environment variables:

1. In Vercel project settings, go to **Settings → Environment Variables**
2. Add these variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://dbockaigmcebayvjkyzm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_A2jfyJDmiWi2KN-OgFP0iw_13vI0pew` |

3. Set both to **Production** environment
4. Click "Save"

## Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like `https://electron-hub-xyz.vercel.app`

## Step 6: Test Deployment

1. Visit your Vercel URL
2. Test login/register with your Supabase credentials
3. Verify database connection is working

## Troubleshooting

### Build Fails
- Check that all environment variables are set in Vercel
- Ensure `.env` is NOT in your git repository (only in local .env)
- Check Vercel logs for specific errors

### App Not Loading
- Clear browser cache and reload
- Check browser console for errors (F12)
- Verify Supabase URL and key are correct in Vercel settings

### Database Connection Errors
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel settings
- Check Supabase project is still active
- Verify no RLS policies are blocking public access

## After Deployment

Once successfully deployed on Vercel, you can:
1. Continue migrating enrollment forms to Supabase
2. Migrate admin dashboards to use Supabase queries
3. Add payment processing
4. Add document verification system

---

**Current Deployment Status**: ✅ Ready for Vercel
**Code Committed**: ✅ Yes
**Environment Variables**: Add in Vercel before deploying
