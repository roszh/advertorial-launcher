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

export function formatMarkdownText(markdownValue: string): string {
  if (!markdownValue) return "";
  
  // If content is already HTML, return it as-is
  if (markdownValue.includes("<h2") || markdownValue.includes("<strong>") || markdownValue.includes("<a ")) {
    return markdownValue;
  }
  
  // Decode HTML entities (in case content was encoded)
  const div = document.createElement("div");
  div.innerHTML = markdownValue;
  let formatted = div.textContent || div.innerText || markdownValue;
  
  // Subheadline: ## text (convert to h2 tag for semantic HTML)
  formatted = formatted.replace(/^##\s+(.+)$/gm, '<h2 class="text-xl md:text-2xl font-bold mb-4 mt-6 first:mt-0">$1</h2>');
  
  // Links: [text](url)
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Bold: **text** or __text__
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_ (but not already inside bold or links)
  formatted = formatted.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');
  
  // Line breaks: \n to <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}
