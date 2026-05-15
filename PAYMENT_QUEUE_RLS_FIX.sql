-- Fix cashier payment queue visibility for existing Supabase projects.
-- The app uses the payments table as the cashier queue source.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS rejection_comment TEXT;

-- Student payment page needs to create and view the signed-in student's own records.
DROP POLICY IF EXISTS payments_select_own ON payments;
CREATE POLICY payments_select_own ON payments FOR SELECT
  USING (auth.uid()::uuid = student_id);

DROP POLICY IF EXISTS payments_insert_own ON payments;
CREATE POLICY payments_insert_own ON payments FOR INSERT
  WITH CHECK (auth.uid()::uuid = student_id);

-- Cashiers and admin roles need to review and update all payment submissions.
DROP POLICY IF EXISTS payments_select_staff ON payments;
CREATE POLICY payments_select_staff ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND u.role IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin')
    )
  );

DROP POLICY IF EXISTS payments_update_staff ON payments;
CREATE POLICY payments_update_staff ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND u.role IN ('branchcoordinator', 'cashier', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND u.role IN ('branchcoordinator', 'cashier', 'superadmin')
    )
  );

-- Only needed if any older code still reads/writes payment_queue directly.
DROP POLICY IF EXISTS payment_queue_select_staff ON payment_queue;
CREATE POLICY payment_queue_select_staff ON payment_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND u.role IN ('branchcoordinator', 'cashier', 'superadmin')
    )
  );

DROP POLICY IF EXISTS payment_queue_update_staff ON payment_queue;
CREATE POLICY payment_queue_update_staff ON payment_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND u.role IN ('branchcoordinator', 'cashier', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND u.role IN ('branchcoordinator', 'cashier', 'superadmin')
    )
  );
