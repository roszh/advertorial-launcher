import { useState, useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Check, X, Edit2, Bold, Italic, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}

export const RichTextEditor = ({ 
  value, 
  onSave, 
  multiline = false,
  className,
  as = "p"
}: RichTextEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim()) {
      let finalValue = editValue;
      if (isBold) finalValue = `**${finalValue}**`;
      if (isItalic) finalValue = `*${finalValue}*`;
      onSave(finalValue);
      setIsEditing(false);
      setIsBold(false);
      setIsItalic(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setIsBold(false);
    setIsItalic(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);
    
    if (selectedText) {
      const newValue = 
        editValue.substring(0, start) + 
        prefix + selectedText + suffix + 
        editValue.substring(end);
      setEditValue(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    }
  };

  const formatText = (markdownValue: string) => {
    // Convert markdown to styled text for display
    let formatted = markdownValue;
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
    
    return formatted;
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn("min-h-[100px]", className)}
        />
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 border-r pr-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => wrapSelection('**')}
              title="Bold (wrap selection)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => wrapSelection('*')}
              title="Italic (wrap selection)"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: Select text and click Bold/Italic to format, or use **bold** and *italic* syntax
        </p>
      </div>
    );
  }

  const Tag = as;
  const displayValue = formatText(value || "Click to edit...");

  return (
    <div 
      className="group relative cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <Tag 
        className={cn(className, "group-hover:bg-muted/50 transition-colors rounded px-2 -mx-2")}
        dangerouslySetInnerHTML={{ __html: displayValue }}
      />
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};