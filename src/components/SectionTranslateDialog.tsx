import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface SectionTranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionIndex: number | null;
  onTranslate: (sectionIndex: number, language: string, model: string) => Promise<void>;
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
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fast and reliable" },
  { id: "openai/gpt-5", name: "GPT-5", description: "High accuracy" },
];

export const SectionTranslateDialog = ({ open, onOpenChange, sectionIndex, onTranslate }: SectionTranslateDialogProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (sectionIndex === null) return;
    
    setIsLoading(true);
    try {
      await onTranslate(sectionIndex, selectedLanguage, selectedModel);
      onOpenChange(false);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Translate Section {sectionIndex !== null ? sectionIndex + 1 : ''}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleTranslate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              "Translate Section"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
