import { useState } from "react";
import { Button } from "./ui/button";
import { Trash2, AlertCircle, Copy, Plus, Type, Image as ImageIcon, MousePointerClick, Quote, MessageSquare, List, Bell, Edit2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SectionControlsProps {
  index: number;
  onAddSectionBelow: (type: string) => void;
  onDeleteSection: () => void;
  onCloneSection?: () => void;
  onOpenEditor?: () => void;
  className?: string;
  onDeleteHover?: (isHovering: boolean) => void;
}

export const SectionControls = ({
  index,
  onAddSectionBelow,
  onDeleteSection,
  onCloneSection,
  onOpenEditor,
  className,
  onDeleteHover
}: SectionControlsProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
      return;
    }
    onDeleteSection();
    setShowDeleteConfirm(false);
  };

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-4 opacity-0 group-hover:opacity-100 transition-all duration-300",
      className
    )}>
      <div className="flex gap-1 bg-background border rounded-lg shadow-lg p-1 animate-fade-in z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="hover-scale"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-background z-50" align="center">
            <DropdownMenuLabel>Basic</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAddSectionBelow("complete-section")} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Complete Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSectionBelow("text")} className="cursor-pointer">
              <Type className="h-4 w-4 mr-2" />
              Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSectionBelow("headline")} className="cursor-pointer">
              <Type className="h-4 w-4 mr-2" />
              Headline
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSectionBelow("image")} className="cursor-pointer">
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSectionBelow("cta")} className="cursor-pointer">
              <MousePointerClick className="h-4 w-4 mr-2" />
              Button
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Enhanced</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAddSectionBelow("quote")} className="cursor-pointer">
              <Quote className="h-4 w-4 mr-2" />
              Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSectionBelow("facebook-testimonial")} className="cursor-pointer">
              <MessageSquare className="h-4 w-4 mr-2" />
              Social Testimonial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSectionBelow("bullet-box")} className="cursor-pointer">
              <List className="h-4 w-4 mr-2" />
              Bullet Box
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSectionBelow("update")} className="cursor-pointer">
              <Bell className="h-4 w-4 mr-2 text-amber-500" />
              Update
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {onOpenEditor && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenEditor}
            title="Open advanced editor"
            className="hover-scale"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {onCloneSection && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCloneSection}
            title="Clone this section"
            className="hover-scale"
          >
            <Copy className="h-4 w-4 mr-1" />
            Clone
          </Button>
        )}
        {index > 0 && ( // Don't allow deleting the hero section
          <Button
            size="sm"
            variant={showDeleteConfirm ? "destructive" : "ghost"}
            onClick={handleDeleteClick}
            onMouseEnter={() => onDeleteHover?.(true)}
            onMouseLeave={() => {
              onDeleteHover?.(false);
              if (showDeleteConfirm) {
                setTimeout(() => setShowDeleteConfirm(false), 2000);
              }
            }}
            title={showDeleteConfirm ? "Click again to confirm deletion" : "Delete section"}
            className={cn(
              "transition-all duration-200",
              showDeleteConfirm 
                ? "animate-pulse text-destructive-foreground" 
                : "text-destructive hover:text-destructive hover-scale"
            )}
          >
            {showDeleteConfirm ? (
              <>
                <AlertCircle className="h-4 w-4 mr-1" />
                Confirm?
              </>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};