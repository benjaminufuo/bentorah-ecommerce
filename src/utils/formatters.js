/**
 * BENTORAH Utility Formatters
 * Pure functions — no external dependencies
 */

/**
 * Format a number as Nigerian Naira currency
 * @param {number} amount
 * @param {boolean} compact - Use compact notation for large numbers
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount == null || isNaN(amount)) return '₦0';
  if (compact && amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  }
  if (compact && amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a date string or Date object into a readable format
 * @param {string|Date} dateInput
 * @param {object} options - Intl.DateTimeFormat options
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('en-NG', defaultOptions).format(date);
};

/**
 * Format a date as relative time (e.g. "2 days ago")
 * @param {string|Date} dateInput
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

/**
 * Generate a short order reference ID
 */
export const generateOrderId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `NX-${random}`;
};

/**
 * Truncate text to a given number of characters with ellipsis
 */
export const truncate = (text, maxLength = 120) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
};

/**
 * Pluralise a word based on count
 */
export const pluralise = (count, singular, plural) => {
  return count === 1 ? singular : (plural || `${singular}s`);
};
