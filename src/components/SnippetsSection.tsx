import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Save, Trash2, Plus, BookMarked, CheckSquare, Square } from "lucide-react";
import { SidebarGroupContent } from "@/components/ui/sidebar";
import { stripHtmlTags } from "@/lib/utils";

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
  tags?: Array<{id: string, name: string, color: string}>;
  created_at: string;
}

interface SnippetsSectionProps {
  sections: Section[];
  onLoadSnippet: (sections: Section[]) => void;
  currentPageTags?: Array<{id: string, name: string, color: string}>;
}

export function SnippetsSection({ sections, onLoadSnippet, currentPageTags = [] }: SnippetsSectionProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [snippetName, setSnippetName] = useState("");
  const [snippetDescription, setSnippetDescription] = useState("");
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("snippets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSnippets((data || []).map(item => ({
        ...item,
        sections: item.sections as unknown as Section[],
        tags: item.tags as unknown as Array<{id: string, name: string, color: string}> | undefined
      })));
    } catch (error) {
      console.error("Error fetching snippets:", error);
      toast({
        title: "Error",
        description: "Failed to load snippets",
        variant: "destructive",
      });
    }
  };

  const handleSaveSnippet = async () => {
    if (!snippetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a snippet name",
        variant: "destructive",
      });
      return;
    }

    if (selectedSectionIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one section to save",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Only save selected sections
      const sectionsToSave = sections.filter(section => 
        section.id && selectedSectionIds.has(section.id)
      );

      // Strip HTML tags from content to ensure clean markdown storage
      const cleanedSections = sectionsToSave.map(section => ({
        ...section,
        content: stripHtmlTags(section.content),
        heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
      }));

      const { error } = await supabase.from("snippets").insert([{
        user_id: user.id,
        name: snippetName.trim(),
        description: snippetDescription.trim() || null,
        sections: cleanedSections as any,
        tags: currentPageTags as any, // Store tags from current page
      }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Snippet saved with ${cleanedSections.length} section${cleanedSections.length !== 1 ? 's' : ''}`,
      });

      setSnippetName("");
      setSnippetDescription("");
      setSelectedSectionIds(new Set());
      setSaveDialogOpen(false);
      fetchSnippets();
    } catch (error) {
      console.error("Error saving snippet:", error);
      toast({
        title: "Error",
        description: "Failed to save snippet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    const stripped = stripHtmlTags(content);
    return stripped.length > 50 ? stripped.substring(0, 50) + "..." : stripped;
  };

  const toggleSectionSelection = (sectionId: string) => {
    const newSet = new Set(selectedSectionIds);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    setSelectedSectionIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedSectionIds.size === sections.length) {
      setSelectedSectionIds(new Set());
    } else {
      setSelectedSectionIds(new Set(sections.map(s => s.id!).filter(Boolean)));
    }
  };

  const handleOpenSaveDialog = () => {
    // Pre-select all sections when opening dialog
    setSelectedSectionIds(new Set(sections.map(s => s.id!).filter(Boolean)));
    setSaveDialogOpen(true);
  };

  const handleLoadSnippet = (snippet: Snippet) => {
    // Ensure content is clean when loading from snippets
    const cleanedSections = snippet.sections.map(section => ({
      ...section,
      content: stripHtmlTags(section.content),
      heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
    }));
    
    onLoadSnippet(cleanedSections);
    toast({
      title: "Success",
      description: `Loaded "${snippet.name}" snippet`,
    });
  };

  const handleDeleteSnippet = async (snippetId: string) => {
    if (!confirm("Are you sure you want to delete this snippet?")) return;

    try {
      const { error } = await supabase
        .from("snippets")
        .delete()
        .eq("id", snippetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Snippet deleted",
      });

      fetchSnippets();
    } catch (error) {
      console.error("Error deleting snippet:", error);
      toast({
        title: "Error",
        description: "Failed to delete snippet",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SidebarGroupContent className="px-3 py-2 space-y-2">
        <Button
          onClick={handleOpenSaveDialog}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs"
          disabled={sections.length === 0}
        >
          <Save className="h-3 w-3" />
          Save Selected Sections
        </Button>

        {snippets.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4 px-2">
            <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No snippets saved yet.</p>
            <p className="mt-1">Save section combinations for quick reuse.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="border rounded-md p-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium truncate">{snippet.name}</h4>
                    {snippet.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {snippet.description}
                      </p>
                    )}
                    {snippet.tags && snippet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {snippet.tags.slice(0, 2).map((tag) => (
                          <span 
                            key={tag.id} 
                            className="text-xs px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {snippet.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{snippet.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {snippet.sections.length} section{snippet.sections.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSnippet(snippet.id)}
                    className="h-6 w-6 p-0 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  onClick={() => handleLoadSnippet(snippet)}
                  variant="secondary"
                  size="sm"
                  className="w-full h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Insert Sections
                </Button>
              </div>
            ))}
          </div>
        )}
      </SidebarGroupContent>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Save Snippet</DialogTitle>
            <DialogDescription>
              Select which sections to save as a reusable snippet. You can load it later to quickly add these sections to any page.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <Label htmlFor="snippet-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="snippet-name"
                placeholder="e.g., Testimonial Block, Benefit Section..."
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                maxLength={100}
              />
            </div>
            
            <div>
              <Label htmlFor="snippet-description">Description (optional)</Label>
              <Textarea
                id="snippet-description"
                placeholder="What's this snippet for?"
                value={snippetDescription}
                onChange={(e) => setSnippetDescription(e.target.value)}
                maxLength={500}
                rows={2}
              />
            </div>

            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <Label>Select Sections ({selectedSectionIds.size}/{sections.length})</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="h-8 text-xs"
                >
                  {selectedSectionIds.size === sections.length ? (
                    <>
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-3 w-3 mr-1" />
                      Select All
                    </>
                  )}
                </Button>
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <div className="p-3 space-y-2">
                  {sections.map((section, index) => {
                    if (!section.id) return null;
                    const isSelected = selectedSectionIds.has(section.id);
                    
                    return (
                      <div
                        key={section.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => toggleSectionSelection(section.id!)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSectionSelection(section.id!)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{getSectionIcon(section.type)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {section.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Section {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 line-clamp-2">
                              {getSectionPreview(section)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setSaveDialogOpen(false);
              setSelectedSectionIds(new Set());
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSnippet} 
              disabled={loading || !snippetName.trim() || selectedSectionIds.size === 0}
            >
              {loading ? "Saving..." : `Save ${selectedSectionIds.size} Section${selectedSectionIds.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
