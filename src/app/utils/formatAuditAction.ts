const ACTION_LABELS: Record<string, string> = {
  PAYMENT_RECEIVED: "Payment Received",
  PAYMENT_REJECTED: "Payment Rejected",
  PAYMENT_VERIFIED: "Payment Verified",
};

export function formatAuditAction(action?: string | null) {
  const normalized = String(action || "Unknown Action").trim();
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized];

  return normalized
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}