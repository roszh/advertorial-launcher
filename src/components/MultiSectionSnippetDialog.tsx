import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { stripHtmlTags } from "@/lib/utils";

interface Section {
  id?: string;
  type: string;
  content: string;
  heading?: string;
  [key: string]: any;
}

interface Snippet {
  id: string;
  name: string;
  description: string | null;
  sections: Section[];
}

interface MultiSectionSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  userId: string;
}

export const MultiSectionSnippetDialog = ({
  open,
  onOpenChange,
  sections,
  userId,
}: MultiSectionSnippetDialogProps) => {
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new");
  const [newSnippetName, setNewSnippetName] = useState("");
  const [newSnippetDescription, setNewSnippetDescription] = useState("");
  const [selectedSnippetId, setSelectedSnippetId] = useState("");
  const [existingSnippets, setExistingSnippets] = useState<Snippet[]>([]);
  const [savingSnippet, setSavingSnippet] = useState(false);

  useEffect(() => {
    if (open) {
      fetchExistingSnippets();
    }
  }, [open]);

  const fetchExistingSnippets = async () => {
    try {
      const { data, error } = await supabase
        .from("snippets")
        .select("id, name, description, sections")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setExistingSnippets(
        (data || []).map((item) => ({
          ...item,
          sections: item.sections as unknown as Section[],
        }))
      );
    } catch (error) {
      console.error("Error fetching snippets:", error);
    }
  };

  const handleSaveToSnippet = async () => {
    if (saveMode === "new" && !newSnippetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a snippet name",
        variant: "destructive",
      });
      return;
    }

    if (saveMode === "existing" && !selectedSnippetId) {
      toast({
        title: "Error",
        description: "Please select a snippet",
        variant: "destructive",
      });
      return;
    }

    setSavingSnippet(true);
    try {
      // Clean the sections before saving
      const cleanedSections = sections.map((section) => ({
        ...section,
        id: section.id || crypto.randomUUID(),
        content: stripHtmlTags(section.content),
        heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
      }));

      if (saveMode === "new") {
        // Create new snippet with these sections
        const { error } = await supabase.from("snippets").insert([
          {
            user_id: userId,
            name: newSnippetName.trim(),
            description: newSnippetDescription.trim() || null,
            sections: cleanedSections as any,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${sections.length} sections saved to new snippet "${newSnippetName}"`,
        });
      } else {
        // Add to existing snippet
        const existingSnippet = existingSnippets.find(
          (s) => s.id === selectedSnippetId
        );
        if (!existingSnippet) throw new Error("Snippet not found");

        const updatedSections = [...existingSnippet.sections, ...cleanedSections];

        const { error } = await supabase
          .from("snippets")
          .update({
            sections: updatedSections as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedSnippetId);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${sections.length} sections added to "${existingSnippet.name}"`,
        });
      }

      // Reset form and close
      onOpenChange(false);
      setNewSnippetName("");
      setNewSnippetDescription("");
      setSelectedSnippetId("");
      setSaveMode("new");
    } catch (error) {
      console.error("Error saving to snippet:", error);
      toast({
        title: "Error",
        description: "Failed to save sections to snippet",
        variant: "destructive",
      });
    } finally {
      setSavingSnippet(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save {sections.length} Sections to Snippet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={saveMode} onValueChange={(value: any) => setSaveMode(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="cursor-pointer">
                Create new snippet
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="cursor-pointer">
                Add to existing snippet
              </Label>
            </div>
          </RadioGroup>

          {saveMode === "new" ? (
            <>
              <div>
                <Label htmlFor="snippetName">Snippet Name *</Label>
                <Input
                  id="snippetName"
                  value={newSnippetName}
                  onChange={(e) => setNewSnippetName(e.target.value)}
                  placeholder="e.g. Product Review Template"
                />
              </div>
              <div>
                <Label htmlFor="snippetDescription">Description (optional)</Label>
                <Textarea
                  id="snippetDescription"
                  value={newSnippetDescription}
                  onChange={(e) => setNewSnippetDescription(e.target.value)}
                  placeholder="Describe what this snippet contains..."
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="existingSnippet">Select Snippet *</Label>
              <Select value={selectedSnippetId} onValueChange={setSelectedSnippetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a snippet..." />
                </SelectTrigger>
                <SelectContent>
                  {existingSnippets.map((snippet) => (
                    <SelectItem key={snippet.id} value={snippet.id}>
                      {snippet.name} ({snippet.sections.length} sections)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Selected sections will be saved in order.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveToSnippet} disabled={savingSnippet}>
            {savingSnippet ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save to Snippet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
