import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Save, Trash2, Plus, BookMarked } from "lucide-react";
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
  order?: number;
  number?: number;
}

interface Snippet {
  id: string;
  name: string;
  description: string | null;
  sections: Section[];
  created_at: string;
}

interface SnippetsSectionProps {
  sections: Section[];
  onLoadSnippet: (sections: Section[]) => void;
}

export function SnippetsSection({ sections, onLoadSnippet }: SnippetsSectionProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [snippetName, setSnippetName] = useState("");
  const [snippetDescription, setSnippetDescription] = useState("");

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
        sections: item.sections as unknown as Section[]
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

    if (sections.length === 0) {
      toast({
        title: "Error",
        description: "No sections to save",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Strip HTML tags from content to ensure clean markdown storage
      const cleanedSections = sections.map(section => ({
        ...section,
        content: stripHtmlTags(section.content),
        heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
      }));

      const { error } = await supabase.from("snippets").insert([{
        user_id: user.id,
        name: snippetName.trim(),
        description: snippetDescription.trim() || null,
        sections: cleanedSections as any,
      }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Snippet saved successfully",
      });

      setSnippetName("");
      setSnippetDescription("");
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
          onClick={() => setSaveDialogOpen(true)}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs"
          disabled={sections.length === 0}
        >
          <Save className="h-3 w-3" />
          Save Current Sections
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Snippet</DialogTitle>
            <DialogDescription>
              Save your current sections as a reusable snippet. You can load it later to quickly add these sections to any page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="snippet-name">Name</Label>
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
                rows={3}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Saving {sections.length} section{sections.length !== 1 ? 's' : ''}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSnippet} disabled={loading}>
              {loading ? "Saving..." : "Save Snippet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
