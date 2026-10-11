import { useState } from "react";
import type { ReactNode } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
import { downloadDocument, type StoredDocumentFile } from "../utils/documentFiles";

interface ConfirmedDownloadButtonProps extends StoredDocumentFile {
  label?: string;
  className?: string;
  children?: ReactNode;
  title?: string;
  onError?: () => void;
}

export function ConfirmedDownloadButton({ fileName, filePath, fileUrl, label = "Download", className, title, children, onError }: ConfirmedDownloadButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const displayName = fileName || "the original file";

  return (
    <>
      <button type="button" title={title} onClick={() => setIsConfirming(true)} className={className}>
        {children || label}
      </button>
      <ConfirmationModal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={async () => {
          try {
            await downloadDocument({ fileName, filePath, fileUrl });
          } catch {
            onError?.();
          } finally {
            setIsConfirming(false);
          }
        }}
        title="Download original file"
        message={`Download ${displayName}?`}
        confirmText="Download"
        type="info"
      />
    </>
  );
}
