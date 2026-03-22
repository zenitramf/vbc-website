import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// oxlint-disable-next-line func-style
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
