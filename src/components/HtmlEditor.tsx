import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Code, Eye } from "lucide-react";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial" | "quote" | "facebook-testimonial" | "bullet-box";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
  author?: string;
  authorRole?: string;
  authorAvatar?: string;
  timestamp?: string;
  reactions?: number;
  items?: string[];
  boxColor?: "green" | "blue" | "purple" | "yellow";
}

interface HtmlEditorProps {
  sections: Section[];
  onSave: (sections: Section[]) => void;
  onClose: () => void;
}

export const HtmlEditor = ({ sections, onSave, onClose }: HtmlEditorProps) => {
  const sectionsToHtml = (sections: Section[]): string => {
    return sections.map((section, idx) => {
      let html = `<!-- Section ${idx + 1} - Type: ${section.type} -->\n`;
      
      if (section.heading) {
        html += `<h2>${section.heading}</h2>\n`;
      }
      
      if (section.imageUrl) {
        html += `<img src="${section.imageUrl}" alt="${section.heading || 'Section image'}" />\n`;
      }
      
      html += `<p>${section.content}</p>\n`;
      
      if (section.type === 'cta') {
        html += `<!-- CTA Section -->\n`;
      }
      
      html += '\n';
      return html;
    }).join('');
  };

  const htmlToSections = (html: string): Section[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newSections: Section[] = [];
    
    // Split by comment markers
    const comments = html.split(/<!--\s*Section\s*\d+\s*-\s*Type:\s*(\w+)\s*-->/);
    
    for (let i = 1; i < comments.length; i += 2) {
      const type = comments[i] as Section["type"];
      const content = comments[i + 1];
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content.trim();
      
      const h2 = tempDiv.querySelector('h2');
      const img = tempDiv.querySelector('img');
      const p = tempDiv.querySelector('p');
      
      const section: Section = {
        type: type || 'text',
        content: p?.textContent || '',
        heading: h2?.textContent || undefined,
        imageUrl: img?.getAttribute('src') || undefined,
        imagePosition: img ? 'full' : 'none',
        style: 'normal'
      };
      
      newSections.push(section);
    }
    
    // Fallback if parsing failed
    if (newSections.length === 0) {
      return sections;
    }
    
    return newSections;
  };

  const [htmlContent, setHtmlContent] = useState(sectionsToHtml(sections));
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = () => {
    try {
      const newSections = htmlToSections(htmlContent);
      onSave(newSections);
      toast({ title: "HTML saved successfully!" });
      onClose();
    } catch (error) {
      toast({ 
        title: "Error parsing HTML", 
        description: "Please check your HTML syntax and try again.",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur z-50 overflow-auto">
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit HTML</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <Code className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button onClick={handleSave}>Save & Close</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>

        {previewMode ? (
          <div className="bg-card rounded-lg p-6 border">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        ) : (
          <Textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="min-h-[70vh] font-mono text-sm"
            placeholder="Edit your HTML here..."
          />
        )}

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Edit the HTML structure carefully. Each section should be wrapped in comment markers 
            like <code className="text-xs bg-background px-1 py-0.5 rounded">{"<!-- Section X - Type: text -->"}</code> 
            to maintain proper structure when saving.
          </p>
        </div>
      </div>
    </div>
  );
};