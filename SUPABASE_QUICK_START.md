# Electron Hub - Supabase Setup Quick Start

## ⚡ 5-Minute Quick Start

### Step 1: Create Supabase Account (2 minutes)
```
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create new project (name: "electron-hub", region: closest to you)
5. Wait for setup (Supabase will email you when ready)
```

### Step 2: Get Your Credentials (1 minute)
1. Go to **Settings** → **API**
2. Copy these three values:
   - `Project URL` (looks like: https://xxxxx.supabase.co)
   - `anon public` key
   - `service_role` key (keep this SECRET!)

### Step 3: Create Environment File (1 minute)
Create `.env.local` in project root:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

### Step 4: Deploy Database Schema (1 minute)
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `SUPABASE_SCHEMA.sql` from this project
4. Copy ALL the content
5. Paste in Supabase SQL Editor
6. Click **Run** button
7. Wait for "Success" message

✅ **Done!** Your database is now set up.

---

## 📦 Installation

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client File
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Verify Setup
```bash
npm run dev
```
Open browser console and run:
```javascript
import { supabase } from './lib/supabase.ts';
await supabase.from('users').select('*').limit(1);
```

If you see no errors, you're connected! ✅

---

## 🔄 Migration: localStorage → Supabase

### Option A: Manual Entry (Quick)
For testing, manually create records via Supabase UI:
1. Go to **Table Editor**
2. Click **users** table
3. Click **Insert** button
4. Enter test data
5. Repeat for other tables

### Option B: Data Export & Import (Recommended)

#### Export from localStorage:
```typescript
// In browser console on your site with data
const backup = {
  users: JSON.parse(localStorage.getItem('registered_users') || '[]'),
  enrollments: JSON.parse(localStorage.getItem('pending_applications') || '[]'),
  payments: JSON.parse(localStorage.getItem('payment_queue') || '[]'),
};

console.log(JSON.stringify(backup, null, 2));
// Copy the output and save as backup.json
```

#### Import to Supabase:
```typescript
import { supabase } from '@/lib/supabase';

const data = await fetch('./backup.json').then(r => r.json());

// Insert users
await supabase.from('users').insert(data.users);

// Insert enrollments
await supabase.from('enrollments').insert(data.enrollments);

// etc...
```

---

## 🔌 Update Your React Code

### Replace localStorage Calls

**OLD (localStorage):**
```typescript
const enrollments = JSON.parse(localStorage.getItem('pending_applications') || '[]');
```

**NEW (Supabase):**
```typescript
const { data: enrollments, error } = await supabase
  .from('enrollments')
  .select('*')
  .eq('status', 'pending');
```

### Common Replacements

#### Login
```typescript
// OLD
const user = registeredUsers.find(u => u.email === email);

// NEW
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();
```

#### Save Enrollment
```typescript
// OLD
const apps = JSON.parse(localStorage.getItem('pending_applications') || '[]');
apps.push(newEnrollment);
localStorage.setItem('pending_applications', JSON.stringify(apps));

// NEW
const { data, error } = await supabase
  .from('enrollments')
  .insert([newEnrollment])
  .select()
  .single();
```

#### Get User's Data
```typescript
// OLD
const userDraft = JSON.parse(localStorage.getItem(`enrollment_draft_${email}`) || '{}');

// NEW
const { data: draft, error } = await supabase
  .from('enrollment_drafts')
  .select('form_data')
  .eq('student_id', userId)
  .single();
```

#### Save Progress
```typescript
// OLD
localStorage.setItem(`enrollment_progress_${email}`, JSON.stringify(progress));

// NEW
await supabase
  .from('enrollment_progress')
  .upsert({
    student_id: userId,
    step_name: 'Documents Verified',
    status: 'completed',
    completed_at: new Date().toISOString(),
  }, 
  { onConflict: 'student_id,step_name' }
);
```

#### Update Payment Status
```typescript
// OLD
const paymentQueue = JSON.parse(localStorage.getItem('payment_queue') || '[]');
const payment = paymentQueue.find(p => p.studentEmail === email);
payment.status = 'verified';
localStorage.setItem('payment_queue', JSON.stringify(paymentQueue));

// NEW
await supabase
  .from('payments')
  .update({ status: 'verified' })
  .eq('student_id', studentId);
```

---

## 🔐 Authentication Setup

### Simple Email/Password Auth

Create `src/services/auth.ts`:
```typescript
import { supabase } from '@/lib/supabase';

export async function login(email: string, password: string) {
  // Get user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  // Simple password check (TODO: use bcrypt in production!)
  if (user.password_hash !== password) {
    throw new Error('Invalid password');
  }

  return user;
}

export async function register(email: string, password: string, fullName: string) {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password_hash: password, // TODO: hash this!
      full_name: fullName,
      role: 'student',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Using Supabase Auth (Recommended for Production)
```typescript
// Supabase handles password hashing automatically
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();
```

---

## 🎯 Common Tasks

### Get Current Student's Enrollment
```typescript
const { data: enrollment, error } = await supabase
  .from('enrollments')
  .select('*, assessment_results(*), payments(*)')
  .eq('student_id', currentUserId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### List Pending Enrollments (Admin)
```typescript
const { data: pendingApps } = await supabase
  .from('enrollments')
  .select('*, users(full_name, email)')
  .eq('status', 'pending')
  .order('submitted_at', { ascending: true });

// Display in table
pendingApps.forEach(app => {
  console.log(app.users.full_name, app.status);
});
```

### Create Payment
```typescript
const { data: payment } = await supabase
  .from('payments')
  .insert([{
    student_id: studentId,
    enrollment_id: enrollmentId,
    payment_method: 'gcash',
    amount: 15000.00,
    reference_number: 'GCH-20240101-12345',
    status: 'submitted',
  }])
  .select()
  .single();
```

### Send Notification
```typescript
await supabase
  .from('notifications')
  .insert([{
    user_id: studentId,
    type: 'PAYMENT_APPROVED',
    title: 'Payment Approved',
    message: 'Your payment of ₱15,000 has been verified!',
  }]);
```

### Log Admin Action
```typescript
await supabase
  .from('audit_logs')
  .insert([{
    user_id: adminUserId,
    action: 'enrollment_approved',
    resource_type: 'enrollment',
    resource_id: enrollmentId,
    changes: { status: 'pending → approved' },
  }]);
```

---

## 🐛 Debugging

### Check Database Connection
```typescript
// In browser console
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('users')
  .select('count()', { count: 'exact', head: true });

console.log(error ? `Error: ${error.message}` : `Connected! Total users: ${data}`);
```

### View Real-Time Logs
In Supabase dashboard:
1. Go to **Logs** (left sidebar)
2. Click **API** 
3. Watch requests in real-time

### Check RLS Policies
If getting "permission denied" errors:
1. Go to **Table Editor**
2. Select table showing error
3. Click **Policies** (button at top)
4. Verify policies are correct for your user role

### Monitor Database Size
In Supabase dashboard:
1. Go to **Home**
2. Look for "Database size" card
3. If approaching limit, enable auto-backup

---

## 🚀 Testing

### Login Test
```bash
# Test with default credentials
Email: joshua@gmail.com
Password: root
```

### Enrollment Test
1. Login as student
2. Fill enrollment form
3. Check Supabase **Table Editor** → **enrollments** table
4. Should see new record with status='pending'

### Admin Dashboard Test
1. Logout
2. Login as admin: electronregistrar@gmail.com / registrar123
3. Go to admin dashboard
4. Should see pending enrollments

### Payment Test
1. Login as student
2. Go to Payment page
3. Submit payment
4. Check **payments** table in Supabase
5. Status should be 'submitted'

---

## 📚 File Structure

After setup, your project should have:

```
electron-hub/
├── .env.local                          (NEW)
├── SUPABASE_SCHEMA.sql                 (NEW)
├── SUPABASE_INTEGRATION_GUIDE.md       (NEW)
├── DATABASE_SCHEMA_REFERENCE.md        (NEW)
├── src/
│   ├── lib/
│   │   └── supabase.ts                 (NEW)
│   ├── services/
│   │   ├── auth.ts                     (NEW/UPDATED)
│   │   ├── enrollment.ts               (NEW/UPDATED)
│   │   ├── payment.ts                  (NEW/UPDATED)
│   │   └── assessment.ts               (NEW/UPDATED)
│   └── app/
│       └── context/
│           └── AuthContext.tsx         (UPDATED)
└── ... (rest of files unchanged)
```

---

## ✅ Checklist

- [ ] Supabase account created
- [ ] Credentials copied to `.env.local`
- [ ] Schema deployed to database
- [ ] Supabase client file created (`src/lib/supabase.ts`)
- [ ] npm install @supabase/supabase-js completed
- [ ] Connection test passed
- [ ] One service file updated (auth/enrollment/payment)
- [ ] Login tested
- [ ] Data appears in Supabase dashboard

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.io
- **This Project Guide:** `SUPABASE_INTEGRATION_GUIDE.md`
- **Database Reference:** `DATABASE_SCHEMA_REFERENCE.md`

---

## ⚠️ Important Notes

1. **Never commit `.env.local`** to git
2. **Hash passwords** in production (use bcrypt)
3. **Enable RLS policies** for security
4. **Test backup restoration** monthly
5. **Keep service keys SECRET** - never expose in frontend
6. **Use environment variables** for sensitive config
7. **Log all admin actions** to audit_logs

---

## 🎉 Next Steps

1. ✅ Set up Supabase (you are here)
2. → Update authentication system
3. → Migrate enrollment form
4. → Migrate payment system
5. → Set up admin dashboards
6. → Deploy to production

Happy coding! 🚀
