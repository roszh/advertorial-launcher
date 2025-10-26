import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtmlTags(text: string): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.innerHTML = text;
  return div.textContent || div.innerText || "";
}
