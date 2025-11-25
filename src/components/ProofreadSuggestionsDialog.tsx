import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  sectionIndex: number;
  field: string;
  original: string;
  suggested: string;
  reason: string;
}

interface ProofreadSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (model: string) => Promise<Suggestion[]>;
  onApply: (suggestions: Suggestion[]) => void;
}

const MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "openai/gpt-5", name: "GPT-5" },
];

export const ProofreadSuggestionsDialog = ({ 
  open, 
  onOpenChange, 
  onGenerate, 
  onApply 
}: ProofreadSuggestionsDialogProps) => {
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    setIsLoading(true);
    setAcceptedIndices(new Set());
    try {
      const result = await onGenerate(selectedModel);
      setSuggestions(result);
    } catch (error) {
      console.error("Proofread error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccept = (index: number) => {
    const newAccepted = new Set(acceptedIndices);
    if (newAccepted.has(index)) {
      newAccepted.delete(index);
    } else {
      newAccepted.add(index);
    }
    setAcceptedIndices(newAccepted);
  };

  const handleAcceptAll = () => {
    setAcceptedIndices(new Set(suggestions.map((_, i) => i)));
  };

  const handleRejectAll = () => {
    setAcceptedIndices(new Set());
  };

  const handleApply = () => {
    const acceptedSuggestions = suggestions.filter((_, i) => acceptedIndices.has(i));
    onApply(acceptedSuggestions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Proofreading Suggestions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-2 border-b">
            <div className="flex items-center gap-2 flex-1">
              <Label className="text-sm">Model:</Label>
              <RadioGroup 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                className="flex gap-4"
              >
                {MODELS.map((model) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={model.id} id={model.id} />
                    <Label htmlFor={model.id} className="font-normal cursor-pointer text-sm">
                      {model.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="h-4 w-4" />
                )}
              </Button>
              {suggestions.length > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={handleAcceptAll}>
                    Accept All
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRejectAll}>
                    Reject All
                  </Button>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">Click generate to analyze your content</p>
              <p className="text-sm">AI will review grammar, spelling, and style</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={cn(
                        "border rounded-lg p-4 space-y-2 transition-colors",
                        acceptedIndices.has(index) ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : ""
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Section {suggestion.sectionIndex + 1} • {suggestion.field}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={acceptedIndices.has(index) ? "default" : "outline"}
                            onClick={() => toggleAccept(index)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newAccepted = new Set(acceptedIndices);
                              newAccepted.delete(index);
                              setAcceptedIndices(newAccepted);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">Original:</span>
                          <p className="mt-1 line-through text-muted-foreground">{suggestion.original}</p>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-green-600 dark:text-green-400">Suggested:</span>
                          <p className="mt-1 text-green-700 dark:text-green-300">{suggestion.suggested}</p>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">Reason:</span>
                          <p className="mt-1 text-muted-foreground">{suggestion.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="text-sm text-muted-foreground">
                {acceptedIndices.size} of {suggestions.length} suggestions accepted
              </div>
            </>
          )}
        </div>

        {suggestions.length > 0 && (
          <DialogFooter>
            <Button onClick={handleApply} disabled={acceptedIndices.size === 0}>
              Apply {acceptedIndices.size} Change{acceptedIndices.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
