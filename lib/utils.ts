// lib/utils.ts

/**
 * Format a date to Danish format (dd.mm.yyyy)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date to long Danish format (e.g., "15. december 2024")
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format an amount in DKK
 */
export function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions.toFixed(millions >= 10 ? 0 : 1)} mio. kr.`;
  } else if (amount >= 1_000) {
    const thousands = amount / 1_000;
    return `${thousands.toFixed(0)}.000 kr.`;
  }
  return `${amount.toLocaleString('da-DK')} kr.`;
}

/**
 * Calculate days until a deadline
 */
export function daysUntilDeadline(deadline: Date | string): number {
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffTime = d.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a deadline is urgent (14 days or less)
 */
export function isDeadlineUrgent(deadline: Date | string): boolean {
  const days = daysUntilDeadline(deadline);
  return days >= 0 && days <= 14;
}

/**
 * Check if a deadline has expired
 */
export function isDeadlineExpired(deadline: Date | string): boolean {
  return daysUntilDeadline(deadline) < 0;
}

/**
 * Translate source enum to Danish
 */
export function translateSource(source: string): string {
  const translations: Record<string, string> = {
    'DLSC': 'DLSC',
    'INNOVATIONSFONDEN': 'Innovationsfonden',
    'EUHORIZEN': 'EU Horizon',
    'EIC': 'EIC',
    'EUROSTARS': 'Eurostars',
    'ERHVERVSSTYRELSEN': 'Erhvervsstyrelsen',
    'OTHER': 'Andet',
  };
  return translations[source] || source;
}

/**
 * Translate call type enum to Danish
 */
export function translateCallType(type: string): string {
  const translations: Record<string, string> = {
    'GRANT': 'Tilskud',
    'LOAN': 'Lån',
    'EQUITY': 'Egenkapital',
    'VOUCHER': 'Voucher',
    'PRIZE': 'Præmie',
    'OTHER': 'Andet',
  };
  return translations[type] || type;
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a className string from an object of conditions
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
