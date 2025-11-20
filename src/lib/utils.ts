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
  
  // Check if content already has HTML block tags
  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|li|br)\b[^>]*>/i.test(markdownValue);
  
  let formatted = markdownValue;
  
  // If content has HTML block tags, clean it up and preserve structure
  if (hasBlockHtml) {
    // Remove excessive whitespace between HTML tags
    formatted = formatted.replace(/>\s+</g, '><');
    
    // Convert markdown links even in HTML context
    formatted = formatted.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Convert markdown bold/italic only if not already in HTML tags
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    formatted = formatted.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
    
    // Don't add <br> tags if HTML already has block structure
    return formatted;
  }
  
  // For plain text/markdown content (no HTML blocks)
  // Subheadline: ## text (convert to h2 tag for semantic HTML)
  formatted = formatted.replace(
    /^##\s+(.+)$/gm,
    '<h2 class="text-xl md:text-2xl font-bold mb-4 mt-6 first:mt-0">$1</h2>'
  );
  
  // Links: [text](url)
  formatted = formatted.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Bold: **text** or __text__
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic (lookbehind-free): *text* or _text_, not part of bold
  formatted = formatted.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  formatted = formatted.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
  
  // Line breaks: \n to <br> (only for non-HTML content)
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Calculate new dimensions (max width 1200px)
        let { width, height } = img;
        const maxWidth = 1200;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          0.85
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}
