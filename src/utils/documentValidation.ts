export const DOCUMENT_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const DOCUMENT_ACCEPT_ATTRIBUTE = "image/png,image/jpeg,.png,.jpg,.jpeg,application/pdf,.pdf";

const ACCEPTED_DOCUMENT_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);
const ACCEPTED_DOCUMENT_EXTENSIONS = new Set(["png", "jpg", "jpeg", "pdf"]);

export const INVALID_DOCUMENT_FILE_MESSAGE =
  "Invalid File: Please upload a PNG, JPG, JPEG, or PDF file with a maximum size of 5 MB.";

export function validateDocumentFile(file: File | null | undefined): string | null {
  if (!file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ACCEPTED_DOCUMENT_TYPES.has(file.type) && !ACCEPTED_DOCUMENT_EXTENSIONS.has(extension)) {
    return INVALID_DOCUMENT_FILE_MESSAGE;
  }

  if (file.size > DOCUMENT_MAX_FILE_SIZE) {
    return INVALID_DOCUMENT_FILE_MESSAGE;
  }

  return null;
}
