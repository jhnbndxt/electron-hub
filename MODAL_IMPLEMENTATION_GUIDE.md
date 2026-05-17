# Modal System Implementation Guide

## Overview
This guide shows how to implement the new ProcessingModal and confirmation flows in admin pages.

## Components Available

### 1. ProcessingModal
Shows a loading state during async operations.

```tsx
import { ProcessingModal } from "../../components/modals/ProcessingModal";

// In your component
const [processingState, setProcessingState] = useState({
  active: false,
  title: "Processing",
  message: "Please wait...",
});

// In JSX
<ProcessingModal
  isOpen={processingState.active}
  title={processingState.title}
  message={processingState.message}
/>

// In your async function
const handleAction = async () => {
  setProcessingState({
    active: true,
    title: "Approving Document",
    message: "Processing document approval...",
  });
  
  try {
    // Your async operation
    await someAsyncFunction();
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};
```

### 2. ConfirmationModal
Shows confirmation before critical actions.

```tsx
import { ConfirmationModal } from "../../components/ConfirmationModal";

// In JSX
<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirmedAction}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
  type="warning"
/>
```

### 3. useAsyncAction Hook
Manages loading states and prevents duplicate requests.

```tsx
import { useAsyncAction } from "../../hooks/useAsyncAction";

const asyncAction = useAsyncAction({
  successMessage: "Action completed",
  errorMessage: "Action failed",
  onSuccess: () => console.log("Success"),
});

// Use it:
await asyncAction.executeAction(async () => {
  // Your async operation
});

// Or with confirmation:
asyncAction.executeWithConfirmation(async () => {
  // Your action
});
```

## Button States Pattern

Always update button disabled states during processing:

```tsx
<button
  onClick={handleApprove}
  disabled={processingState.active}
  className="... disabled:opacity-70 disabled:cursor-wait"
>
  Approve
</button>
```

## Common Patterns for Admin Actions

### Pattern 1: Simple Action with Processing Modal
```tsx
const handleApproveDocument = async () => {
  setProcessingState({
    active: true,
    title: "Approving Document",
    message: "Processing approval...",
  });

  try {
    await updateDocumentStatus(documentId, "approved");
    toast.success("Document approved successfully");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};
```

### Pattern 2: Action with Confirmation + Processing
```tsx
const [showConfirm, setShowConfirm] = useState(false);

const handleApprove = async () => {
  setProcessingState({
    active: true,
    title: "Approving",
    message: "Processing...",
  });

  try {
    await approveAction();
    toast.success("Approved successfully");
    setShowConfirm(false);
  } catch (error) {
    toast.error(error.message);
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};

// In JSX
<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleApprove}
  title="Confirm Approval"
  message="Are you sure?"
/>
```

### Pattern 3: Bulk Actions with Progress
```tsx
const handleBulkApprove = async (selectedIds: string[]) => {
  setProcessingState({
    active: true,
    title: `Approving ${selectedIds.length} Items`,
    message: "Processing bulk approval...",
  });

  try {
    for (const id of selectedIds) {
      await approveItem(id);
    }
    toast.success(`${selectedIds.length} items approved`);
  } catch (error) {
    toast.error(error.message);
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};
```

## Toast Notifications

Always show user feedback:

```tsx
import toast from "react-hot-toast";

// Success
toast.success("Action completed successfully");

// Error
toast.error("Something went wrong. Please try again.");

// Info
toast.loading("Processing...");
```

## Admin Pages to Update

1. **ApplicationReviewPage.tsx** ✅ - DONE
   - Document approval/rejection
   - Application approval/rejection
   - Bulk document approval

2. **AdminDashboard.tsx** - TODO
   - Document review modals
   - Student action buttons
   - Bulk operations

3. **EnrollmentManagement.tsx** - TODO
   - Enrollment status updates
   - Bulk enrollments

4. **BranchCoordinatorPayments.tsx** - TODO
   - Payment verification
   - Payment status changes

5. **UserManagement.tsx** - TODO
   - User role changes
   - Account activations/deactivations

6. **StudentRecords.tsx** - TODO
   - Record updates
   - Deletion confirmations

## Testing the Implementation

1. Click an action button
2. Verify the processing modal appears
3. Verify the button is disabled
4. Wait for operation to complete
5. Verify success/error toast appears
6. Verify modal closes

## Best Practices

✅ Always show a processing modal for > 1 second operations
✅ Disable buttons while processing (prevents spam-clicking)
✅ Show confirmation before destructive actions
✅ Provide clear success/error messages
✅ Keep modal messages concise and user-friendly
✅ Handle errors gracefully
✅ Update UI state after successful operations
