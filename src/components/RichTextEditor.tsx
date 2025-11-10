import { useState, useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Check, X, Edit2, Bold, Italic, Trash2, Sparkles, Link as LinkIcon, Heading2 } from "lucide-react";
import { cn, formatMarkdownText, stripHtmlTags } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";

interface RichTextEditorProps {
  value: string;
  onSave: (value: string) => void;
  onDelete?: () => void;
  multiline?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  enableAiOptimize?: boolean;
}

export const RichTextEditor = ({ 
  value, 
  onSave,
  onDelete,
  multiline = false,
  className,
  as = "p",
  enableAiOptimize = false
}: RichTextEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Set minimum height based on content length
      const contentLines = editValue.split('\n').length;
      const minHeight = Math.max(150, Math.min(contentLines * 24, 600));
      textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
    }
  };

  // Strip HTML when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const cleanValue = stripHtmlTags(value);
      setEditValue(cleanValue);
      
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cleanValue.length, cleanValue.length);
        adjustTextareaHeight();
      }
    }
  }, [isEditing, value]);

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

  const convertToSubheadline = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);
    
    const textToConvert = selectedText || editValue;
    
    if (!textToConvert.trim()) {
      toast({
        title: "No text to convert",
        description: "Please select text or ensure the editor has content",
        variant: "destructive"
      });
      return;
    }

    // Remove any existing formatting markers
    const cleanText = textToConvert
      .replace(/^##\s*/, '')  // Remove ## prefix if exists
      .replace(/^\*\*/, '')   // Remove bold markers
      .replace(/\*\*$/, '')
      .replace(/^\*/, '')     // Remove italic markers
      .replace(/\*$/, '')
      .trim();
    
    // Wrap with ## for subheadline markdown
    const subheadlineText = `## ${cleanText}`;
    
    if (selectedText) {
      const newValue = 
        editValue.substring(0, start) + 
        subheadlineText + 
        editValue.substring(end);
      setEditValue(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + subheadlineText.length);
      }, 0);
    } else {
      setEditValue(subheadlineText);
    }

    toast({
      title: "Converted to subheadline",
      description: "Text formatted as subheadline",
    });
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);
    
    if (!selectedText) {
      toast({
        title: "Select text first",
        description: "Please select the text you want to turn into a link",
        variant: "destructive"
      });
      return;
    }

    setShowLinkInput(true);
  };

  const applyLink = () => {
    const textarea = textareaRef.current;
    if (!textarea || !linkUrl.trim()) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);
    
    if (selectedText) {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      const linkMarkdown = `[${selectedText}](${url})`;
      const newValue = 
        editValue.substring(0, start) + 
        linkMarkdown + 
        editValue.substring(end);
      setEditValue(newValue);
      
      setShowLinkInput(false);
      setLinkUrl("");
      
      setTimeout(() => {
        textarea.focus();
      }, 0);
    }
  };

  const handleAiOptimize = async () => {
    if (!editValue.trim()) return;
    
    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-paragraph', {
        body: { text: editValue }
      });

      if (error) throw error;

      if (data?.optimizedText) {
        setEditValue(data.optimizedText);
        toast({
          title: "Paragraph optimized",
          description: "AI has improved the formatting and readability",
        });
      }
    } catch (error) {
      console.error('Error optimizing paragraph:', error);
      toast({
        title: "Optimization failed",
        description: "Could not optimize paragraph. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };


  if (isEditing) {
    return (
      <div className="space-y-2 relative">
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Are you sure you want to delete this section?")) {
                onDelete();
                setIsEditing(false);
              }
            }}
            className="absolute -top-2 -right-2 z-10 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          className={cn("min-h-[150px] max-h-[600px] resize-none overflow-y-auto", className)}
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
            <Button 
              size="sm" 
              variant="outline"
              onClick={insertLink}
              title="Insert link (select text first)"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={convertToSubheadline}
              title="Convert to subheadline"
            >
              <Heading2 className="h-4 w-4" />
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
        {showLinkInput && (
          <div className="flex gap-2 items-center p-2 bg-muted rounded-lg">
            <Input
              type="text"
              placeholder="Enter URL (e.g., example.com)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyLink();
                } else if (e.key === "Escape") {
                  setShowLinkInput(false);
                  setLinkUrl("");
                }
              }}
              className="flex-1"
            />
            <Button size="sm" onClick={applyLink}>
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Tip: Select text and click Bold/Italic/Link to format, or use **bold**, *italic*, and [text](url) syntax. Use the subheadline button to convert text to a styled subheadline.
        </p>
      </div>
    );
  }

  const Tag = as;
  const displayValue = formatMarkdownText(value || "Click to edit...");

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