# 🏗️ SYSTEM ARCHITECTURE DIAGRAM
## User Management Data Flow

---

## 📊 HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         ELECTRON HUB                             │
│                  Web-Based Enrollment System                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
         ┌──────────▼──────────┐    ┌───────────▼──────────┐
         │   PUBLIC WEBSITE    │    │   PROTECTED AREAS     │
         │                     │    │                       │
         │  • Home             │    │  • Student Dashboard  │
         │  • About            │    │  • Admin Dashboard    │
         │  • Programs         │    │  • Super Admin        │
         │  • Contact          │    │                       │
         │  • Login            │    │  [Role-Based Access]  │
         │  • Register  ◄──────┼────┼─────► User Mgmt      │
         └─────────────────────┘    └───────────────────────┘
```

---

## 🔄 DATA FLOW: REGISTRATION → ADMIN SYNC

```
┌───────────────────────────────────────────────────────────────────────┐
│                        USER REGISTRATION FLOW                          │
└───────────────────────────────────────────────────────────────────────┘

STEP 1: User Input
┌─────────────────────────┐
│  Student fills form:    │
│  • Name: Joshua         │
│  • Email: joshua@...    │
│  • Password: ******     │
│  • Contact, DOB, etc.   │
└───────────┬─────────────┘
            │
            │ [Submit Form]
            ▼
┌─────────────────────────┐
│   CLIENT-SIDE           │
│   VALIDATION            │
│                         │
│  ✓ Email format         │
│  ✓ Password match       │
│  ✓ Required fields      │
└───────────┬─────────────┘
            │
            │ [Validation Pass]
            ▼
┌─────────────────────────────────────────────────────────┐
│                    REGISTER.TSX                         │
│  handleSubmit() {                                       │
│    const registeredUsers = JSON.parse(                 │
│      localStorage.getItem("registered_users") || "[]"  │
│    );                                                   │
│                                                         │
│    const newUser = {                                   │
│      id: `user-${Date.now()}`,                        │
│      name: formData.fullName,                         │
│      email: formData.email,                           │
│      password: formData.password,                     │
│      role: "student",                                 │
│      status: "Active",                                │
│      dateCreated: new Date().toISOString()           │
│    };                                                  │
│                                                         │
│    registeredUsers.push(newUser);                      │
│    localStorage.setItem("registered_users",            │
│      JSON.stringify(registeredUsers)                  │
│    );                                                   │
│  }                                                      │
└───────────┬─────────────────────────────────────────────┘
            │
            │ [Save to localStorage]
            ▼
┌─────────────────────────────────────────────────────────┐
│            BROWSER LOCAL STORAGE                        │
│                                                         │
│  Key: "registered_users"                               │
│  Value: [                                              │
│    {                                                   │
│      id: "user-1712151234567",                        │
│      name: "Joshua",                                  │
│      email: "joshua@email.com",                       │
│      role: "student",                                 │
│      status: "Active",                                │
│      dateCreated: "2026-04-03T12:34:56.789Z",        │
│      password: "encrypted_or_hashed"                  │
│    }                                                   │
│  ]                                                     │
└───────────┬─────────────────────────────────────────────┘
            │
            │ [Trigger Event]
            ▼
┌─────────────────────────────────────────────────────────┐
│           STORAGE EVENT DISPATCHER                      │
│                                                         │
│  window.dispatchEvent(new StorageEvent('storage', {    │
│    key: 'registered_users',                            │
│    newValue: JSON.stringify(registeredUsers),          │
│    url: window.location.href,                          │
│    storageArea: localStorage                           │
│  }));                                                   │
│                                                         │
│  [Broadcasts to all tabs/windows with same origin]     │
└───────────┬─────────────────────────────────────────────┘
            │
            │ [Event Propagates]
            ▼
┌─────────────────────────────────────────────────────────┐
│                  SUCCESS MODAL                          │
│                                                         │
│          ✓  Account created successfully!               │
│                                                         │
│     Please log in to continue with your                │
│          enrollment application.                        │
│                                                         │
│                    [ OK ]                               │
└─────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD LISTENING                  │
│                                                         │
│  useEffect(() => {                                      │
│    const handleStorageChange = (e: StorageEvent) => {  │
│      if (e.key === 'registered_users') {              │
│        loadUsers(); // Refresh table                  │
│        showToast("1 New User Registered");            │
│      }                                                  │
│    };                                                   │
│                                                         │
│    window.addEventListener('storage',                  │
│      handleStorageChange                              │
│    );                                                   │
│  }, []);                                                │
└───────────┬─────────────────────────────────────────────┘
            │
            │ [Event Received]
            ▼
┌─────────────────────────────────────────────────────────┐
│            USER MANAGEMENT PAGE UPDATE                  │
│                                                         │
│  1. Load new data from localStorage                    │
│  2. Parse and validate user objects                    │
│  3. Update state: setUsers([...systemUsers,            │
│                              ...registeredUsers])       │
│  4. Show toast notification at top                     │
│  5. Update statistics badges                           │
└───────────┬─────────────────────────────────────────────┘
            │
            │ [UI Updates]
            ▼
┌─────────────────────────────────────────────────────────┐
│          VISUAL FEEDBACK TO ADMIN                       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ ✓  1 New User Registered                    │       │
│  │    User database has been updated     [X]   │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Statistics:                                            │
│  [Total Users: 4] [Registered: 1] [System: 3]         │
│                                                         │
│  User Table:                                            │
│  ┌──────────────┬─────────────────┬─────────┬────────┐ │
│  │ Name         │ Email           │ Role    │ Date   │ │
│  ├──────────────┼─────────────────┼─────────┼────────┤ │
│  │ Super Admin  │ ...@gmail.com   │ [Admin] │ Dec 1  │ │
│  │ System Admin │ ...@gmail.com   │ [Admin] │ Dec 15 │ │
│  │ Joshua       │ ...@gmail.com   │ [Stud.] │ Dec 1  │ │
│  │ Joshua NEW!  │ joshua@email... │ [Stud.] │ Apr 3  │ │ ← NEW
│  └──────────────┴─────────────────┴─────────┴────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

```
┌────────────────────────────────────────────────────────────────┐
│                      LOGIN AUTHENTICATION                      │
└────────────────────────────────────────────────────────────────┘

User enters credentials
        │
        ▼
┌─────────────────────┐
│   LOGIN.TSX         │
│  handleSubmit()     │
└──────────┬──────────┘
           │
           ├─────────────────────────────────────┐
           │                                     │
           │ Check System Accounts First:        │
           │                                     │
           ├─► electronsuperadmin@gmail.com?    ─┬─ YES ─► Super Admin Dashboard
           │                                     │
           ├─► electronadmin@gmail.com?         ─┬─ YES ─► Regular Admin Dashboard
           │                                     │
           ├─► joshua@gmail.com? (demo)         ─┴─ YES ─► Student Dashboard
           │
           │ NO MATCH ↓
           │
           ▼
┌────────────────────────────────────────────┐
│  Check localStorage "registered_users"     │
│                                            │
│  const registeredUsers = JSON.parse(       │
│    localStorage.getItem("registered_users")│
│  );                                        │
│                                            │
│  const user = registeredUsers.find(        │
│    u => u.email === enteredEmail           │
│  );                                        │
└──────────────┬─────────────────────────────┘
               │
               ├─────────┬─────────┬─────────┐
               │         │         │         │
          User Found?   YES       NO         │
               │         │         │         │
               │         ▼         ▼         │
               │   ┌─────────┐  Show Error  │
               │   │ Verify  │  "Invalid    │
               │   │Password │   Creds"     │
               │   └────┬────┘              │
               │        │                    │
               │   Password                  │
               │   Matches?                  │
               │        │                    │
               │   ┌────┴────┐               │
               │   │         │               │
               │  YES       NO               │
               │   │         │               │
               │   │    Show Error           │
               │   │         │               │
               │   ▼         ▼               │
               │ Check Role                  │
               │   │                         │
               │   ├─► "student"      → Student Dashboard
               │   │                         │
               │   ├─► "admin"        → Admin Dashboard
               │   │                         │
               │   └─► "superadmin"   → Super Admin Dashboard
               │
               └─────────────────────────────┘
```

---

## 🗄️ DATA STRUCTURE

```
┌────────────────────────────────────────────────────────────────┐
│                    LOCALSTORAGE SCHEMA                         │
└────────────────────────────────────────────────────────────────┘

registered_users: Array<UserAccount>

interface UserAccount {
  id: string;              // "user-1712151234567"
  name: string;            // "Joshua"
  email: string;           // "joshua@email.com"
  role: string;            // "student" | "admin" | "superadmin"
  status: string;          // "Active" | "Inactive"
  dateCreated: string;     // ISO 8601: "2026-04-03T12:34:56.789Z"
  password: string;        // Plain text (prototype) - hash in production
  contactNumber?: string;  // "09123456789"
  dateOfBirth?: string;    // "2005-01-01"
  gender?: string;         // "male" | "female" | "prefer-not-to-say"
}

Example:
{
  "registered_users": [
    {
      "id": "user-1712151234567",
      "name": "Joshua Test",
      "email": "joshua.test@email.com",
      "role": "student",
      "status": "Active",
      "dateCreated": "2026-04-03T15:45:30.123Z",
      "password": "password123",
      "contactNumber": "09123456789",
      "dateOfBirth": "2005-01-01",
      "gender": "male"
    }
  ],
  "audit_logs": [...],
  "current_user": {...}
}
```

---

## 🎨 UI COMPONENT HIERARCHY

```
┌────────────────────────────────────────────────────────────────┐
│                        APP.TSX                                  │
│                    (React Router)                               │
└────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ PUBLIC ROUTES │   │  STUDENT ROUTES  │   │  ADMIN ROUTES   │
│               │   │                  │   │                 │
│ /             │   │ /dashboard       │   │ /admin          │
│ /about        │   │ /profile         │   │ /superadmin     │
│ /programs     │   │ /ai-assessment   │   │                 │
│ /contact      │   │ /results         │   │                 │
│ /login  ◄─────┼───┤ /enrollment      │   │                 │
│ /register     │   │                  │   │                 │
└───────┬───────┘   └──────────────────┘   └────────┬────────┘
        │                                            │
        │                                            │
        ▼                                            ▼
┌────────────────────┐                    ┌──────────────────────┐
│   REGISTER.TSX     │                    │ USERMANAGEMENT.TSX   │
│                    │                    │                      │
│ • Form validation  │────[saves to]─────►│ • Table display      │
│ • Data submission  │    localStorage    │ • Search/Filter      │
│ • Success modal    │                    │ • Edit/Delete        │
│                    │                    │ • Real-time updates  │
│                    │                    │ • Statistics         │
│                    │────[triggers]─────►│ • Toast notification │
│                    │  storage event     │                      │
└────────────────────┘                    └──────────────────────┘
                                                     │
                                                     │
                                          ┌──────────┴──────────┐
                                          │                     │
                                          ▼                     ▼
                                    ┌──────────┐        ┌───────────┐
                                    │ Edit     │        │ Delete    │
                                    │ Modal    │        │ Modal     │
                                    └──────────┘        └───────────┘
```

---

## ⚡ PERFORMANCE CONSIDERATIONS

```
┌────────────────────────────────────────────────────────────────┐
│              OPTIMIZATION STRATEGIES                            │
└────────────────────────────────────────────────────────────────┘

1. EVENT DEBOUNCING
   • Storage events fired max once per registration
   • Toast auto-dismiss after 5 seconds
   • Search/filter debounced by 300ms

2. DATA CACHING
   • Users loaded once on mount
   • Only refreshed on storage event or manual refresh
   • Reduces localStorage reads

3. SELECTIVE RE-RENDERING
   • React state updates only changed components
   • Table rows use React.memo for optimization
   • Stats calculated from existing state (no re-fetch)

4. LAZY LOADING
   • Modals rendered only when opened
   • Toast mounted only when visible
   • Icons loaded on-demand

5. EFFICIENT SEARCH/FILTER
   • Client-side filtering (no backend calls)
   • Filtered in-memory from loaded users
   • Case-insensitive string matching
```

---

## 🔒 SECURITY CONSIDERATIONS

```
┌────────────────────────────────────────────────────────────────┐
│                SECURITY IMPLEMENTATION                          │
└────────────────────────────────────────────────────────────────┘

CURRENT (PROTOTYPE):
✓ Email validation (format check)
✓ Password confirmation (match check)
✓ Role-based routing
✓ Protected routes with AuthContext
✗ Passwords stored in plain text
✗ No XSS protection
✗ No CSRF tokens
✗ Client-side only validation

PRODUCTION RECOMMENDATIONS:
→ Hash passwords (bcrypt, argon2)
→ JWT tokens for session management
→ Server-side validation
→ SQL injection prevention
→ Rate limiting on login attempts
→ Email verification
→ 2FA for admin accounts
→ Audit logging with IP tracking
→ HTTPS only
→ Content Security Policy headers
```

---

## 📱 RESPONSIVE DESIGN

```
┌────────────────────────────────────────────────────────────────┐
│                  BREAKPOINT STRATEGY                            │
└────────────────────────────────────────────────────────────────┘

Mobile (< 768px)
├─ Single column layout
├─ Stacked form fields
├─ Mobile-friendly table (scroll horizontal)
├─ Full-width modals
└─ Touch-friendly buttons (min 44px)

Tablet (768px - 1024px)
├─ Two-column grid for forms
├─ Sidebar navigation (collapsible)
├─ Table with horizontal scroll
└─ Modal max-width: 600px

Desktop (> 1024px)
├─ Full layout with sidebar
├─ Multi-column table
├─ Hover effects on all interactive elements
├─ Modal max-width: 800px
└─ Statistics badges in header
```

---

## 🧪 TESTING STRATEGY

```
┌────────────────────────────────────────────────────────────────┐
│                     TEST COVERAGE                               │
└────────────────────────────────────────────────────────────────┘

Unit Tests (Component Level):
□ Register form validation
□ User Management table rendering
□ Modal open/close behavior
□ Toast notification timing

Integration Tests (Feature Level):
□ Registration → Storage → Admin update flow
□ Login → Dashboard navigation
□ Edit user → Save → Table update
□ Delete user → Confirmation → Removal

End-to-End Tests (User Flow):
□ Complete registration journey
□ Admin monitoring new registrations
□ Cross-tab synchronization
□ Search and filter functionality

Manual Tests (Before Demo):
✓ All flows tested in PRE_DEMO_TEST_CHECKLIST.md
✓ Browser compatibility (Chrome, Firefox, Safari)
✓ Different screen sizes
✓ Edge cases (duplicate emails, long names, etc.)
```

---

**This architecture diagram should help explain the system to your Capstone panel! 🎓**
