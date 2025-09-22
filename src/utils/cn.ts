import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: string[]) {
  // Merge class names
  return twMerge(clsx(inputs));
}
