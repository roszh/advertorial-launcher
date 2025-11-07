import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Quote, MessageSquare, List, Plus, Type, Image, MousePointerClick, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (type: string) => void;
}

export const SectionTemplateModal = ({ open, onOpenChange, onSelectTemplate }: SectionTemplateModalProps) => {
  const templates = [
    {
      category: "Basic",
      items: [
        {
          type: "complete-section",
          name: "Complete Section",
          description: "Headline + Image + Paragraph",
          icon: Plus,
          color: "text-pink-600 dark:text-pink-400"
        },
        {
          type: "text",
          name: "Text",
          description: "Basic paragraph section",
          icon: Type,
          color: "text-blue-600 dark:text-blue-400"
        },
        {
          type: "headline",
          name: "Headline",
          description: "Section heading",
          icon: Type,
          color: "text-purple-600 dark:text-purple-400"
        },
        {
          type: "image",
          name: "Image",
          description: "Image with optional text",
          icon: Image,
          color: "text-green-600 dark:text-green-400"
        },
        {
          type: "cta",
          name: "Button",
          description: "Call-to-action section",
          icon: MousePointerClick,
          color: "text-orange-600 dark:text-orange-400"
        }
      ]
    },
    {
      category: "Enhanced",
      items: [
        {
          type: "quote",
          name: "Quote",
          description: "Styled quotation with author",
          icon: Quote,
          color: "text-indigo-600 dark:text-indigo-400"
        },
        {
          type: "facebook-testimonial",
          name: "Social Testimonial",
          description: "Social proof in Facebook style",
          icon: MessageSquare,
          color: "text-blue-600 dark:text-blue-400"
        },
        {
          type: "bullet-box",
          name: "Bullet Box",
          description: "Colored box with checkmark list",
          icon: List,
          color: "text-emerald-600 dark:text-emerald-400"
        },
        {
          type: "update",
          name: "Update",
          description: "Time-sensitive update notice",
          icon: Bell,
          color: "text-amber-600 dark:text-amber-400"
        }
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Choose a Section Template</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {templates.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {category.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.items.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.type}
                      onClick={() => onSelectTemplate(template.type)}
                      className="group relative flex items-start gap-4 p-4 rounded-lg border border-border bg-background hover:bg-secondary/50 hover:border-primary transition-all duration-200 text-left"
                    >
                      <div className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-secondary/50 group-hover:scale-110 transition-transform",
                        template.color
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <Plus className="flex-shrink-0 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
