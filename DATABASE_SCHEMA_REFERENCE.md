# Electron Hub - Database Schema Reference

## 🗂️ Table Overview

### Core Tables (14 Total)

| Table | Purpose | Records Type |
|-------|---------|--------------|
| **users** | User accounts | 1 per user (student, admin, cashier, etc.) |
| **enrollments** | Student enrollment applications | 1+ per student |
| **enrollment_documents** | Uploaded documents (Form 137, etc.) | Multiple per enrollment |
| **enrollment_progress** | Student's enrollment step tracking | Multiple per student |
| **assessment_results** | AI assessment scores & recommendations | Multiple per student |
| **payments** | Payment submissions (bank, gcash, online) | 1+ per enrollment |
| **payment_queue** | Cash payment queue tickets | 1 per cash payment |
| **sections** | Grade level sections (11A-STEM-01, etc.) | Multiple per year |
| **section_assignments** | Student assignments to sections | 1+ per enrollment |
| **notifications** | System notifications to users | Multiple per user |
| **audit_logs** | Activity logging | Multiple per action |
| **enrollment_drafts** | Autosaved form drafts | 1 per student |
| **academic_records** | Grades & academic history | 1 per semester |
| **system_settings** | Configuration & system parameters | 1 per setting |

---

## 📊 Entity Relationship Diagram

```
                                  ┌─────────────────┐
                                  │     USERS       │
                                  │─────────────────│
                                  │ id (UUID)       │
                                  │ email (UNIQUE)  │
                                  │ password_hash   │
                                  │ full_name       │
                                  │ profile_picture_url │
                                  │ role            │
                                  │ admin_type      │
                                  │ created_at      │
                                  └────────┬────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    │                      │                      │
        ┌───────────▼────────────┐  ┌─────▼──────────────┐  ┌────▼───────────────┐
        │  ENROLLMENTS           │  │  ASSESSMENT_       │  │  NOTIFICATIONS     │
        │───────────────────────────│   RESULTS          │  │───────────────────│
        │ id (UUID)              │  │───────────────────│  │ id (UUID)          │
        │ student_id (FK→users)  │  │ id (UUID)          │  │ user_id (FK→users) │
        │ status                 │  │ student_id (FK)    │  │ type               │
        │ application_number     │  │ assessment_date    │  │ title              │
        │ first_name...          │  │ recommended_track  │  │ message            │
        │ last_name...           │  │ overall_score      │  │ is_read            │
        │ email...               │  │ scores (breakdown) │  │ created_at         │
        │ (25+ fields)           │  │ top_domains (JSON) │  └────────────────────┘
        │ submitted_at           │  │ created_at         │
        │ approved_at            │  └────────────────────┘
        │ approved_by (FK→users) │
        └──────────┬─────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        │          │          │
   ┌────▼──────┐  │  ┌───────▼───────┐     ┌──────────────────┐
   │ ENROLLMENT│  │  │    PAYMENTS    │     │ PAYMENT_QUEUE    │
   │DOCUMENTS  │  │  │────────────────│     │──────────────────│
   │──────────────│ │ id (UUID)      │     │ id (UUID)        │
   │ id (UUID)    │ │ student_id (FK)│     │ student_id (FK)  │
   │ enrollment_id│ │ enrollment_id  │     │ queue_number     │
   │  (FK)        │ │ payment_method │     │ queue_date       │
   │ document_type│ │ amount         │     │ queue_time       │
   │ file_path    │ │ status         │     │ status           │
   │ verified     │ │ reference_num  │     │ paid_at          │
   │ verified_by  │ │ submitted_at   │     └──────────────────┘
   │  (FK)        │ │ verified_at    │
   │             │ │ verified_by(FK)│
   └────────────┘ │ created_at      │
                  └────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   ┌────▼────────────────┐         ┌─────▼──────────────────┐
   │ ENROLLMENT_PROGRESS │         │  SECTION_ASSIGNMENTS   │
   │────────────────────│         │──────────────────────────│
   │ id (UUID)          │         │ id (UUID)               │
   │ student_id (FK)    │         │ enrollment_id (FK)      │
   │ step_name          │         │ section_id (FK)         │
   │ status             │         │ assigned_at             │
   │ completed_at       │         │ assigned_by (FK→users)  │
   │ created_at         │         │ status                  │
   └────────────────────┘         └────────┬────────────────┘
                                          │
                              ┌───────────▼──────────┐
                              │    SECTIONS          │
                              │──────────────────────│
                              │ id (UUID)            │
                              │ section_code         │
                              │ grade_level          │
                              │ track                │
                              │ adviser_id (FK)      │
                              │ capacity             │
                              │ school_year          │
                              │ semester             │
                              └──────────────────────┘

Additional Tables (Not shown for clarity):
- ENROLLMENT_DRAFTS: Auto-saved form data
- ACADEMIC_RECORDS: Grade tracking
- AUDIT_LOGS: Activity history
- SYSTEM_SETTINGS: Configuration
```

---

## 🔗 Key Relationships

### One-to-Many Relationships

```
USERS (1) ──→ (many) ENROLLMENTS
  └─ One user can have multiple enrollment records (re-enrollment, etc.)

USERS (1) ──→ (many) ASSESSMENT_RESULTS
  └─ One student takes multiple assessments over time

USERS (1) ──→ (many) NOTIFICATIONS
  └─ One user receives many notifications

USERS (1) ──→ (many) AUDIT_LOGS
  └─ One admin performs many actions

ENROLLMENTS (1) ──→ (many) ENROLLMENT_DOCUMENTS
  └─ One enrollment has multiple documents (Form 137, 138, etc.)

ENROLLMENTS (1) ──→ (many) PAYMENTS
  └─ One enrollment can have multiple payment attempts

ENROLLMENTS (1) ──→ (many) SECTION_ASSIGNMENTS
  └─ One enrollment may be assigned to sections over time

SECTIONS (1) ──→ (many) SECTION_ASSIGNMENTS
  └─ One section has many student assignments
```

### References/Constraints

```
enrollments.student_id      → users.id
enrollments.approved_by     → users.id
enrollment_documents.verified_by → users.id
assessment_results.student_id → users.id
payments.student_id         → users.id
payments.enrollment_id      → enrollments.id
payments.verified_by        → users.id
payment_queue.student_id    → users.id
payment_queue.processed_by  → users.id
sections.adviser_id         → users.id
section_assignments.enrollment_id → enrollments.id
section_assignments.section_id → sections.id
section_assignments.assigned_by → users.id
enrollment_progress.student_id → users.id
enrollment_drafts.student_id → users.id
notifications.user_id       → users.id
audit_logs.user_id          → users.id
academic_records.student_id → users.id
academic_records.enrollment_id → enrollments.id
system_settings.updated_by  → users.id
```

---

## 📋 Data Type Reference

| Type | Size | Uses |
|------|------|------|
| **UUID** | 16 bytes | Primary/Foreign keys, globally unique |
| **VARCHAR(n)** | n bytes | Text, emails, names (fixed max length) |
| **TEXT** | variable | Long text, notes, addresses |
| **TIMESTAMP with TIME ZONE** | 8 bytes | Dates/times with timezone |
| **DATE** | 4 bytes | Birth dates, assessment dates |
| **TIME** | 8 bytes | Queue times, schedules |
| **BOOLEAN** | 1 byte | Flags (is_working_student, etc.) |
| **SMALLINT** | 2 bytes | Scores (0-100), year levels |
| **INTEGER** | 4 bytes | Large counters |
| **BIGINT** | 8 bytes | File sizes, large numbers |
| **DECIMAL(10,2)** | 16 bytes | Money (₱15,000.00) |
| **JSONB** | variable | Complex nested data |
| **INET** | 4/16 bytes | IP addresses |

---

## 🔐 Security & Indexes

### Indexes (for performance)

```sql
-- Users
idx_users_email                    -- For login lookups
idx_users_role                     -- For admin queries

-- Enrollments
idx_enrollments_student_id         -- Get student's enrollments
idx_enrollments_status             -- Filter by status
idx_enrollments_submitted_at       -- Timeline queries

-- Payments
idx_payments_student_id            -- Get student's payments
idx_payments_status                -- Filter by status
idx_payments_submitted_at          -- Recent payment queries

-- Payment Queue
idx_payment_queue_student_id       -- Find student's queue position
idx_payment_queue_status           -- Filter queue
idx_payment_queue_date             -- Daily reports

-- Notifications
idx_notifications_user_id          -- Get user's notifications
idx_notifications_is_read          -- Show unread first
idx_notifications_created_at       -- Recent notifications first

-- Documents
idx_enrollment_documents_enrollment_id -- Get enrollment's documents
idx_enrollment_documents_type      -- Filter by doc type

-- Progress
idx_enrollment_progress_student_id -- Get student's progress
```

### Row Level Security (Enabled)

Users can only see/modify their own data by default.

### Recent Users Table Addition

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
```

Use this column to store the public Supabase Storage URL for each user's profile photo so student avatars sync across sessions and devices.

---

## 📊 Common Query Patterns

### Get Student Dashboard Summary
```sql
SELECT 
  e.id,
  e.first_name,
  e.last_name,
  e.status as enrollment_status,
  COALESCE(p.status, 'not_submitted') as payment_status,
  ar.recommended_track,
  ar.overall_score
FROM enrollments e
LEFT JOIN payments p ON e.id = p.enrollment_id
LEFT JOIN assessment_results ar ON e.student_id = ar.student_id
WHERE e.student_id = $studentId;
```

### Get Admin Dashboard Stats
```sql
SELECT 
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'enrolled' THEN 1 END) as enrolled,
  SUM(CASE WHEN p.status = 'approved' THEN 1 ELSE 0 END) as payments_collected
FROM enrollments e
LEFT JOIN payments p ON e.id = p.enrollment_id
WHERE e.submitted_at >= NOW() - INTERVAL '1 year';
```

### Get Enrollment Progress
```sql
SELECT 
  step_name,
  status,
  completed_at
FROM enrollment_progress
WHERE student_id = $studentId
ORDER BY 
  CASE step_name
    WHEN 'Account Created' THEN 1
    WHEN 'AI Assessment Completed' THEN 2
    WHEN 'Documents Submitted' THEN 3
    WHEN 'Documents Verified' THEN 4
    WHEN 'Payment Submitted' THEN 5
    WHEN 'Payment Verified' THEN 6
    WHEN 'Enrolled' THEN 7
  END;
```

---

## 💾 Storage Estimates

For 1,000 students with full enrollment cycle:

| Table | Rows | Size |
|-------|------|------|
| users | 1,050 | ~250 KB |
| enrollments | 1,000 | ~1.5 MB |
| enrollment_documents | 5,000 | ~500 KB |
| assessment_results | 1,500 | ~200 KB |
| payments | 1,200 | ~150 KB |
| notifications | 10,000 | ~1 MB |
| **Total** | **~20,000** | **~4-5 MB** |

*Note: Actual size depends on content length and document storage location (Supabase Storage vs. URLs)*

---

## 🔄 Backup Strategy

Supabase provides:
- ✅ Daily automated backups (7-day retention)
- ✅ Point-in-time recovery
- ✅ Manual backup exports
- ✅ Replication to backup server

**Recommended:**
1. Enable daily backups (default)
2. Export critical tables weekly
3. Test recovery monthly
4. Keep 30-day backup copies

---

## 📈 Scalability Considerations

Current schema scales to:
- **10,000+ students** without performance issues
- **100,000+ records** with proper indexing
- **Real-time updates** via Supabase Realtime subscriptions

For larger deployments:
- Add read replicas
- Implement caching (Redis)
- Archive old academic records
- Partition audit logs by date

---

## 🔧 Maintenance Guidelines

### Weekly
- [ ] Monitor database size
- [ ] Check for slow queries
- [ ] Review audit logs

### Monthly
- [ ] Analyze table statistics
- [ ] Test backup restoration
- [ ] Review security logs
- [ ] Check for unused indexes

### Quarterly
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Capacity planning

---

## 📞 Quick Reference

**Total Tables:** 14
**Total Relationships:** 20+
**Total Indexes:** 20+
**Estimated Records (1000 students):** ~20,000
**Estimated Size:** ~5 MB (without file storage)
**RLS Policies:** 6 (for data protection)
**Triggers:** 7 (for automatic timestamps)

For more details, see `SUPABASE_SCHEMA.sql`
