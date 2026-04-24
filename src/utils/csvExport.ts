/**
 * CSV Export Utility with Electron Hub Branding
 * Exports data to CSV format with consistent branding and styling
 */

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean)[][];
}

export const ELECTRON_BRANDING = {
  primary: '#1E3A8A',      // Electron Blue
  secondary: '#B91C1C',    // Electron Red
  lightGray: '#F3F4F6',    // Light Gray
  darkGray: '#374151',     // Dark Gray
  white: '#FFFFFF',
  success: '#10B981',      // Success Green
};

/**
 * Export data as a CSV file with Electron Hub branding
 */
export const exportToCSV = (options: ExportOptions): void => {
  const { filename, title, subtitle, headers, rows } = options;

  // Build CSV content
  const csvContent: string[] = [];

  // Add title and subtitle if provided
  if (title) {
    csvContent.push(`"${title}"`);
  }
  if (subtitle) {
    csvContent.push(`"${subtitle}"`);
  }
  if (title || subtitle) {
    csvContent.push(''); // Empty line for spacing
  }

  // Add generated date
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  csvContent.push(`"Generated on: ${generatedDate}"`);
  csvContent.push(''); // Empty line for spacing

  // Add headers
  csvContent.push(headers.map((h) => `"${h}"`).join(','));

  // Add data rows
  rows.forEach((row) => {
    csvContent.push(row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  });

  // Add branding footer
  csvContent.push(''); // Empty line
  csvContent.push('"Exported from Electron Hub - Student Management System"');
  csvContent.push(`"${generatedDate}"`);

  // Create blob and download
  const csvString = csvContent.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Format currency for CSV export
 */
export const formatCurrencyForCSV = (amount: number | string): string => {
  if (typeof amount === 'string') {
    return amount;
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

/**
 * Format date for CSV export
 */
export const formatDateForCSV = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time for CSV export
 */
export const formatTimeForCSV = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
