import { useState, useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineTextEditorProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}

export const InlineTextEditor = ({ 
  value, 
  onSave, 
  multiline = false,
  className,
  as = "p"
}: InlineTextEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(editValue.length, editValue.length);
      }
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim()) {
      onSave(editValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {multiline ? (
          <Textarea
            ref={inputRef as any}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn("min-h-[100px]", className)}
          />
        ) : (
          <Input
            ref={inputRef as any}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={className}
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const Tag = as;

  return (
    <div 
      className="group relative cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <Tag className={cn(className, "group-hover:bg-muted/50 transition-colors rounded px-2 -mx-2")}>
        {value || "Click to edit..."}
      </Tag>
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};