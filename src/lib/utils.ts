import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne les classes Tailwind avec gestion des conflits
 * (utilitaire standard shadcn/ui — `cn`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
