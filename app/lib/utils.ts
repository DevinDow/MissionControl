import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind classes with clsx support.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
