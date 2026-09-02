import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a UTC date string for display in the user's locale. */
export function formatDate(date: string | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, opts).format(new Date(date));
}

/** Format kickoff time as HH:MM */
export function formatKickoff(date: string | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(date),
  );
}

/** Format a date as "Sat 30 Jul" */
export function formatMatchDay(date: string | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

/** Relative time: "3 minutes ago", "in 2 hours", etc. */
export function relativeTime(date: string | undefined): string {
  if (!date) return '—';
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}
