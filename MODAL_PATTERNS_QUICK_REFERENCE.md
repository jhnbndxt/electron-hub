# Quick Reference: Common Modal Patterns

Copy and paste these patterns into your admin pages.

## Pattern 1: Simple Action with Processing Modal

```tsx
// 1. Add imports
import toast, { Toaster } from "react-hot-toast";
import { ProcessingModal } from "../../components/modals/ProcessingModal";

// 2. Add state
const [processingState, setProcessingState] = useState({
  active: false,
  title: "Processing",
  message: "Please wait...",
});

// 3. Add action handler
const handleApprove = async () => {
  setProcessingState({
    active: true,
    title: "Approving Request",
    message: "Processing your approval...",
  });

  try {
    await approvalService.approve(itemId);
    toast.success("Item approved successfully");
    // Update local state or reload data
  } catch (error) {
    toast.error(error.message || "Failed to approve");
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};

// 4. Add to JSX
return (
  <>
    <Toaster position="top-right" />
    <ProcessingModal
      isOpen={processingState.active}
      title={processingState.title}
      message={processingState.message}
    />
    
    <button
      onClick={handleApprove}
      disabled={processingState.active}
      className="... disabled:opacity-70 disabled:cursor-wait"
    >
      Approve
    </button>
  </>
);
```

## Pattern 2: Action with Confirmation Modal

```tsx
// 1. Add state
const [showConfirm, setShowConfirm] = useState(false);
const [processingState, setProcessingState] = useState({
  active: false,
  title: "",
  message: "",
});

// 2. Add action handlers
const handleActionClick = () => {
  setShowConfirm(true);
};

const handleConfirmedAction = async () => {
  setShowConfirm(false);
  setProcessingState({
    active: true,
    title: "Processing Action",
    message: "Please wait while we process this...",
  });

  try {
    await performAction();
    toast.success("Action completed successfully");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};

// 3. Add to JSX
return (
  <>
    <button onClick={handleActionClick} disabled={processingState.active}>
      Perform Action
    </button>

    <ConfirmationModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleConfirmedAction}
      title="Confirm Action"
      message="Are you sure you want to proceed?"
      type="warning"
    />

    <ProcessingModal
      isOpen={processingState.active}
      title={processingState.title}
      message={processingState.message}
    />
  </>
);
```

## Pattern 3: Bulk Action

```tsx
const handleBulkApprove = async (selectedIds: string[]) => {
  if (selectedIds.length === 0) {
    toast.error("Please select at least one item");
    return;
  }

  setProcessingState({
    active: true,
    title: `Approving ${selectedIds.length} Items`,
    message: "Processing bulk approval...",
  });

  try {
    let successCount = 0;
    let failureCount = 0;

    for (const id of selectedIds) {
      try {
        await approvalService.approve(id);
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Failed to approve ${id}:`, error);
      }
    }

    if (failureCount === 0) {
      toast.success(`${successCount} items approved successfully`);
    } else {
      toast.error(
        `${successCount} approved, ${failureCount} failed. Check logs for details.`
      );
    }
  } catch (error) {
    toast.error("Bulk operation failed");
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
    setSelectedIds([]);
  }
};
```

## Pattern 4: Delete/Destructive Action

```tsx
const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

const handleDeleteClick = (item: Item) => {
  setItemToDelete(item);
};

const handleConfirmedDelete = async () => {
  if (!itemToDelete) return;

  setProcessingState({
    active: true,
    title: "Deleting Item",
    message: "Permanently removing item...",
  });

  try {
    await deleteService.delete(itemToDelete.id);
    toast.success("Item deleted successfully");
    setItemToDelete(null);
    // Reload data
  } catch (error) {
    toast.error("Failed to delete item");
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};

return (
  <>
    <button
      onClick={() => handleDeleteClick(item)}
      disabled={processingState.active}
      className="text-red-600 hover:text-red-700"
    >
      Delete
    </button>

    <ConfirmationModal
      isOpen={Boolean(itemToDelete)}
      onClose={() => setItemToDelete(null)}
      onConfirm={handleConfirmedDelete}
      title="Delete Item?"
      message={`Are you sure you want to permanently delete "${itemToDelete?.name}"? This action cannot be undone.`}
      confirmText="Delete"
      type="danger"
    />

    <ProcessingModal
      isOpen={processingState.active}
      title={processingState.title}
      message={processingState.message}
    />
  </>
);
```

## Pattern 5: Document Rejection with Comments

```tsx
const [rejectingItem, setRejectingItem] = useState<Item | null>(null);
const [rejectionReason, setRejectionReason] = useState("");

const handleReject = async () => {
  if (!rejectingItem || !rejectionReason.trim()) {
    toast.error("Please provide a rejection reason");
    return;
  }

  setProcessingState({
    active: true,
    title: "Rejecting Document",
    message: "Processing rejection and notifying student...",
  });

  try {
    await documentService.reject(rejectingItem.id, rejectionReason.trim());
    
    // Notify the student
    await notificationService.notify(rejectingItem.studentId, {
      type: "DOCUMENT_REJECTED",
      message: `Your document was rejected: ${rejectionReason}`,
    });

    toast.success("Document rejected and student notified");
    setRejectingItem(null);
    setRejectionReason("");
  } catch (error) {
    toast.error("Failed to reject document");
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};
```

## Pattern 6: Action with Modal Form

```tsx
const [editingItem, setEditingItem] = useState<Item | null>(null);
const [editFormData, setEditFormData] = useState({});

const handleSubmitEdit = async () => {
  if (!editingItem) return;

  setProcessingState({
    active: true,
    title: "Saving Changes",
    message: "Updating item...",
  });

  try {
    await updateService.update(editingItem.id, editFormData);
    toast.success("Changes saved successfully");
    setEditingItem(null);
    // Reload data
  } catch (error) {
    toast.error("Failed to save changes");
  } finally {
    setProcessingState({ active: false, title: "", message: "" });
  }
};

// Modal Form Component
{editingItem && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 className="text-lg font-bold mb-4">Edit Item</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitEdit();
        }}
      >
        <input
          type="text"
          value={editFormData.name || ""}
          onChange={(e) =>
            setEditFormData({ ...editFormData, name: e.target.value })
          }
          className="w-full px-3 py-2 border rounded mb-4"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditingItem(null)}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processingState.active}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-70"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

## Common Toast Messages

```tsx
// Success
toast.success("Action completed successfully");
toast.success("Item saved");
toast.success("Student enrolled successfully");
toast.success("Document approved");

// Error
toast.error("Something went wrong. Please try again.");
toast.error("Failed to process request");
toast.error("Document already verified");
toast.error("Invalid data provided");

// Info/Warning
toast.loading("Processing...");
toast("This action cannot be undone", { icon: "⚠️" });
```

## Button States

```tsx
// Standard action button
<button
  onClick={handleAction}
  disabled={processingState.active}
  className="bg-blue-600 text-white px-4 py-2 rounded
    hover:bg-blue-700
    disabled:bg-gray-400 disabled:cursor-wait disabled:opacity-70"
>
  Action
</button>

// Danger action button
<button
  onClick={handleDelete}
  disabled={processingState.active}
  className="bg-red-600 text-white px-4 py-2 rounded
    hover:bg-red-700
    disabled:bg-gray-400 disabled:cursor-wait disabled:opacity-70"
>
  Delete
</button>

// Icon button
<button
  onClick={handleApprove}
  disabled={processingState.active}
  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
  title="Approve"
>
  <CheckCircle className="w-5 h-5" />
</button>
```

## Tips

✅ Always wrap long-running operations (> 1 second) with ProcessingModal
✅ Use descriptive titles: "Approving Document" not just "Processing"
✅ Update buttons to `disabled={processingState.active}` to prevent spam-clicking
✅ Always show toast notifications for success/error
✅ Consider the user experience: show what's happening
✅ Test that operations can't be triggered multiple times
✅ Handle errors gracefully with user-friendly messages
