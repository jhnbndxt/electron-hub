# 🧪 QUICK SYSTEM TEST SCRIPT

**Use this to quickly verify all fixes are working**

---

## ✅ 1. Verify Clean State

Open browser console (F12) and run:

```javascript
// Check system initialization
console.log('System Initialized:', localStorage.getItem('system_initialized'));
console.log('Init Date:', localStorage.getItem('system_init_date'));

// Check test accounts
const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
console.log('Total Users:', users.length);
console.log('User Emails:', users.map(u => u.email));

// Check empty data structures
console.log('Pending Applications:', JSON.parse(localStorage.getItem('pending_applications') || '[]').length);
console.log('Enrolled Students:', JSON.parse(localStorage.getItem('enrolled_students') || '[]').length);
console.log('Payment Queue:', JSON.parse(localStorage.getItem('payment_queue') || '[]').length);
console.log('Audit Logs:', JSON.parse(localStorage.getItem('audit_logs') || '[]').length);
```

**Expected Output:**
```
System Initialized: true
Init Date: 2026-04-03T...
Total Users: 4
User Emails: [
  "electronbranchcoor@gmail.com",
  "electronregistrar@gmail.com",  
  "electroncashier123@gmail.com",
  "joshua@gmail.com"
]
Pending Applications: 0
Enrolled Students: 0
Payment Queue: 0
Audit Logs: 0
```

---

## ✅ 2. Test New Credentials

### Branch Coordinator
```
URL: http://localhost:3000/login
Email: electronbranchcoor@gmail.com
Password: branchcoor123
Expected: Redirect to /branchcoordinator
```

### Registrar
```
URL: http://localhost:3000/login
Email: electronregistrar@gmail.com
Password: registrar123
Expected: Redirect to /registrar
```

### Cashier
```
URL: http://localhost:3000/login
Email: electroncashier123@gmail.com
Password: cashier123
Expected: Redirect to /cashier
```

### Student
```
URL: http://localhost:3000/login
Email: joshua@gmail.com
Password: root
Expected: Redirect to /dashboard
```

---

## ✅ 3. Test Dashboard Navigation

### Student Dashboard
1. Login as student (joshua@gmail.com)
2. Check task cards
3. Expected: Only 2 cards visible
   - ✓ "Complete AI Assessment"
   - ✓ "Submit Enrollment Documents"
   - ✗ "Explore Strand Offerings" should NOT appear

---

## ✅ 4. Test Assessment Auto-Scroll

1. Login as student
2. Navigate to /dashboard/assessment
3. Answer all questions in first section (Verbal)
4. Click "Next"
5. **Expected:** Page smoothly scrolls to top
6. Repeat for other sections

---

## ✅ 5. Test Admin Navigation

### Registrar Portal
1. Login as Registrar
2. Check sidebar links
3. Click each navigation item:
   - Overview → /registrar
   - Pending Applications → /registrar/pending
   - Student Records → /registrar/students
   - Audit Logs → /registrar/audit-logs
4. Click "Back to Home"
5. **Expected:** Returns to public homepage, session stays active

### Branch Coordinator Portal
1. Login as Branch Coordinator
2. Check sidebar links
3. All links should use /branchcoordinator path
4. Click "Back to Home"
5. **Expected:** Returns to public homepage, session stays active

### Cashier Portal
1. Login as Cashier
2. Check sidebar links
3. All links should use /cashier path
4. Click "Back to Home"
5. **Expected:** Returns to public homepage, session stays active

---

## ✅ 6. Test System Reset

**To reset system to clean state:**

```javascript
// In browser console
localStorage.clear();
location.reload();
```

**After reload, verify:**
- System re-initializes automatically
- Only 4 test accounts exist
- All data arrays are empty

---

## ✅ 7. Test Data Persistence

### Create New Enrollment
1. Login as student
2. Go to Enrollment page
3. Fill out form (partial or complete)
4. Check localStorage:
```javascript
// Should save draft (when autosave implemented)
localStorage.getItem('enrollment_draft');
```

### Submit Enrollment
1. Complete and submit enrollment
2. Check pending applications:
```javascript
JSON.parse(localStorage.getItem('pending_applications') || '[]');
```
3. Expected: New application appears

---

## ✅ 8. Verify Empty Admin Dashboards

### Registrar Dashboard
1. Login as Registrar
2. Navigate to Overview
3. **Expected:**
   - Total Students: 4
   - Pending Applications: 0
   - Verified Documents: 0
   - No pending applications table rows

### Branch Coordinator Dashboard
1. Login as Branch Coordinator
2. Navigate to Overview
3. **Expected:**
   - Statistics show initial state
   - No dummy data
   - Recent Activity: Empty

### Cashier Dashboard
1. Login as Cashier
2. Navigate to Payment Queue
3. **Expected:**
   - Pending Payments: 0
   - Approved Today: 0
   - Rejected Today: 0
   - No payment applications in queue

---

## ✅ 9. Test Credentials Documentation

### Check Files Updated
```
[ ] /CREDENTIALS.md exists
[ ] /DEMO_QUICK_REFERENCE.md has new credentials
[ ] /README.md has new credentials
[ ] /SYSTEM_FIXES_SUMMARY.md exists
```

### Verify Credential Consistency
All 4 files should have identical credentials:
- Branch Coordinator: electronbranchcoor@gmail.com / branchcoor123
- Registrar: electronregistrar@gmail.com / registrar123
- Cashier: electroncashier123@gmail.com / cashier123
- Student: joshua@gmail.com / root

---

## ✅ 10. End-to-End Test

**Complete Flow Test:**

1. **Reset System**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Verify Clean State**
   - Check localStorage
   - Only 4 accounts
   - All arrays empty

3. **Login Tests**
   - Test all 4 credentials
   - Verify navigation works
   - Check dashboards load

4. **Student Flow**
   - Take assessment
   - Verify auto-scroll
   - View results
   - Start enrollment

5. **Admin Flow**
   - Login as Registrar
   - Check empty dashboard
   - Verify navigation
   - Test "Back to Home"

6. **Cross-Portal Test**
   - Login as Branch Coordinator
   - Navigate to User Management
   - Logout
   - Login as Student
   - Verify dashboard loads

---

## 🎯 PASS/FAIL CRITERIA

### PASS ✅
- [ ] All 4 credentials work
- [ ] Navigation paths correct
- [ ] Dashboard shows only 2 task cards
- [ ] Assessment auto-scrolls
- [ ] Admin dashboards empty
- [ ] System initializes clean state
- [ ] Documentation has correct credentials
- [ ] No console errors
- [ ] "Back to Home" works for all admins

### FAIL ❌
- Any credential doesn't work
- Navigation 404 errors
- Dashboard shows 3 task cards
- Assessment doesn't scroll
- Dummy data in dashboards
- System doesn't initialize
- Credential mismatch in docs
- Console errors present
- "Back to Home" broken

---

## 🐛 Common Issues & Fixes

### Issue: Login doesn't work
**Fix:**
```javascript
// Clear localStorage and retry
localStorage.clear();
location.reload();
```

### Issue: Dashboard navigation 404
**Fix:** Check that paths match in layout files
- AdminLayout: /registrar
- SuperAdminLayout: /branchcoordinator
- CashierLayout: /cashier

### Issue: Old data still showing
**Fix:**
```javascript
// Force system reset
import { forceSystemReset } from './utils/initializeSystem';
forceSystemReset();
```

### Issue: Assessment doesn't scroll
**Fix:** Verify handleNext() has:
```typescript
window.scrollTo({ top: 0, behavior: 'smooth' });
```

---

## 📊 Test Results Template

```
Date: ___________
Time: ___________
Tester: __________

Clean State:           [ PASS / FAIL ]
Credentials:           [ PASS / FAIL ]
Dashboard (Student):   [ PASS / FAIL ]
Assessment Scroll:     [ PASS / FAIL ]
Admin Navigation:      [ PASS / FAIL ]
Empty Dashboards:      [ PASS / FAIL ]
Documentation:         [ PASS / FAIL ]
End-to-End:           [ PASS / FAIL ]

Overall Status:        [ PASS / FAIL ]

Notes:
_____________________________________
_____________________________________
_____________________________________
```

---

## 🚀 Quick Commands

**Reset Everything:**
```javascript
localStorage.clear(); location.reload();
```

**View All Users:**
```javascript
console.table(JSON.parse(localStorage.getItem('registered_users') || '[]'));
```

**View System Stats:**
```javascript
console.log({
  users: JSON.parse(localStorage.getItem('registered_users') || '[]').length,
  pending: JSON.parse(localStorage.getItem('pending_applications') || '[]').length,
  enrolled: JSON.parse(localStorage.getItem('enrolled_students') || '[]').length,
  payments: JSON.parse(localStorage.getItem('payment_queue') || '[]').length,
  logs: JSON.parse(localStorage.getItem('audit_logs') || '[]').length
});
```

**Force Reinitialize:**
```javascript
localStorage.removeItem('system_initialized');
location.reload();
```

---

## ✅ Final Checklist

Before demo:
- [ ] Run all 10 tests
- [ ] All tests PASS
- [ ] No console errors
- [ ] All credentials verified
- [ ] Documentation reviewed
- [ ] System in clean state

---

**Use this script before every demo or major test session!**

**Testing Time:** ~10 minutes  
**Last Updated:** April 3, 2026
