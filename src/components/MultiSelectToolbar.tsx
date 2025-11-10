import { Button } from "./ui/button";
import { BookMarked, X, CheckSquare } from "lucide-react";

interface MultiSelectToolbarProps {
  selectedCount: number;
  onSaveToSnippet: () => void;
  onCancel: () => void;
}

export const MultiSelectToolbar = ({
  selectedCount,
  onSaveToSnippet,
  onCancel,
}: MultiSelectToolbarProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5" />
        <span className="font-medium">
          {selectedCount} section{selectedCount !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onSaveToSnippet}
          disabled={selectedCount === 0}
        >
          <BookMarked className="h-4 w-4 mr-2" />
          Save to Snippets
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};
