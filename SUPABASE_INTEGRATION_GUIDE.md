# Supabase Integration Guide for Electron Hub

## 📋 Table of Contents
1. [Getting Started with Supabase](#getting-started)
2. [Setting Up the Database](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Migration from localStorage](#migration-guide)
5. [Frontend Integration](#frontend-integration)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started with Supabase

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project (choose PostgreSQL version 15+)
4. Wait for project initialization (5-10 minutes)

### Step 2: Copy Project Credentials
From your Supabase dashboard:
```
- Project URL: https://[project-id].supabase.co
- Anon Public Key: [your-anon-key]
- Service Role Key: [your-service-key]
- Database Password: [your-db-password]
```

---

## 🗄️ Database Setup

### Step 1: Import the Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `SUPABASE_SCHEMA.sql`
4. Paste into the SQL editor
5. Click **Run**

The schema will create all necessary tables, indexes, and security policies.

### Step 2: Initialize Sample Data
The schema includes sample data insertion. To verify:
1. Go to **Table Editor**
2. Click on `users` table
3. You should see 5 test accounts

---

## ⚙️ Environment Configuration

### Step 1: Create `.env.local`
Create a file in your project root:

```bash
# .env.local
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
```

**Never commit this file to git!** Add to `.gitignore`:
```
.env.local
.env.*.local
```

### Step 2: Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Step 3: Create Supabase Client
Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 🔄 Migration from localStorage

### Data Mapping Reference

```
localStorage Key          →    Supabase Table
─────────────────────────────────────────────────────
registered_users          →    users
pending_applications      →    enrollments (status='pending')
enrolled_students         →    enrollments (status='enrolled')
enrollment_draft_*        →    enrollment_drafts
assessmentResults_*       →    assessment_results
assessmentHistory_*       →    assessment_results (multiple rows)
payment_queue             →    payments
cash_payment_queue        →    payment_queue
notifications             →    notifications
audit_logs                →    audit_logs
enrollment_progress_*     →    enrollment_progress
```

### Migration Steps

#### 1. Export localStorage Data
Create a script `scripts/export-data.js`:

```javascript
export function exportLocalStorageData() {
  const data = {
    registered_users: JSON.parse(localStorage.getItem('registered_users') || '[]'),
    pending_applications: JSON.parse(localStorage.getItem('pending_applications') || '[]'),
    enrolled_students: JSON.parse(localStorage.getItem('enrolled_students') || '[]'),
    notifications: JSON.parse(localStorage.getItem('notifications') || '[]'),
    audit_logs: JSON.parse(localStorage.getItem('audit_logs') || '[]'),
    payment_queue: JSON.parse(localStorage.getItem('payment_queue') || '[]'),
  };
  
  // Download as JSON file
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'electron-hub-backup.json';
  link.click();
}
```

#### 2. Create Migration Service
Create `src/services/migration.ts`:

```typescript
import { supabase } from '@/lib/supabase';

export async function migrateUsersData(users: any[]) {
  const { data, error } = await supabase
    .from('users')
    .insert(
      users.map(u => ({
        email: u.email,
        password_hash: u.password, // IMPORTANT: Hash passwords!
        full_name: u.name,
        role: u.role || 'student',
        admin_type: u.adminType,
      }))
    );
  
  if (error) throw error;
  return data;
}

export async function migrateEnrollments(enrollments: any[], studentIdMap: Map<string, string>) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert(
      enrollments.map(app => ({
        student_id: studentIdMap.get(app.studentId),
        ...app,
        submitted_at: new Date(app.submittedAt),
        approved_at: app.approvedAt ? new Date(app.approvedAt) : null,
      }))
    );
  
  if (error) throw error;
  return data;
}

export async function migratePayments(payments: any[], studentIdMap: Map<string, string>) {
  const { data, error } = await supabase
    .from('payments')
    .insert(
      payments.map(p => ({
        student_id: studentIdMap.get(p.studentEmail),
        payment_method: p.paymentMode,
        amount: 15000.00,
        reference_number: p.referenceNumber,
        status: p.status,
        submitted_at: p.submittedDate ? new Date(p.submittedDate) : null,
      }))
    );
  
  if (error) throw error;
  return data;
}
```

---

## 🔌 Frontend Integration

### Update AuthContext
Create new `src/services/authService.ts`:

```typescript
import { supabase } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs'; // Install: npm install bcryptjs

export async function loginUser(email: string, password: string) {
  // Fetch user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !user) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password (in production, use bcrypt)
  const isPasswordValid = password === user.password_hash; // ⚠️ In production, use bcrypt comparison
  
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }
  
  return user;
}

export async function registerUser(email: string, password: string, fullName: string) {
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'student',
      }
    ])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### Update EnrollmentForm
Replace localStorage calls with Supabase:

```typescript
// OLD (localStorage)
// const existingApplications = JSON.parse(localStorage.getItem('pending_applications') || '[]');

// NEW (Supabase)
export async function checkExistingEnrollment(studentId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .in('status', ['pending', 'approved', 'enrolled'])
    .single();
  
  return { data, error };
}

export async function submitEnrollment(enrollment: any) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([enrollment])
    .select()
    .single();
  
  if (error) throw error;
  
  // Log to audit
  await supabase
    .from('audit_logs')
    .insert([{
      action: 'enrollment_submitted',
      resource_type: 'enrollment',
      resource_id: data.id,
    }]);
  
  return data;
}

export async function autosaveDraft(studentId: string, formData: any) {
  const { error } = await supabase
    .from('enrollment_drafts')
    .upsert({
      student_id: studentId,
      form_data: formData,
      last_saved: new Date().toISOString(),
    });
  
  if (error) throw error;
}
```

### Realtime Subscription Example
For live updates:

```typescript
import { supabase } from '@/lib/supabase';

export function subscribeToNotifications(userId: string) {
  return supabase
    .from('notifications')
    .on('INSERT', (payload) => {
      console.log('New notification:', payload.new);
      // Update UI
    })
    .subscribe();
}

export function subscribeToEnrollmentStatus(enrollmentId: string) {
  return supabase
    .from('enrollments')
    .on('UPDATE', (payload) => {
      if (payload.new.id === enrollmentId) {
        console.log('Enrollment updated:', payload.new);
        // Update UI
      }
    })
    .subscribe();
}
```

---

## 📚 API Reference

### Users API

```typescript
// Get current user
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();

// Update profile
await supabase
  .from('users')
  .update({ full_name: 'New Name' })
  .eq('id', userId);

// List admin users
const { data: admins } = await supabase
  .from('users')
  .select('*')
  .in('role', ['registrar', 'cashier', 'branchcoordinator']);
```

### Enrollments API

```typescript
// Get student's enrollment
const { data: enrollment } = await supabase
  .from('enrollments')
  .select('*')
  .eq('student_id', studentId)
  .order('created_at', { ascending: false })
  .single();

// Get pending enrollments (admin view)
const { data: pendingApps } = await supabase
  .from('enrollments')
  .select('*')
  .eq('status', 'pending')
  .order('submitted_at', { ascending: true });

// Approve enrollment
await supabase
  .from('enrollments')
  .update({
    status: 'approved',
    approved_at: new Date().toISOString(),
  })
  .eq('id', enrollmentId);

// Get enrollment documents
const { data: docs } = await supabase
  .from('enrollment_documents')
  .select('*')
  .eq('enrollment_id', enrollmentId);
```

### Payments API

```typescript
// Submit payment
await supabase
  .from('payments')
  .insert([{
    student_id: studentId,
    enrollment_id: enrollmentId,
    payment_method: 'bank',
    amount: 15000.00,
    reference_number: refNum,
    status: 'submitted',
  }]);

// Get payment queue
const { data: queue } = await supabase
  .from('payment_queue')
  .select('*')
  .eq('queue_date', today)
  .order('queue_time', { ascending: true });

// Update payment status
await supabase
  .from('payments')
  .update({ status: 'verified' })
  .eq('id', paymentId);
```

### Assessment API

```typescript
// Save assessment result
await supabase
  .from('assessment_results')
  .insert([{
    student_id: studentId,
    assessment_date: new Date().toISOString().split('T')[0],
    recommended_track: 'STEM',
    elective_1: 'Physics',
    elective_2: 'Biology',
    verbal_ability_score: 85,
    mathematical_ability_score: 92,
    spatial_ability_score: 88,
    logical_reasoning_score: 90,
    overall_score: 89,
  }]);

// Get latest assessment
const { data: latest } = await supabase
  .from('assessment_results')
  .select('*')
  .eq('student_id', studentId)
  .order('assessment_date', { ascending: false })
  .limit(1)
  .single();
```

### Notifications API

```typescript
// Create notification
await supabase
  .from('notifications')
  .insert([{
    user_id: userId,
    type: 'ENROLLMENT_APPROVED',
    title: 'Your enrollment has been approved!',
    message: 'You can now proceed to payment.',
  }]);

// Get unread notifications
const { data: unread } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false });

// Mark as read
await supabase
  .from('notifications')
  .update({ is_read: true, read_at: new Date().toISOString() })
  .eq('id', notificationId);
```

---

## 🔒 Security Best Practices

### 1. Password Hashing
NEVER store passwords in plain text.

```typescript
import * as bcrypt from 'bcryptjs';

// Hashing
const hashedPassword = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. Environment Variables
```bash
# .env.local (never commit)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3. Row Level Security (RLS)
The schema includes RLS policies. Always use authenticated user context:

```typescript
// User can only access their own data
const { data } = await supabase
  .from('enrollments')
  .select('*')
  .eq('student_id', currentUserId); // This will be filtered by RLS
```

### 4. Audit Logging
Log all critical actions:

```typescript
await supabase
  .from('audit_logs')
  .insert([{
    user_id: userId,
    action: 'enrollment_approved',
    resource_type: 'enrollment',
    resource_id: enrollmentId,
    changes: { status: 'pending → approved' },
  }]);
```

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase configuration"
**Solution:** Check `.env.local` file has correct values

### Issue: "RLS Policy denying access"
**Solution:** Ensure user is authenticated and policies allow the operation

### Issue: "Connection timeout"
**Solution:** 
- Check internet connection
- Verify Supabase project is running
- Check firewall/VPN settings

### Issue: "Duplicate key error"
**Solution:** Check for unique constraints in schema, verify no duplicate migrations

### Issue: "File upload failing"
**Solution:** 
1. Enable Storage in Supabase dashboard
2. Create `documents` bucket (Settings > Storage)
3. Set public access if needed

---

## 📝 TypeScript Types

Create `src/types/database.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'registrar' | 'branchcoordinator' | 'cashier' | 'superadmin';
  admin_type?: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'enrolled' | 'dropped';
  first_name: string;
  last_name: string;
  email: string;
  // ... other fields
  submitted_at?: string;
  approved_at?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  enrollment_id: string;
  payment_method: 'bank' | 'gcash' | 'cash';
  amount: number;
  status: 'pending' | 'submitted' | 'verified' | 'approved';
  reference_number?: string;
  submitted_at?: string;
}

export interface AssessmentResult {
  id: string;
  student_id: string;
  recommended_track: string;
  elective_1: string;
  elective_2: string;
  overall_score: number;
  assessment_date: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
```

---

## 🚀 Deployment Checklist

- [ ] Database schema deployed to Supabase
- [ ] Environment variables set in production
- [ ] Passwords hashed using bcrypt
- [ ] RLS policies tested and enabled
- [ ] Audit logging implemented
- [ ] File storage configured (if needed)
- [ ] Backups scheduled in Supabase
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up
- [ ] CORS configured for your domain
- [ ] API tokens rotated regularly

---

## 📞 Support

For issues:
1. Check [Supabase Docs](https://supabase.com/docs)
2. Review this guide's Troubleshooting section
3. Check browser console for errors
4. Enable Supabase debug logging

Good luck with your migration! 🎉
