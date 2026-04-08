# 🔑 Electron Hub System Credentials

**Last Updated:** April 3, 2026

---

## System Login Credentials

### Branch Coordinator (formerly Super Admin)
```
Email:    electronbranchcoor@gmail.com
Password: branchcoor123
Portal:   /branchcoordinator
Access:   Full system control, User Management, System Configuration
```

**Capabilities:**
- Complete system oversight
- User management (create/edit/delete users)
- System configuration access
- Security policies management
- API integrations management
- Billing oversight
- Audit log access
- All features of Registrar and Cashier

---

### Registrar (formerly Regular Admin)
```
Email:    electronregistrar@gmail.com
Password: registrar123
Portal:   /registrar
Access:   Limited admin functions
```

**Capabilities:**
- Pending applications review
- Student records management
- Application approval/rejection
- Document verification
- Audit logs (view only)
- No user management access
- No system configuration access

---

### Cashier (New Role)
```
Email:    electroncashier123@gmail.com
Password: cashier123
Portal:   /cashier
Access:   Payment management only
```

**Capabilities:**
- Payment queue management
- Payment approval/rejection
- Payment history viewing
- Audit logs (payment-related only)
- No access to student records
- No user management access

---

### Demo Student Account
```
Email:    joshua@gmail.com
Password: root
Portal:   /dashboard
Access:   Student dashboard only
```

**Student Features:**
- AI assessment access
- Enrollment form submission
- Document upload
- Payment submission
- Track enrollment progress
- View results and recommendations

---

## Test Registration Data

Use this data when demonstrating new user registration:

```
Full Name:      Joshua Test
Email:          joshua.test@email.com
Password:       password123
Contact:        09123456789
Date of Birth:  January 1, 2005
Gender:         Male
```

---

## Role Hierarchy

```
┌──────────────────────────────────────┐
│      Branch Coordinator              │
│      (Full System Access)            │
└──────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼───────┐  ┌──────▼──────┐
│   Registrar   │  │   Cashier   │
│   (Students)  │  │  (Payments) │
└───────────────┘  └─────────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │    Students     │
        │  (Enrollment)   │
        └─────────────────┘
```

---

## Portal URLs

### Production URLs (when deployed)
- **Public Site:** `https://electronhub.com`
- **Student Portal:** `https://electronhub.com/dashboard`
- **Registrar Portal:** `https://electronhub.com/registrar`
- **Branch Coordinator Portal:** `https://electronhub.com/branchcoordinator`
- **Cashier Portal:** `https://electronhub.com/cashier`

### Development URLs (local)
- **Public Site:** `http://localhost:3000`
- **Student Portal:** `http://localhost:3000/dashboard`
- **Registrar Portal:** `http://localhost:3000/registrar`
- **Branch Coordinator Portal:** `http://localhost:3000/branchcoordinator`
- **Cashier Portal:** `http://localhost:3000/cashier`

---

## Legacy Redirects

For backwards compatibility, the following URLs automatically redirect:

- `/admin` → `/registrar`
- `/superadmin` → `/branchcoordinator`

Legacy email credentials still work but redirect to new roles:
- `electronsuperadmin@gmail.com` → Branch Coordinator portal
- `electronadmin@gmail.com` → Registrar portal

---

## Quick Access Guide

### "I need to manage the entire system"
→ Use **Branch Coordinator** account

### "I need to review student applications"
→ Use **Registrar** account

### "I need to process payments"
→ Use **Cashier** account

### "I need to test student enrollment"
→ Use **Student** account (joshua@gmail.com)

### "I need to demo new user registration"
→ Use test data: joshua.test@email.com

---

## Security Notes

**⚠️ Important for Production:**

1. **Change all default passwords** before deploying to production
2. **Use environment variables** for sensitive credentials
3. **Implement password hashing** (bcrypt recommended)
4. **Enable JWT authentication** for secure sessions
5. **Add rate limiting** to prevent brute force attacks
6. **Implement 2FA** for admin accounts
7. **Use HTTPS** for all production traffic

**Current Status:** Demo/Development only - NOT production ready

---

## Common Issues & Solutions

### "I can't login with these credentials"
1. Verify email is exactly as shown (case-sensitive)
2. Ensure password is correct (case-sensitive)
3. Try clearing browser cache and cookies
4. Check if you're on the correct login page
5. Verify localStorage hasn't been corrupted

### "I'm logged in but can't access a portal"
1. Check your role matches the portal you're accessing
2. Verify you're using the correct URL
3. Try logging out and logging back in
4. Check browser console for errors

### "The system shows 'Invalid Credentials'"
1. Double-check email spelling
2. Verify password (no extra spaces)
3. Try copying and pasting from this document
4. Clear localStorage: `localStorage.clear(); location.reload();`

---

## Data Storage (Development)

All user data is currently stored in browser localStorage:

```javascript
// View all users
JSON.parse(localStorage.getItem('registered_users'))

// View system users
JSON.parse(localStorage.getItem('system_users'))

// View pending applications
JSON.parse(localStorage.getItem('pending_applications'))

// Clear all data (reset)
localStorage.clear()
```

---

## For Demo Presentations

**Recommended Demo Flow:**

1. Start with **Branch Coordinator** login
2. Show user management features
3. Open new tab for student registration
4. Register new user (use test data above)
5. Watch real-time sync on admin dashboard
6. Login as new user to show student portal

**Pro Tip:** Keep this document open during demos for quick credential reference!

---

## Contact & Support

For credential issues or access problems:
1. Check this document first
2. Review troubleshooting section
3. Check browser console for errors
4. Verify localStorage data structure

---

**Remember:** These are development/demo credentials. Always use secure, unique credentials in production environments!

---

**Status:** Development/Demo
**Security Level:** Low (local testing only)
**Production Ready:** ❌ No - Requires security hardening