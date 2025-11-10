import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Save, X, Trash2, ArrowUp, ArrowDown, BookMarked, Loader2 } from "lucide-react";
import { InlineImageUpload } from "./InlineImageUpload";
import { cn, stripHtmlTags } from "@/lib/utils";

interface Section {
  id?: string;
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial" | "quote" | "facebook-testimonial" | "bullet-box" | "list-item" | "final-cta" | "update";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
  imageAspectRatio?: "video" | "square";
  imageLinksToUrl?: boolean;
  ctaText?: string;
  author?: string;
  authorRole?: string;
  authorAvatar?: string;
  timestamp?: string;
  reactions?: number;
  items?: string[];
  boxColor?: "green" | "blue" | "purple" | "yellow";
  buttonText?: string;
  buttonUrl?: string;
  updateDate?: string;
  verifiedText?: string;
  order?: number;
  number?: number;
}

interface Snippet {
  id: string;
  name: string;
  description: string | null;
  sections: Section[];
}

interface SectionEditorProps {
  section: Section;
  index: number;
  totalSections: number;
  onSave: (section: Section) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCancel: () => void;
  userId: string;
}

export const SectionEditor = ({
  section,
  index,
  totalSections,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCancel,
  userId,
}: SectionEditorProps) => {
  const [editedSection, setEditedSection] = useState<Section>(section);
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new");
  const [newSnippetName, setNewSnippetName] = useState("");
  const [newSnippetDescription, setNewSnippetDescription] = useState("");
  const [selectedSnippetId, setSelectedSnippetId] = useState("");
  const [existingSnippets, setExistingSnippets] = useState<Snippet[]>([]);
  const [savingSnippet, setSavingSnippet] = useState(false);

  // Strip HTML tags when section changes to ensure clean editing
  useEffect(() => {
    setEditedSection({
      ...section,
      content: stripHtmlTags(section.content),
      heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
    });
  }, [section]);

  // Fetch existing snippets when dialog opens
  useEffect(() => {
    if (snippetDialogOpen) {
      fetchExistingSnippets();
    }
  }, [snippetDialogOpen]);

  const fetchExistingSnippets = async () => {
    try {
      const { data, error } = await supabase
        .from("snippets")
        .select("id, name, description, sections")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setExistingSnippets((data || []).map(item => ({
        ...item,
        sections: item.sections as unknown as Section[]
      })));
    } catch (error) {
      console.error("Error fetching snippets:", error);
    }
  };

  const handleSave = () => {
    // Strip HTML tags to ensure clean markdown storage
    const cleanedSection = {
      ...editedSection,
      content: stripHtmlTags(editedSection.content),
      heading: editedSection.heading ? stripHtmlTags(editedSection.heading) : editedSection.heading,
    };
    onSave(cleanedSection);
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
      // Clean the section before saving
      const cleanedSection = {
        ...editedSection,
        id: editedSection.id || crypto.randomUUID(),
        content: stripHtmlTags(editedSection.content),
        heading: editedSection.heading ? stripHtmlTags(editedSection.heading) : editedSection.heading,
      };

      if (saveMode === "new") {
        // Create new snippet with this section
        const { error } = await supabase.from("snippets").insert([{
          user_id: userId,
          name: newSnippetName.trim(),
          description: newSnippetDescription.trim() || null,
          sections: [cleanedSection] as any,
        }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Section saved to new snippet "${newSnippetName}"`,
        });
      } else {
        // Add to existing snippet
        const existingSnippet = existingSnippets.find(s => s.id === selectedSnippetId);
        if (!existingSnippet) throw new Error("Snippet not found");

        const updatedSections = [...existingSnippet.sections, cleanedSection];

        const { error } = await supabase
          .from("snippets")
          .update({
            sections: updatedSections as any,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedSnippetId);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Section added to "${existingSnippet.name}"`,
        });
      }

      // Reset form
      setSnippetDialogOpen(false);
      setNewSnippetName("");
      setNewSnippetDescription("");
      setSelectedSnippetId("");
      setSaveMode("new");
    } catch (error) {
      console.error("Error saving to snippet:", error);
      toast({
        title: "Error",
        description: "Failed to save section to snippet",
        variant: "destructive",
      });
    } finally {
      setSavingSnippet(false);
    }
  };

  return (
    <div className="border-2 border-primary/50 rounded-lg p-6 bg-background/95 backdrop-blur space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">
          Edit Section {index + 1} ({section.type})
        </h3>
        <div className="flex gap-2">
          {index > 0 && (
            <Button size="sm" variant="outline" onClick={onMoveUp}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
          {index < totalSections - 1 && (
            <Button size="sm" variant="outline" onClick={onMoveDown}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {section.heading !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Heading</label>
            <Input
              value={editedSection.heading || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, heading: e.target.value })
              }
              placeholder="Enter heading..."
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Content</label>
          <Textarea
            value={editedSection.content}
            onChange={(e) =>
              setEditedSection({ ...editedSection, content: e.target.value })
            }
            placeholder="Enter content..."
            className="min-h-[150px]"
          />
        </div>

        {section.imagePosition && section.type !== "facebook-testimonial" && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Image Position</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={editedSection.imagePosition}
                onChange={(e) =>
                  setEditedSection({
                    ...editedSection,
                    imagePosition: e.target.value as any,
                  })
                }
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="full">Full</option>
                <option value="none">None</option>
              </select>
            </div>

            {editedSection.imagePosition !== "none" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Section Image</label>
                <InlineImageUpload
                  currentImageUrl={editedSection.imageUrl || ""}
                  onImageUploaded={(url) =>
                    setEditedSection({ ...editedSection, imageUrl: url })
                  }
                  userId={userId}
                  aspectRatio={editedSection.imageAspectRatio || (editedSection.imagePosition === "full" ? "wide" : "video")}
                  showAspectRatioSelector={editedSection.imagePosition !== "full"}
                  onAspectRatioChange={(ratio) =>
                    setEditedSection({ ...editedSection, imageAspectRatio: ratio })
                  }
                />
                {editedSection.imageUrl && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="imageLinksToUrl"
                        checked={editedSection.imageLinksToUrl || false}
                        onChange={(e) =>
                          setEditedSection({ ...editedSection, imageLinksToUrl: e.target.checked })
                        }
                        className="rounded border-input"
                      />
                      <label htmlFor="imageLinksToUrl" className="text-sm cursor-pointer">
                        Link image to CTA URL
                      </label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditedSection({ ...editedSection, imageUrl: "" })}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {section.style && (
          <div>
            <label className="text-sm font-medium mb-2 block">Style</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={editedSection.style}
              onChange={(e) =>
                setEditedSection({
                  ...editedSection,
                  style: e.target.value as any,
                })
              }
            >
              <option value="normal">Normal</option>
              <option value="emphasized">Emphasized</option>
              <option value="callout">Callout</option>
            </select>
          </div>
        )}

        {section.author !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Author</label>
            <Input
              value={editedSection.author || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, author: e.target.value })
              }
              placeholder="Author name..."
            />
          </div>
        )}

        {section.authorRole !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Author Role</label>
            <Input
              value={editedSection.authorRole || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, authorRole: e.target.value })
              }
              placeholder="Author role..."
            />
          </div>
        )}

        {section.type === "facebook-testimonial" && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Profile Photo</label>
              <InlineImageUpload
                currentImageUrl={editedSection.authorAvatar || ""}
                onImageUploaded={(url) =>
                  setEditedSection({ ...editedSection, authorAvatar: url })
                }
                userId={userId}
                aspectRatio="square"
                className="max-w-[200px]"
              />
              {editedSection.authorAvatar && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditedSection({ ...editedSection, authorAvatar: "" })}
                  >
                    Remove Photo
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Verified Badge Text</label>
              <Input
                value={editedSection.verifiedText || ""}
                onChange={(e) =>
                  setEditedSection({ ...editedSection, verifiedText: e.target.value })
                }
                placeholder="Verified Purchase"
              />
            </div>
          </>
        )}

        {section.timestamp !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Timestamp</label>
            <Input
              value={editedSection.timestamp || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, timestamp: e.target.value })
              }
              placeholder="e.g. 2 days ago"
            />
          </div>
        )}

        {section.reactions !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Reactions</label>
            <Input
              type="number"
              value={editedSection.reactions || 0}
              onChange={(e) =>
                setEditedSection({ ...editedSection, reactions: parseInt(e.target.value) || 0 })
              }
              placeholder="Number of reactions"
            />
          </div>
        )}

        {section.updateDate !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Update Date</label>
            <Input
              value={editedSection.updateDate || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, updateDate: e.target.value })
              }
              placeholder="e.g. September 14, 2021"
            />
          </div>
        )}

        {section.items !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Bullet Points</label>
            <Textarea
              value={editedSection.items?.join("\n") || ""}
              onChange={(e) =>
                setEditedSection({ 
                  ...editedSection, 
                  items: e.target.value.split("\n").filter(i => i.trim()) 
                })
              }
              placeholder="Enter one bullet point per line..."
              className="min-h-[100px]"
            />
          </div>
        )}

        {section.boxColor !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Box Color</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={editedSection.boxColor}
              onChange={(e) =>
                setEditedSection({
                  ...editedSection,
                  boxColor: e.target.value as any,
                })
              }
            >
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="yellow">Yellow</option>
            </select>
          </div>
        )}

        {section.ctaText !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">CTA Button Text</label>
            <Input
              value={editedSection.ctaText || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, ctaText: e.target.value })
              }
              placeholder="Button text..."
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button variant="secondary" onClick={() => setSnippetDialogOpen(true)}>
          <BookMarked className="mr-2 h-4 w-4" />
          Add to Snippets
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Add to Snippets Dialog */}
      <Dialog open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Section to Snippets</DialogTitle>
            <DialogDescription>
              Save this section to a snippet for quick reuse across your pages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={saveMode} onValueChange={(v) => setSaveMode(v as "new" | "existing")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="cursor-pointer">Create New Snippet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="cursor-pointer">Add to Existing Snippet</Label>
              </div>
            </RadioGroup>

            {saveMode === "new" ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-snippet-name">
                    Snippet Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-snippet-name"
                    placeholder="e.g., Hero Section, Testimonial Block..."
                    value={newSnippetName}
                    onChange={(e) => setNewSnippetName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="new-snippet-desc">Description (optional)</Label>
                  <Textarea
                    id="new-snippet-desc"
                    placeholder="What's this snippet for?"
                    value={newSnippetDescription}
                    onChange={(e) => setNewSnippetDescription(e.target.value)}
                    maxLength={500}
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="existing-snippet">
                  Select Snippet <span className="text-destructive">*</span>
                </Label>
                {existingSnippets.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2 p-3 border rounded-md">
                    No snippets found. Create a new snippet to get started.
                  </p>
                ) : (
                  <Select value={selectedSnippetId} onValueChange={setSelectedSnippetId}>
                    <SelectTrigger id="existing-snippet">
                      <SelectValue placeholder="Choose a snippet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingSnippets.map((snippet) => (
                        <SelectItem key={snippet.id} value={snippet.id}>
                          {snippet.name} ({snippet.sections.length} section{snippet.sections.length !== 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="bg-muted/50 p-3 rounded-md border text-sm">
              <p className="font-medium mb-1">Section Preview:</p>
              <p className="text-muted-foreground">
                <span className="font-medium">{section.type}</span>
                {section.heading && ` - ${section.heading.substring(0, 50)}${section.heading.length > 50 ? '...' : ''}`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSnippetDialogOpen(false);
                setNewSnippetName("");
                setNewSnippetDescription("");
                setSelectedSnippetId("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveToSnippet} 
              disabled={
                savingSnippet || 
                (saveMode === "new" && !newSnippetName.trim()) ||
                (saveMode === "existing" && (!selectedSnippetId || existingSnippets.length === 0))
              }
            >
              {savingSnippet ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookMarked className="mr-2 h-4 w-4" />
                  {saveMode === "new" ? "Create Snippet" : "Add to Snippet"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
