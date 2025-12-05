import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export interface TranslationProgress {
  currentBatch: number;
  totalBatches: number;
  sectionsTranslated: number;
  totalSections: number;
}

interface TranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranslate: (language: string, model: string, createCopy: boolean) => Promise<void>;
  progress?: TranslationProgress | null;
}

const LANGUAGES = [
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "de", name: "German" },
  { code: "ro", name: "Romanian" },
  { code: "cs", name: "Czech" },
  { code: "pl", name: "Polish" },
  { code: "hu", name: "Hungarian" },
];

const MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fast, excellent for large content" },
  { id: "openai/gpt-5", name: "GPT-5", description: "High accuracy, nuanced translations" },
];

export const TranslateDialog = ({ open, onOpenChange, onTranslate, progress }: TranslateDialogProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async (createCopy: boolean) => {
    setIsLoading(true);
    try {
      await onTranslate(selectedLanguage, selectedModel, createCopy);
      onOpenChange(false);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercent = progress 
    ? Math.round((progress.currentBatch / progress.totalBatches) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Translate Page</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {isLoading && progress ? (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">
                  Translating batch {progress.currentBatch} of {progress.totalBatches}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.sectionsTranslated} of {progress.totalSections} sections completed
                </p>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progressPercent}% complete
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Target Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>AI Model</Label>
                <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                  {MODELS.map((model) => (
                    <div key={model.id} className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value={model.id} id={model.id} />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor={model.id} className="font-medium cursor-pointer">
                          {model.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleTranslate(false)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              "Translate this page"
            )}
          </Button>
          <Button
            onClick={() => handleTranslate(true)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create translated copy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
