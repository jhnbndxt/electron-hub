export const PAYMENT_AMOUNT_PATTERN = /^0(\.\d{1,2})?$/;
export const INVALID_PAYMENT_AMOUNT_MESSAGE = 'Invalid Amount. Please enter a valid amount based on the required payment.';

export function validatePaymentAmount(value) {
  const normalizedValue = String(value ?? '').trim();

  if (!PAYMENT_AMOUNT_PATTERN.test(normalizedValue)) {
    return INVALID_PAYMENT_AMOUNT_MESSAGE;
  }

  const amount = Number(normalizedValue);
  return Number.isFinite(amount) && amount > 0 ? '' : INVALID_PAYMENT_AMOUNT_MESSAGE;
}