export const DOCUMENT_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const DOCUMENT_ACCEPT_ATTRIBUTE = "image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf";

const ACCEPTED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);

export const INVALID_DOCUMENT_FILE_MESSAGE =
  "Invalid file. Please upload a PNG, JPG, JPEG, or PDF file with a maximum size of 5 MB.";

export function validateDocumentFile(file: File | null | undefined): string | null {
  if (!file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const isImage = file.type === "image/png" || file.type === "image/jpeg" || ACCEPTED_IMAGE_EXTENSIONS.has(extension);
  const isPdf = file.type === "application/pdf" || extension === "pdf";
  if (!isImage && !isPdf) {
    return INVALID_DOCUMENT_FILE_MESSAGE;
  }

  if (file.size > DOCUMENT_MAX_FILE_SIZE) {
    return INVALID_DOCUMENT_FILE_MESSAGE;
  }

  return null;
}
