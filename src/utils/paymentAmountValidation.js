export const PAYMENT_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
export const INVALID_PAYMENT_AMOUNT_MESSAGE = 'Enter a valid amount, like 12 or 12.50.';

export function validatePaymentAmount(value) {
  const normalizedValue = String(value ?? '').trim();

  if (!PAYMENT_AMOUNT_PATTERN.test(normalizedValue)) {
    return INVALID_PAYMENT_AMOUNT_MESSAGE;
  }

  const amount = Number(normalizedValue);
  return Number.isFinite(amount) && amount > 0 ? '' : INVALID_PAYMENT_AMOUNT_MESSAGE;
}