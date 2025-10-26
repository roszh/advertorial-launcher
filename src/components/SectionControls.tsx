import { useState } from "react";
import { Button } from "./ui/button";
import { Plus, Trash2, ImagePlus, AlertCircle, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionControlsProps {
  index: number;
  onAddTextBelow: () => void;
  onAddImageBelow: () => void;
  onDeleteSection: () => void;
  onCloneSection?: () => void;
  className?: string;
  onDeleteHover?: (isHovering: boolean) => void;
}

export const SectionControls = ({
  index,
  onAddTextBelow,
  onAddImageBelow,
  onDeleteSection,
  onCloneSection,
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
      <div className="flex gap-1 bg-background border rounded-lg shadow-lg p-1 animate-fade-in">
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddTextBelow}
          title="Add text section below"
          className="hover-scale"
        >
          <Plus className="h-4 w-4 mr-1" />
          Text
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddImageBelow}
          title="Add image section below"
          className="hover-scale"
        >
          <ImagePlus className="h-4 w-4 mr-1" />
          Image
        </Button>
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