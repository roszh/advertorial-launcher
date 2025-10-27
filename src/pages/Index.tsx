import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { MagazineTemplate } from "@/components/templates/MagazineTemplate";
import { NewsTemplate } from "@/components/templates/NewsTemplate";
import { BlogTemplate } from "@/components/templates/BlogTemplate";
import { SectionEditor } from "@/components/SectionEditor";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { HtmlEditor } from "@/components/HtmlEditor";
import { toast } from "@/hooks/use-toast";
import { stripHtmlTags } from "@/lib/utils";
import { Loader2, Save, Globe, Edit2, Plus, Sparkles, Code, X, Undo2 } from "lucide-react";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
  ctaText?: string;
}

interface AnalysisResult {
  layout: string;
  sections: Section[];
  cta: {
    primary: string;
    secondary?: string;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [user, setUser] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [ctaUrl, setCTAUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<"magazine" | "news" | "blog">("magazine");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [ctaStyle, setCtaStyle] = useState<"ctaAmazon" | "ctaUrgent" | "ctaPremium" | "ctaTrust">("ctaAmazon");
  const [stickyCtaThreshold, setStickyCtaThreshold] = useState<number>(20);
  const [undoStack, setUndoStack] = useState<{ sections: Section[], timestamp: number } | null>(null);
  const [subtitle, setSubtitle] = useState<string>("Featured Story");
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchTags();

      if (editId) {
        loadExistingPage(editId);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate, editId]);

  const loadExistingPage = async (pageId: string) => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (error) {
      toast({ title: "Error loading page", description: error.message, variant: "destructive" });
      return;
    }

    if (data) {
      const content = data.content as any;
      setPageTitle(data.title);
      setPageSlug(data.slug || "");
      setCTAUrl(data.cta_url || "");
      setImageUrl(data.image_url || "");
      const template = data.template as "magazine" | "news" | "blog";
      setSelectedTemplate(template || "magazine");
      setCtaStyle((data.cta_style as any) || "ctaAmazon");
      setStickyCtaThreshold((data.sticky_cta_threshold as number) || 20);
      setSubtitle(data.subtitle || "Featured Story");
      setAnalysisResult({
        layout: "default",
        sections: content.sections,
        cta: { primary: data.cta_text || "Get Started" }
      });
      setIsEditorMode(true);

      // Load page tags
      const { data: pageTagsData } = await supabase
        .from("page_tags")
        .select("tag_id")
        .eq("page_id", pageId);
      
      if (pageTagsData) {
        setSelectedTags(pageTagsData.map(pt => pt.tag_id));
      }
    }
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .order("name");
    setAvailableTags(data || []);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({ title: "Please enter a tag name", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({ user_id: user?.id, name: newTagName.trim(), color: newTagColor })
      .select();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tag created!" });
      setNewTagName("");
      setNewTagColor("#3b82f6");
      setShowNewTagDialog(false);
      fetchTags();
      
      // Automatically select the newly created tag
      if (data && data[0]) {
        setSelectedTags([...selectedTags, data[0].id]);
      }
    }
  };

  const colorPalette = [
    "#3b82f6", "#22c55e", "#ef4444", "#eab308",
    "#a855f7", "#ec4899", "#f97316", "#14b8a6"
  ];

  const detectLanguage = (text: string): string => {
    // Simple language detection based on common patterns
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    
    if (cyrillicPattern.test(text)) return "Russian";
    if (arabicPattern.test(text)) return "Arabic";
    if (chinesePattern.test(text)) return "Chinese";
    if (japanesePattern.test(text)) return "Japanese";
    
    // Add more language detection as needed
    return "English";
  };

  const generateAutoTitle = (sections: Section[], text: string): string => {
    // Extract headline from first section with heading or content
    let headline = "";
    
    if (sections.length > 0) {
      if (sections[0].heading) {
        headline = sections[0].heading;
      } else if (sections[0].content) {
        // Take first 50 characters of content as headline
        headline = sections[0].content.substring(0, 50);
      }
    }
    
    // Fallback to input text if no headline found
    if (!headline && text) {
      headline = text.substring(0, 50);
    }
    
    // Clean up the headline
    headline = stripHtmlTags(headline).trim();
    if (headline.length > 50) {
      headline = headline.substring(0, 47) + "...";
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const language = detectLanguage(text);
    
    return `${headline} - ${today} - ${language}`;
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast({ title: "Please enter some text to analyze", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: inputText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze text");
      }

      const data = await response.json();
      
      // Strip HTML tags from all content
      const cleanedData = {
        ...data,
        sections: data.sections.map((section: Section) => ({
          ...section,
          heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
          content: stripHtmlTags(section.content),
        })),
      };
      
      setAnalysisResult(cleanedData);
      setIsEditorMode(true);
      
      // Auto-generate title and slug
      const autoTitle = generateAutoTitle(cleanedData.sections, inputText);
      setPageTitle(autoTitle);
      
      // Auto-save as draft
      const slug = generateSlug(autoTitle);
      setPageSlug(slug);
      const pageData = {
        user_id: user.id,
        title: autoTitle,
        slug: slug,
        status: "draft" as const,
        template: selectedTemplate,
        cta_style: ctaStyle,
        sticky_cta_threshold: stickyCtaThreshold,
        subtitle: subtitle,
        content: { sections: cleanedData.sections } as any,
        cta_text: cleanedData.cta.primary || "Get Started",
        cta_url: ctaUrl || "",
        image_url: imageUrl,
        published_at: null
      };

      if (editId) {
        const { error } = await supabase
          .from("pages")
          .update(pageData)
          .eq("id", editId);

        if (error) throw error;
      } else {
        const { data: insertData, error } = await supabase
          .from("pages")
          .insert([pageData])
          .select();
        
        if (error) throw error;
        
        // Update the URL without causing a redirect/reload
        if (insertData?.[0]?.id) {
          const newUrl = `/dashboard?edit=${insertData[0].id}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
      
      toast({ title: "Page analyzed and saved as draft!" });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to analyze text", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!pageTitle.trim()) {
      toast({ title: "Please enter a page title", variant: "destructive" });
      return;
    }

    if (status === "published" && !ctaUrl.trim()) {
      toast({ title: "Please enter a CTA URL before publishing", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const slug = pageSlug || generateSlug(pageTitle);
      const pageData = {
        user_id: user.id,
        title: pageTitle,
        slug: slug,
        status: status,
        template: selectedTemplate,
        cta_style: ctaStyle,
        sticky_cta_threshold: stickyCtaThreshold,
        subtitle: subtitle,
        content: { sections: analysisResult?.sections || [] } as any,
        cta_text: analysisResult?.cta.primary || "Get Started",
        cta_url: ctaUrl,
        image_url: imageUrl,
        published_at: status === "published" ? new Date().toISOString() : null
      };

      let pageId = editId;

      if (editId) {
        const { error } = await supabase
          .from("pages")
          .update(pageData)
          .eq("id", editId);

        if (error) throw error;
      } else {
        const { data: insertData, error } = await supabase
          .from("pages")
          .insert([pageData])
          .select();
        
        if (error) throw error;
        pageId = insertData?.[0]?.id || null;
      }

      // Handle tags
      if (pageId) {
        // Delete existing page_tags
        await supabase
          .from("page_tags")
          .delete()
          .eq("page_id", pageId);

        // Insert new page_tags
        if (selectedTags.length > 0) {
          const pageTagsToInsert = selectedTags.map(tagId => ({
            page_id: pageId,
            tag_id: tagId
          }));

          await supabase
            .from("page_tags")
            .insert(pageTagsToInsert);
        }
      }

      toast({ title: `Page ${status === "published" ? "published" : "saved"}!` });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Error saving page", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
      return;
    }
    setAnalysisResult(null);
    setInputText("");
    setIsEditorMode(false);
    setPageTitle("");
    setCTAUrl("");
    setImageUrl("");
    setEditingSectionIndex(null);
    setSelectedTemplate("magazine");
    setCtaStyle("ctaAmazon");
    setStickyCtaThreshold(20);
    setSubtitle("Featured Story");
  };

  const handleSaveSection = (index: number, updatedSection: Section) => {
    if (!analysisResult) return;
    
    const newSections = [...analysisResult.sections];
    newSections[index] = updatedSection;
    
    setAnalysisResult({
      ...analysisResult,
      sections: newSections,
    });
    setEditingSectionIndex(null);
    toast({ title: "Section updated!" });
  };

  const handleDeleteSection = (index: number) => {
    if (!analysisResult) return;
    
    // Save current state for undo
    setUndoStack({
      sections: [...analysisResult.sections],
      timestamp: Date.now()
    });
    
    const deletedSection = analysisResult.sections[index];
    const sectionTitle = deletedSection.heading || "Section";
    
    const newSections = analysisResult.sections.filter((_, i) => i !== index);
    setAnalysisResult({
      ...analysisResult,
      sections: newSections,
    });
    setEditingSectionIndex(null);
    
    toast({ 
      title: `"${sectionTitle}" deleted`,
      description: "You can undo this action for the next 10 seconds.",
      duration: 10000,
      variant: "destructive"
    });
    
    // Clear undo stack after 10 seconds
    setTimeout(() => {
      setUndoStack((current) => {
        if (current && Date.now() - current.timestamp >= 10000) {
          return null;
        }
        return current;
      });
    }, 10000);
  };

  const handleUndo = () => {
    if (!undoStack || !analysisResult) return;
    
    setAnalysisResult({
      ...analysisResult,
      sections: undoStack.sections,
    });
    setUndoStack(null);
    toast({ title: "Section restored!" });
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (!analysisResult) return;
    
    const newSections = [...analysisResult.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    setAnalysisResult({
      ...analysisResult,
      sections: newSections,
    });
    toast({ title: "Section moved!" });
  };

  const handleReorderSections = (newOrder: string[]) => {
    if (!analysisResult) return;
    
    // Create a map of section index to section
    const sectionMap = new Map(analysisResult.sections.map((section, idx) => [idx.toString(), section]));
    
    // Reorder sections based on the new order
    const reorderedSections = newOrder.map(id => {
      const section = sectionMap.get(id);
      if (!section) throw new Error(`Section with id ${id} not found`);
      return section;
    });
    
    setAnalysisResult({
      ...analysisResult,
      sections: reorderedSections,
    });
    toast({ title: "Sections reordered!" });
  };

  const handleAddSection = () => {
    if (!analysisResult) return;
    
    const newSection: Section = {
      type: "text",
      content: "Enter your content here...",
      heading: "New Section",
      imagePosition: "none",
      style: "normal",
    };
    
    setAnalysisResult({
      ...analysisResult,
      sections: [...analysisResult.sections, newSection],
    });
    toast({ title: "Section added!" });
  };

  const handleUpdateSection = (index: number, updatedSection: Section) => {
    if (!analysisResult) return;
    const newSections = [...analysisResult.sections];
    newSections[index] = updatedSection;
    setAnalysisResult({
      ...analysisResult,
      sections: newSections,
    });
  };

  const handleUpdateCta = (newCtaText: string) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      cta: { ...analysisResult.cta, primary: newCtaText },
    });
  };

  const normalizeUrl = (url: string): string => {
    if (!url) return url;
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  const handleCtaClick = () => {
    if (!ctaUrl) return;
    const normalizedUrl = normalizeUrl(ctaUrl);
    window.open(normalizedUrl, "_blank");
  };

  const renderTemplate = () => {
    const templateProps = {
      sections: analysisResult?.sections || [],
      ctaText: analysisResult?.cta.primary || "Get Started",
      onCtaClick: handleCtaClick,
      ctaVariant: ctaStyle,
      imageUrl,
      isEditing: true,
      userId: user?.id,
      subtitle: subtitle,
      onUpdateSubtitle: setSubtitle,
      onUpdateSection: handleUpdateSection,
      onUpdateCta: handleUpdateCta,
      onAddSection: handleAddSectionAt,
      onDeleteSection: handleDeleteSection,
      onReorderSections: handleReorderSections,
    };

    switch (selectedTemplate) {
      case "news":
        return <NewsTemplate {...templateProps} />;
      case "blog":
        return <BlogTemplate {...templateProps} />;
      case "magazine":
      default:
        return <MagazineTemplate {...templateProps} />;
    }
  };

  const handleAddSectionAt = (afterIndex: number, type: "text" | "image") => {
    if (!analysisResult) return;
    
    const newSection: Section = type === "image" 
      ? {
          type: "image",
          content: "",
          imageUrl: "",
          imagePosition: "full",
          style: "normal",
        }
      : {
          type: "text",
          content: "Enter your content here...",
          heading: "New Section",
          imagePosition: "none",
          style: "normal",
        };
    
    const newSections = [...analysisResult.sections];
    newSections.splice(afterIndex + 1, 0, newSection);
    
    setAnalysisResult({
      ...analysisResult,
      sections: newSections,
    });
    toast({ title: `${type === "image" ? "Image" : "Text"} section added!` });
  };

  const handleOptimizeWithAI = async () => {
    if (!analysisResult) return;
    
    setIsAnalyzing(true);
    try {
      // Convert current content to text format for AI
      const contentText = analysisResult.sections
        .map(s => `${s.heading || ""}\n\n${s.content}`)
        .join('\n\n---\n\n');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: contentText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to optimize content");
      }

      const data = await response.json();
      
      const cleanedData = {
        ...data,
        sections: data.sections.map((section: Section) => ({
          ...section,
          heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
          content: stripHtmlTags(section.content),
        })),
      };
      
      setAnalysisResult(cleanedData);
      toast({ title: "Content optimized with AI!" });
    } catch (error) {
      console.error("Optimization error:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to optimize content", 
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isEditorMode && analysisResult) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container py-2">
            <Tabs defaultValue="content" className="w-full">
              <div className="flex items-center justify-between mb-2">
                <TabsList className="h-9">
                  <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                  <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2 items-center">
                  <Button 
                    onClick={() => setShowHtmlEditor(true)} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                  >
                    <Code className="mr-1 h-3 w-3" />
                    HTML
                  </Button>
                  <Button onClick={handleReset} variant="ghost" size="sm" className="h-8 px-3 text-xs">
                    Cancel
                  </Button>
                  <Button onClick={() => handleSave("draft")} disabled={saving} variant="ghost" size="sm" className="h-8 px-3 text-xs">
                    <Save className="mr-1 h-3 w-3" />
                    Draft
                  </Button>
                  <Button 
                    onClick={handleUndo} 
                    disabled={!undoStack || saving}
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                    title={undoStack ? "Undo last change" : "No changes to undo"}
                  >
                    <Undo2 className="mr-1 h-3 w-3" />
                    Undo
                  </Button>
                  <Button onClick={() => handleSave("published")} disabled={saving} size="sm" className="h-8 px-3 text-xs">
                    <Globe className="mr-1 h-3 w-3" />
                    Publish
                  </Button>
                </div>
              </div>

              <TabsContent value="content" className="m-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Page Title</label>
                    <Input
                      placeholder="Enter page title..."
                      value={pageTitle}
                      onChange={(e) => {
                        setPageTitle(e.target.value);
                        if (!pageSlug || pageSlug === generateSlug(pageTitle)) {
                          setPageSlug(generateSlug(e.target.value));
                        }
                      }}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">URL Slug</label>
                    <Input
                      placeholder="your-page-url"
                      value={pageSlug}
                      onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, ''))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">CTA URL</label>
                    <Input
                      placeholder="https://your-offer.com"
                      value={ctaUrl}
                      onChange={(e) => setCTAUrl(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Tags</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return tag ? (
                        <Badge 
                          key={tagId}
                          style={{backgroundColor: tag.color, color: 'white'}}
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))}
                        >
                          {tag.name}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ) : null;
                    })}
                    <Select 
                      value="" 
                      onValueChange={(val) => {
                        if (val === "create-new") {
                          setShowNewTagDialog(true);
                        } else if (val && !selectedTags.includes(val)) {
                          setSelectedTags([...selectedTags, val]);
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 w-[120px] text-xs">
                        <SelectValue placeholder="Add tag..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="create-new" className="text-xs font-semibold text-primary">
                          <Plus className="inline h-3 w-3 mr-1" />
                          Create new tag
                        </SelectItem>
                        {availableTags.length > 0 && <div className="h-px bg-border my-1" />}
                        {availableTags
                          .filter(tag => !selectedTags.includes(tag.id))
                          .map(tag => (
                            <SelectItem key={tag.id} value={tag.id} className="text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: tag.color}} />
                                {tag.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="design" className="m-0 space-y-3">
                <div>
                  <label className="text-xs font-medium mb-2 block">Page Template</label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTemplate === "magazine" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTemplate("magazine")}
                      className="h-9 flex-1"
                    >
                      Magazine
                    </Button>
                    <Button
                      variant={selectedTemplate === "news" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTemplate("news")}
                      className="h-9 flex-1"
                    >
                      News
                    </Button>
                    <Button
                      variant={selectedTemplate === "blog" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTemplate("blog")}
                      className="h-9 flex-1"
                    >
                      Blog
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block">CTA Button Style (updates live preview)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant={ctaStyle === "ctaAmazon" ? "ctaAmazon" : "outline"}
                      size="sm"
                      onClick={() => setCtaStyle("ctaAmazon")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <span className="text-2xl">🛒</span>
                      <span className="text-xs">Amazon</span>
                    </Button>
                    <Button
                      variant={ctaStyle === "ctaUrgent" ? "ctaUrgent" : "outline"}
                      size="sm"
                      onClick={() => setCtaStyle("ctaUrgent")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <span className="text-2xl">⚡</span>
                      <span className="text-xs">Urgent</span>
                    </Button>
                    <Button
                      variant={ctaStyle === "ctaPremium" ? "ctaPremium" : "outline"}
                      size="sm"
                      onClick={() => setCtaStyle("ctaPremium")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <span className="text-2xl">✨</span>
                      <span className="text-xs">Premium</span>
                    </Button>
                    <Button
                      variant={ctaStyle === "ctaTrust" ? "ctaTrust" : "outline"}
                      size="sm"
                      onClick={() => setCtaStyle("ctaTrust")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <span className="text-2xl">🛡️</span>
                      <span className="text-xs">Trust</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block">
                    Sticky CTA Appears at {stickyCtaThreshold}% scroll
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={stickyCtaThreshold}
                      onChange={(e) => setStickyCtaThreshold(Number(e.target.value))}
                      className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-xs text-muted-foreground">100%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    The sticky button will appear when users scroll down this percentage of the page
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="m-0 space-y-3">
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {showHtmlEditor && (
          <HtmlEditor
            sections={analysisResult.sections}
            onSave={(newSections) => {
              setAnalysisResult({
                ...analysisResult,
                sections: newSections,
              });
            }}
            onClose={() => setShowHtmlEditor(false)}
          />
        )}

        {editingSectionIndex !== null ? (
          <div className="container py-8">
            <SectionEditor
              section={analysisResult.sections[editingSectionIndex]}
              index={editingSectionIndex}
              totalSections={analysisResult.sections.length}
              onSave={(updatedSection) => handleSaveSection(editingSectionIndex, updatedSection)}
              onDelete={() => handleDeleteSection(editingSectionIndex)}
              onMoveUp={() => handleMoveSection(editingSectionIndex, "up")}
              onMoveDown={() => handleMoveSection(editingSectionIndex, "down")}
              onCancel={() => setEditingSectionIndex(null)}
            />
          </div>
        ) : (
          <>
            {renderTemplate()}
            <div className="container py-8">
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setEditingSectionIndex(0)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Content
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddSection}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>
          </>
        )}

        <StickyCtaButton 
          text={analysisResult.cta.primary} 
          onClick={() => ctaUrl && window.open(ctaUrl, "_blank")} 
        />

        {/* New Tag Dialog */}
        <Dialog open={showNewTagDialog} onOpenChange={setShowNewTagDialog}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  placeholder="e.g., Summer Campaign"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                />
              </div>
              <div className="space-y-2">
                <Label>Tag Color</Label>
                <div className="flex gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-10 h-10 rounded-md border-2 transition-all hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        borderColor: newTagColor === color ? "hsl(var(--primary))" : "transparent"
                      }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTagDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTag}>
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Presell Page Generator
            </h1>
            <p className="text-xl text-muted-foreground">
              Paste your text and let AI create a high-converting presell page
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                Your Content
              </label>
              <Textarea
                id="content"
                placeholder="Paste your advertorial or presell content here... The AI will analyze it and create an optimized layout with headlines, sections, and CTAs."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px] resize-y"
              />
            </div>

            <Button
              variant="cta"
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Generate Presell Page"
              )}
            </Button>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ AI analyzes your text and identifies key sections</li>
                <li>✓ Automatically formats headlines, subheadlines, and body copy</li>
                <li>✓ Adds strategic image placements for better engagement</li>
                <li>✓ Creates compelling CTAs optimized for conversion</li>
                <li>✓ Generates a mobile-friendly, responsive layout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;