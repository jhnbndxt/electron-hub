# User Management System - Demo Guide for Capstone Panel

## Overview
This document explains how the User Registration → Admin Dashboard sync works in Electron Hub.

## How It Works

### 1. **Student Registration Flow**
When a student (e.g., Joshua) creates an account:

1. Navigate to `/register`
2. Fill in the registration form:
   - Full Name: Joshua
   - Email: joshua@email.com
   - Contact Number
   - Date of Birth
   - Gender
   - Password
3. Click "Create Account"

### 2. **Backend Simulation (localStorage)**
The system saves the new user to `localStorage` with key `registered_users`:

```javascript
{
  id: "user-1234567890",
  name: "Joshua",
  email: "joshua@email.com",
  role: "student",
  status: "Active",
  dateCreated: "2026-04-03T12:00:00.000Z"
}
```

### 3. **Real-Time Sync to Admin Dashboard**
- The system triggers a `storage` event
- Admin Dashboard's User Management tab listens for this event
- Table automatically refreshes with the new user
- **Success Toast appears at the top**: "1 New User Registered"

### 4. **Verification in Admin Dashboard**
Login as Super Admin:
- Email: `electronsuperadmin@gmail.com`
- Password: `superadmin`

Navigate to **User Management** tab:
- You will see Joshua's account in the table
- Role: Student (Blue badge)
- Status: Active
- Date Created: Today's date

## Key Features Implemented

### ✅ Real-Time Data Sync
- Storage event listeners detect new registrations
- Admin dashboard updates without page refresh

### ✅ Visual Confirmation
- Top toast notification shows: "X New User(s) Registered"
- Appears for 5 seconds with close button
- Blue theme matching Electron Hub design

### ✅ User Statistics
The header shows:
- **Total Users**: All users in the system
- **Registered**: Users created via registration
- **System**: Pre-configured admin accounts

### ✅ Manual Refresh Button
- Click "Refresh" to manually reload the user list
- Useful if automatic sync doesn't trigger

## Demo Steps for Panel

### Step 1: Show Empty State (Optional)
1. Open browser DevTools → Application → Local Storage
2. Clear `registered_users` to start fresh
3. Show only 3 system users in User Management

### Step 2: Register New Account
1. Open new tab → Navigate to `/register`
2. Fill form with Joshua's details
3. Submit the form
4. Success modal appears

### Step 3: Verify in Admin Dashboard
1. Switch to Admin Dashboard tab
2. Navigate to User Management
3. **See the toast notification**: "1 New User Registered"
4. **See Joshua in the table** with:
   - Name: Joshua
   - Email: joshua@email.com
   - Role: Student (blue badge)
   - Today's date

### Step 4: Show Live Stats Update
1. Point to the stat badges showing updated counts
2. Total Users increased by 1
3. Registered count increased by 1

## Technical Implementation

### Files Modified
1. **Register.tsx** (Lines 31-56)
   - Standardized role to lowercase "student"
   - Added password field to stored data
   - Changed ID format to `user-{timestamp}`
   - Trigger storage event for real-time sync

2. **UserManagement.tsx** (Lines 101-146)
   - Added storage event listeners
   - Real-time table refresh on new user registration
   - Top toast notification system
   - User count statistics in header

### Data Structure
```typescript
{
  id: string,           // "user-1234567890"
  name: string,         // "Joshua"
  email: string,        // "joshua@email.com"
  role: string,         // "student" | "admin" | "superadmin"
  status: string,       // "Active"
  dateCreated: string,  // ISO 8601 timestamp
  password: string,     // Stored for login verification
  contactNumber?: string,
  dateOfBirth?: string,
  gender?: string
}
```

## Troubleshooting

### Toast Not Appearing?
- Click the "Refresh" button manually
- Check browser console for storage events
- Ensure both pages use the same localStorage

### User Not Showing?
1. Click "Refresh" button in User Management
2. Check localStorage in DevTools
3. Look for `registered_users` key
4. Verify JSON format is correct

## Notes for Panel
- This is a **prototype using localStorage** for demonstration
- In production, this would use a real database (Supabase/PostgreSQL)
- localStorage is cleared when browser cache is cleared
- Works across tabs in the same browser session
