import React from 'react';
import { X, FileText } from "lucide-react";

interface DocumentData {
  id: string;
  status: string;
  uploadDate: string;
  fileName: string;
  fileUrl: string | null;
  rejectionComment: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentData: DocumentData;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentName,
  documentData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div className="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Document Viewer</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{documentName}</h3>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
            aria-label="Close document viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Document Display */}
        <div className="flex-1 min-h-0 p-6 bg-gray-950">
          <div className="h-full flex items-center justify-center">
            {documentData.fileUrl ? (
              documentData.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={documentData.fileUrl}
                  alt={documentName}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="mx-auto mb-6 h-24 w-24 text-gray-400" />
                  <p className="text-xl text-gray-300 mb-4">Document Preview</p>
                  <p className="text-base text-gray-400 mb-2">This document type cannot be previewed directly.</p>
                  <p className="text-sm text-gray-500">{documentData.fileName}</p>
                  <div className="mt-6">
                    <a
                      href={documentData.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      <FileText className="h-4 w-4" />
                      Open Document
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center p-8">
                <FileText className="mx-auto mb-6 h-24 w-24 text-gray-400" />
                <p className="text-xl text-gray-300 mb-4">No Preview Available</p>
                <p className="text-base text-gray-400">Document file not found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;