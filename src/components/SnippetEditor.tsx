import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Save, X, GripVertical, Edit2, Trash2, Plus, Tag as TagIcon } from "lucide-react";
import { DraggableSections } from "./DraggableSections";
import { SectionEditor } from "./SectionEditor";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Section {
  id: string;
  type: string;
  content: string;
  heading?: string;
  imageUrl?: string;
  [key: string]: any;
}

interface Snippet {
  id: string;
  name: string;
  description: string | null;
  sections: Section[];
  tags: Tag[] | null;
  updated_at: string;
}

interface SnippetEditorProps {
  snippet: Snippet;
  availableTags: Tag[];
  onClose: () => void;
  onSave: () => void;
  userId: string;
}

export function SnippetEditor({ snippet, availableTags, onClose, onSave, userId }: SnippetEditorProps) {
  const [name, setName] = useState(snippet.name);
  const [description, setDescription] = useState(snippet.description || "");
  const [sections, setSections] = useState<Section[]>(snippet.sections || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    snippet.tags?.map(t => t.id) || []
  );
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [deletingSectionIndex, setDeleteingSectionIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Get full tag objects for storage
    const tagsToStore = availableTags.filter(t => selectedTags.includes(t.id));

    const { error } = await supabase
      .from("snippets")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        sections: sections as any,
        tags: tagsToStore as any,
        updated_at: new Date().toISOString()
      })
      .eq("id", snippet.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error saving snippet", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Snippet updated successfully" });
      onSave();
    }
  };

  const handleReorder = (newOrder: string[]) => {
    const reorderedSections = newOrder
      .map(id => sections.find(s => s.id === id))
      .filter(Boolean) as Section[];
    setSections(reorderedSections);
  };

  const handleSectionUpdate = (index: number, updatedSection: Section) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
    setEditingSectionIndex(null);
  };

  const handleDeleteSection = () => {
    if (deletingSectionIndex === null) return;
    
    const newSections = sections.filter((_, i) => i !== deletingSectionIndex);
    setSections(newSections);
    setDeleteingSectionIndex(null);
  };

  const getSectionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      hero: "📰",
      text: "📝",
      image: "🖼️",
      cta: "🔘",
      benefits: "✅",
      testimonial: "💬",
      quote: "💭",
      "facebook-testimonial": "👤",
      "bullet-box": "📋",
      "list-item": "📌",
      "final-cta": "🎯",
      update: "🔄"
    };
    return icons[type] || "📄";
  };

  const getSectionPreview = (section: Section) => {
    const content = section.heading || section.content || "";
    return content.length > 60 ? content.substring(0, 60) + "..." : content;
  };

  return (
    <>
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Snippet</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Metadata Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Snippet Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter snippet name"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter snippet description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <TagIcon className="h-4 w-4" />
                      {selectedTags.length === 0 ? "Select tags" : `${selectedTags.length} tag(s) selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      {availableTags.map(tag => (
                        <div key={tag.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTags([...selectedTags, tag.id]);
                              } else {
                                setSelectedTags(selectedTags.filter(t => t !== tag.id));
                              }
                            }}
                          />
                          <Badge style={{ backgroundColor: tag.color }}>{tag.name}</Badge>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTags
                      .filter(t => selectedTags.includes(t.id))
                      .map(tag => (
                        <Badge key={tag.id} style={{ backgroundColor: tag.color }}>
                          {tag.name}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sections Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Sections ({sections.length})</label>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sections in this snippet
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="bg-muted/50 rounded-lg p-4 space-y-2 border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getSectionIcon(section.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                              {section.type}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 truncate">
                            {getSectionPreview(section)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingSectionIndex(index)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteingSectionIndex(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button onClick={onClose} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(snippet.updated_at).toLocaleString()}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Section Editor Dialog */}
      {editingSectionIndex !== null && (
        <Sheet open={true} onOpenChange={() => setEditingSectionIndex(null)}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SectionEditor
              section={sections[editingSectionIndex] as any}
              index={editingSectionIndex}
              totalSections={sections.length}
              onSave={(updatedSection) => handleSectionUpdate(editingSectionIndex, updatedSection as any)}
              onDelete={() => {
                setDeleteingSectionIndex(editingSectionIndex);
                setEditingSectionIndex(null);
              }}
              onMoveUp={() => {
                if (editingSectionIndex > 0) {
                  const newSections = [...sections];
                  [newSections[editingSectionIndex], newSections[editingSectionIndex - 1]] = 
                    [newSections[editingSectionIndex - 1], newSections[editingSectionIndex]];
                  setSections(newSections);
                }
              }}
              onMoveDown={() => {
                if (editingSectionIndex < sections.length - 1) {
                  const newSections = [...sections];
                  [newSections[editingSectionIndex], newSections[editingSectionIndex + 1]] = 
                    [newSections[editingSectionIndex + 1], newSections[editingSectionIndex]];
                  setSections(newSections);
                }
              }}
              onCancel={() => setEditingSectionIndex(null)}
              userId={userId}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingSectionIndex !== null} onOpenChange={() => setDeleteingSectionIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
