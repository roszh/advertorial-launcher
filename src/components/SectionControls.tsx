import { Button } from "./ui/button";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionControlsProps {
  index: number;
  onAddTextBelow: () => void;
  onAddImageBelow: () => void;
  onDeleteSection: () => void;
  className?: string;
}

export const SectionControls = ({
  index,
  onAddTextBelow,
  onAddImageBelow,
  onDeleteSection,
  className
}: SectionControlsProps) => {
  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-4 opacity-0 group-hover:opacity-100 transition-opacity",
      className
    )}>
      <div className="flex gap-1 bg-background border rounded-lg shadow-lg p-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddTextBelow}
          title="Add text section below"
        >
          <Plus className="h-4 w-4 mr-1" />
          Text
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddImageBelow}
          title="Add image section below"
        >
          <ImagePlus className="h-4 w-4 mr-1" />
          Image
        </Button>
        {index > 0 && ( // Don't allow deleting the hero section
          <Button
            size="sm"
            variant="ghost"
            onClick={onDeleteSection}
            title="Delete section"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};