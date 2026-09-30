export const escapeCSVCell = (cell) => {
  const value = typeof cell === 'string' && /^[=+\-@\t\r]/.test(cell)
    ? `'${cell}`
    : String(cell);

  return `"${value.replace(/"/g, '""')}"`;
};

export const formatCurrencyForCSV = (amount) => {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount.toFixed(2) : '0.00';
};