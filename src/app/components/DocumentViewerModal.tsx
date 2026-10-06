import React, { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, X } from "lucide-react";
import { downloadDocument, resolveDocumentUrl } from "../utils/documentFiles";
import { ConfirmationModal } from "./ConfirmationModal";

interface DocumentData {
  id: string;
  status: string;
  uploadDate: string;
  fileName: string;
  fileUrl: string | null;
  filePath?: string | null;
  rejectionComment: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentData: DocumentData;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, documentName, documentData }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [confirmingDownload, setConfirmingDownload] = useState(false);
  const [previewType, setPreviewType] = useState<"pdf" | "image" | "unknown">("unknown");
  const fileUrl = resolveDocumentUrl(documentData);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setIsLoading(true);
    setLoadError(!fileUrl);
    setDownloadError(false);
    const fileHint = `${documentData.fileName || ""} ${documentData.filePath || ""} ${documentData.fileUrl || ""}`;
    const extensionType = /\.pdf(?:[?#]|$)/i.test(fileHint)
      ? "pdf"
      : /\.(jpg|jpeg|png|gif|webp)(?:[?#]|$)/i.test(fileHint)
        ? "image"
        : "unknown";
    setPreviewType(extensionType);
    let active = true;
    if (fileUrl && extensionType === "unknown") {
      fetch(fileUrl, { method: "HEAD" })
        .then((response) => {
          if (!active) return;
          const contentType = response.headers.get("content-type") || "";
          setPreviewType(contentType.includes("pdf") ? "pdf" : contentType.startsWith("image/") ? "image" : "unknown");
        })
        .catch(() => undefined);
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, a, iframe, img");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [documentData.fileName, documentData.filePath, documentData.fileUrl, fileUrl, isOpen, onClose]);

  if (!isOpen) return null;
  const handleDownload = () => setConfirmingDownload(true);
  const confirmDownload = async () => {
    await downloadDocument(documentData).catch(() => setDownloadError(true));
    setConfirmingDownload(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 z-[10001] flex items-center justify-center p-4 lg:left-[var(--dashboard-sidebar-offset,0px)]">
      <div className="absolute inset-0 bg-white/35 backdrop-blur-sm" onClick={onClose} />
      <ConfirmationModal
        isOpen={confirmingDownload}
        onClose={() => setConfirmingDownload(false)}
        onConfirm={confirmDownload}
        title="Download original file"
        message={`Download ${documentData.fileName || documentName}?`}
        confirmText="Download"
        type="info"
      />
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="document-viewer-title" className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Document Viewer</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 id="document-viewer-title" className="text-lg font-semibold text-gray-900">{documentName}</h3>
              {documentData.status && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{documentData.status}</span>}
            </div>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-600" aria-label="Close document viewer"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto bg-gray-950 p-6">
          <div className="flex min-h-[360px] items-center justify-center">
            {fileUrl && !loadError ? (
              previewType === "pdf" ? (
                <iframe src={fileUrl} title={`${documentName} PDF preview`} className="h-[70vh] min-h-[360px] w-full rounded bg-white" onLoad={() => setIsLoading(false)} onError={() => { setIsLoading(false); setLoadError(true); }} />
              ) : previewType === "image" ? (
                <img src={fileUrl} alt={documentName} className="max-h-[70vh] max-w-full object-contain" onLoad={() => setIsLoading(false)} onError={() => { setIsLoading(false); setLoadError(true); }} />
              ) : (
                <div className="p-8 text-center"><FileText className="mx-auto mb-6 h-24 w-24 text-gray-400" /><p className="mb-2 text-xl text-gray-300">Preview unavailable</p><p className="mb-6 text-base text-gray-400">This file type cannot be previewed in the browser.</p><button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"><Download className="h-4 w-4" />Download original file</button></div>
              )
            ) : (
              <div className="p-8 text-center"><FileText className="mx-auto mb-6 h-24 w-24 text-gray-400" /><p className="mb-2 text-xl text-gray-300">Preview unavailable</p><p className="text-base text-gray-400">The uploaded file is missing or could not be loaded.</p>{fileUrl && <button onClick={handleDownload} className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"><Download className="h-4 w-4" />Download original file</button>}</div>
            )}
            {isLoading && fileUrl && !loadError && <div className="absolute inline-flex items-center gap-2 rounded-lg bg-black/70 px-4 py-3 text-sm text-white"><Loader2 className="h-4 w-4 animate-spin" />Loading preview...</div>}
          </div>
          {downloadError && <p role="alert" className="mt-3 text-center text-sm text-red-300">The original file could not be downloaded.</p>}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
