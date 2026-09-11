import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a 0.5–5 star rating for display, e.g. 3.5 -> "3.5". */
export function formatRating(rating: number): string {
  return rating.toFixed(1).replace(/\.0$/, "");
}

/** Rounds an arbitrary number to the nearest 0.5, clamped to [0, 5]. */
export function roundToHalfStar(value: number): number {
  const clamped = Math.min(5, Math.max(0, value));
  return Math.round(clamped * 2) / 2;
}
