# ✅ PRE-DEMO TEST CHECKLIST
## Verify Everything Works Before Panel Presentation

---

## 🧪 TEST SEQUENCE (Do this 30 minutes before presentation)

### Test 1: Fresh Start ⏱️ 2 minutes
```
1. Open browser DevTools (F12)
2. Go to: Application → Storage → Local Storage
3. Delete all keys:
   - registered_users
   - audit_logs
   - current_user
   - Any other electron-related keys
4. Close DevTools
5. Refresh the page (Ctrl+R or Cmd+R)
```

**Expected:** Clean slate, no registered users

---

### Test 2: System Login ⏱️ 1 minute
```
1. Navigate to /login
2. Enter credentials:
   Email: electronsuperadmin@gmail.com
   Password: admin1234
3. Click "Login"
```

**Expected:**
- ✅ Redirects to /superadmin dashboard
- ✅ Shows "Super Admin" dashboard with full sidebar
- ✅ Blue theme visible

---

### Test 3: User Management Initial State ⏱️ 1 minute
```
1. In Super Admin dashboard
2. Click "User Management" in sidebar
3. Check the page loads correctly
```

**Expected:**
- ✅ Header shows "User Management"
- ✅ Stats show:
  - Total Users: 3
  - Registered: 0
  - System: 3
- ✅ Table shows 3 users:
  - Super Administrator (superadmin@gmail.com)
  - System Admin (electronadmin@gmail.com)
  - Joshua (joshua@gmail.com)
- ✅ All have red "Super Admin" / yellow "Admin" / blue "Student" badges
- ✅ "Refresh" and "Add User" buttons visible

---

### Test 4: Registration Flow ⏱️ 2 minutes
```
1. Open NEW TAB (keep admin dashboard open)
2. Navigate to /register
3. Fill form:
   Full Name:        Test Student
   Email:           test@student.com
   Contact Number:  09123456789
   Date of Birth:   January 1, 2005
   Gender:          Male
   Password:        testpass123
   Confirm Password: testpass123
4. Click "Create Account"
```

**Expected:**
- ✅ Success modal appears with green checkmark
- ✅ Message: "Account created successfully!"
- ✅ "OK" button visible

---

### Test 5: Real-Time Sync Verification ⏱️ 1 minute
```
1. Click "OK" on success modal
2. IMMEDIATELY switch to Admin Dashboard tab
3. Look at User Management page
```

**Expected:**
- ✅ Blue toast appears at TOP of page:
  "1 New User Registered"
  "User database has been updated"
- ✅ Stats automatically update:
  - Total Users: 4
  - Registered: 1
  - System: 3
- ✅ Table shows new row:
  - Name: Test Student
  - Email: test@student.com
  - Role: Student (blue badge)
  - Date Created: Today's date
- ✅ Toast auto-dismisses after ~5 seconds

---

### Test 6: New User Login ⏱️ 1 minute
```
1. In admin tab, click logout (or open new tab)
2. Navigate to /login
3. Enter credentials:
   Email: test@student.com
   Password: testpass123
4. Click "Login"
```

**Expected:**
- ✅ Redirects to /dashboard (Student Dashboard)
- ✅ Shows student name in header
- ✅ Blue theme visible
- ✅ Limited sidebar menu (no admin options)

---

### Test 7: Admin Features ⏱️ 2 minutes
```
1. Login as Super Admin again
2. Go to User Management
3. Find "Test Student" row
4. Click the Edit button (pencil icon)
```

**Expected:**
- ✅ Modal opens with title "Edit User Role"
- ✅ Shows email: test@student.com
- ✅ Three role options with radio buttons:
  - Student (selected)
  - Admin
  - Superadmin
- ✅ "Cancel" and "Save Changes" buttons

```
5. Select "Admin" role
6. Click "Save Changes"
```

**Expected:**
- ✅ Modal closes
- ✅ Toast appears: "User role updated successfully!"
- ✅ Table row updates to show yellow "Admin" badge

---

### Test 8: Manual Refresh ⏱️ 30 seconds
```
1. In User Management page
2. Click "Refresh" button (top right)
```

**Expected:**
- ✅ Toast appears: "User list refreshed"
- ✅ Table data reloads
- ✅ Stats remain accurate
- ✅ No console errors

---

### Test 9: Search & Filter ⏱️ 1 minute
```
1. In search box, type: "Test"
2. Check filtered results
3. Clear search
4. In role filter dropdown, select: "Student"
5. Check filtered results
```

**Expected:**
- ✅ Search shows only matching users
- ✅ Filter shows only students
- ✅ Footer shows correct count: "Showing X of Y users"

---

### Test 10: Delete User ⏱️ 1 minute
```
1. Find "Test Student" row
2. Click trash icon (delete button)
```

**Expected:**
- ✅ Confirmation modal appears
- ✅ Shows warning icon and message
- ✅ "Cancel" and "Delete User" buttons

```
3. Click "Delete User"
```

**Expected:**
- ✅ Modal closes
- ✅ Toast appears: "User deleted successfully!"
- ✅ Row removed from table
- ✅ Stats update:
  - Total Users: 3
  - Registered: 0
  - System: 3

---

### Test 11: Add User (Admin Function) ⏱️ 2 minutes
```
1. Click "Add User" button
2. Fill form:
   Full Name:  Admin Test
   Email:     admin@test.com
   Role:      Admin
   Password:  admin123
3. Click "Create User"
```

**Expected:**
- ✅ Modal closes
- ✅ Toast appears: "User created successfully!"
- ✅ New row appears in table
- ✅ Stats update:
  - Total Users: 4
  - Registered: 1

---

### Test 12: Cross-Tab Sync (BONUS TEST) ⏱️ 2 minutes
```
1. Keep User Management open in Tab 1
2. Open NEW TAB (Tab 2)
3. Go to /register
4. Register another user:
   Name:  Cross Tab Test
   Email: crosstab@test.com
   Password: test123
5. Watch Tab 1 (User Management)
```

**Expected:**
- ✅ Toast appears in Tab 1 automatically
- ✅ Table updates without manual refresh
- ✅ Stats update in Tab 1

---

## 🚨 COMMON ISSUES & FIXES

### Issue: Toast doesn't appear
**Fix:**
- Check browser console (F12 → Console)
- Click "Refresh" button manually
- Verify localStorage has data (F12 → Application → Local Storage)

### Issue: User shows with wrong role
**Fix:**
- Role should be lowercase: "student", "admin", "superadmin"
- Clear localStorage and re-register

### Issue: Login fails for new user
**Fix:**
- Verify email matches exactly (check for typos)
- Verify password matches registration
- Try system account: electronsuperadmin@gmail.com / admin1234

### Issue: Stats not updating
**Fix:**
- Click "Refresh" button
- Check localStorage data integrity
- Reload page (Ctrl+R)

### Issue: Table shows duplicate users
**Fix:**
- Open DevTools → Console
- Run: `localStorage.removeItem('registered_users')`
- Reload page

---

## 📋 FINAL VERIFICATION CHECKLIST

Before presenting to panel:

**Visual Checks:**
- [ ] All text readable and properly styled
- [ ] Blue theme (#1E3A8A) consistent throughout
- [ ] Icons render correctly (no broken images)
- [ ] Toast appears at TOP center of screen
- [ ] Buttons have hover effects
- [ ] Table rows have hover effect
- [ ] No console errors (F12 → Console should be clean)

**Functional Checks:**
- [ ] Registration creates new user
- [ ] User appears in admin table
- [ ] Toast notification shows
- [ ] Stats update correctly
- [ ] Login works with new credentials
- [ ] Edit role functionality works
- [ ] Delete user functionality works
- [ ] Refresh button works
- [ ] Search functionality works
- [ ] Filter functionality works

**Data Checks:**
- [ ] User object has all fields:
  - id, name, email, role, status, dateCreated, password
- [ ] Role is lowercase: "student" not "Student"
- [ ] dateCreated is ISO format: "2026-04-03T12:00:00.000Z"
- [ ] ID format: "user-1234567890"

**Browser Checks:**
- [ ] Test in Chrome (primary)
- [ ] No console errors
- [ ] localStorage works
- [ ] Multiple tabs work
- [ ] Toast appears in correct position

---

## 🎬 READY TO DEMO?

If all tests pass:
✅ You're ready for the panel presentation!

If any test fails:
❌ Review the fix for that specific issue above
❌ Re-run the test until it passes
❌ Don't proceed until all critical tests pass

---

## 📞 EMERGENCY BACKUP PLAN

If something breaks during demo:

**Option 1: Quick Fix**
```javascript
// Open browser console (F12)
// Paste this to reset everything:
localStorage.clear();
location.reload();
```

**Option 2: Demo with Test Component**
```
Navigate to the UserManagementDemo component
Use the simulation buttons to show functionality
Explain the technical implementation
```

**Option 3: Show Code**
```
If all else fails, walk through the code:
- Register.tsx (lines 31-56)
- UserManagement.tsx (lines 101-146)
Explain the logic and architecture
```

---

**Last Updated:** April 3, 2026
**Test Duration:** ~15 minutes
**Confidence Level:** Ready for Panel ✅

---

## 📸 SCREENSHOTS CHECKLIST

Take these screenshots AFTER successful testing:

1. [ ] User Management page (initial state, 3 system users)
2. [ ] Registration form filled out
3. [ ] Success modal after registration
4. [ ] Toast notification appearing at top
5. [ ] Updated table with new user (4 users)
6. [ ] Updated statistics (Total: 4, Registered: 1, System: 3)
7. [ ] Edit role modal
8. [ ] Delete confirmation modal
9. [ ] Search functionality in action
10. [ ] Role filter in action

These screenshots can be used as backup slides if live demo has technical issues!

---

**Good luck! 🎓 You've got this! 💪**
