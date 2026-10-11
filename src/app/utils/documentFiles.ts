import { supabase } from "../../supabase";

export interface StoredDocumentFile {
  fileName?: string | null;
  filePath?: string | null;
  fileUrl?: string | null;
}

export function resolveDocumentUrl({ filePath, fileUrl }: StoredDocumentFile) {
  if (fileUrl?.startsWith("http://") || fileUrl?.startsWith("https://")) return fileUrl;
  if (filePath?.startsWith("http://") || filePath?.startsWith("https://")) return filePath;
  if (!filePath) return null;
  return supabase.storage.from("enrollment_documents").getPublicUrl(filePath).data.publicUrl || null;
}

export async function downloadDocument(file: StoredDocumentFile) {
  const url = resolveDocumentUrl(file);
  if (!url) throw new Error("The document file is unavailable.");

  const response = await fetch(url);
  if (!response.ok) throw new Error("The document file could not be downloaded.");

  const blobUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = file.fileName || "document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}