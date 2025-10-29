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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageUpload } from "@/components/ImageUpload";
import { MagazineTemplate } from "@/components/templates/MagazineTemplate";
import { NewsTemplate } from "@/components/templates/NewsTemplate";
import { BlogTemplate } from "@/components/templates/BlogTemplate";
import { SectionEditor } from "@/components/SectionEditor";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { HtmlEditor } from "@/components/HtmlEditor";
import { SectionTemplateModal } from "@/components/SectionTemplateModal";
import { toast } from "@/hooks/use-toast";
import { stripHtmlTags, cn } from "@/lib/utils";
import { Loader2, Save, Globe, Edit2, Plus, Sparkles, Code, X, Undo2, ChevronDown } from "lucide-react";

interface Section {
  id?: string;
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial" | "quote" | "facebook-testimonial" | "bullet-box";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
  ctaText?: string;
  author?: string;
  authorRole?: string;
  authorAvatar?: string;
  timestamp?: string;
  reactions?: number;
  items?: string[];
  boxColor?: "green" | "blue" | "purple" | "yellow";
}

interface AnalysisResult {
  layout: string;
  sections: Section[];
  cta: {
    primary: string;
    secondary?: string;
  };
}

const ensureSectionId = (section: Section): Section & { id: string } => {
  return {
    ...section,
    id: section.id || crypto.randomUUID()
  };
};

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
  const [headline, setHeadline] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [showAddMoreDialog, setShowAddMoreDialog] = useState(false);
  const [addMoreText, setAddMoreText] = useState("");
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isDesignOptionsExpanded, setIsDesignOptionsExpanded] = useState(false);

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

  // Auto-hide header on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Always show header at top of page
          if (currentScrollY < 50) {
            setIsHeaderVisible(true);
          } else if (currentScrollY > lastScrollY) {
            // Scrolling down - hide header
            setIsHeaderVisible(false);
          } else {
            // Scrolling up - show header
            setIsHeaderVisible(true);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      setHeadline((data as any).headline || "");
      
      setAnalysisResult({
        layout: "default",
        sections: content.sections.map((s: Section) => ensureSectionId(s)),
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
      
      // Strip HTML tags from all content and ensure IDs
      const cleanedData = {
        ...data,
        sections: data.sections.map((section: Section) => ensureSectionId({
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
      
      // Extract headline from first hero section
      const heroSection = cleanedData.sections?.find((s: Section) => s.type === "hero");
      if (heroSection) {
        setHeadline(heroSection.heading || heroSection.content || "");
      }
      
      // Auto-save as draft
      const slug = generateSlug(autoTitle, !editId);
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

  const generateSlug = (title: string, addUniqueSuffix: boolean = false) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    if (addUniqueSuffix) {
      // Add timestamp + short random string for uniqueness
      const timestamp = Date.now().toString(36); // Convert to base36 for shorter string
      const random = Math.random().toString(36).substring(2, 6); // 4 random chars
      return `${baseSlug}-${timestamp}${random}`;
    }
    
    return baseSlug;
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
        headline: headline,
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
    
    const hero = analysisResult.sections[0];
    const body = analysisResult.sections.slice(1);
    
    // Create a map of body section ID to section
    const sectionMap = new Map(body.map(section => [section.id!, section]));
    
    // Reorder body sections based on the new order of IDs
    const reorderedBody = newOrder.map(id => {
      const section = sectionMap.get(id);
      if (!section) throw new Error(`Section with id ${id} not found`);
      return section;
    });
    
    setAnalysisResult({
      ...analysisResult,
      sections: [hero, ...reorderedBody],
    });
    toast({ title: "Sections reordered!" });
  };

  const handleAddSection = () => {
    if (!analysisResult) return;
    
    const newSection: Section = ensureSectionId({
      type: "text",
      content: "Enter your content here...",
      heading: "New Section",
      imagePosition: "none",
      style: "normal",
    });
    
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

  const handleEditSectionById = (id: string) => {
    if (!analysisResult) return;
    const index = analysisResult.sections.findIndex((s) => s.id === id);
    if (index !== -1) setEditingSectionIndex(index);
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
      headline: headline,
      onUpdateSubtitle: setSubtitle,
      onUpdateHeadline: setHeadline,
      onUpdateSection: handleUpdateSection,
      onUpdateCta: handleUpdateCta,
      onAddSection: handleAddSectionAt,
      onDeleteSection: handleDeleteSection,
      onReorderSections: handleReorderSections,
      onEditSection: setEditingSectionIndex,
      onEditSectionById: handleEditSectionById,
    } as const;

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
    
    const newSection: Section = ensureSectionId(type === "image" 
      ? {
          type: "image",
          content: "",
          imageUrl: "",
          imagePosition: "full",
          style: "normal",
        }
      : {
          type: "text",
          content: "Enter your paragraph here...",
          imagePosition: "none",
          style: "normal",
        });
    
    const newSections = [...analysisResult.sections];
    newSections.splice(afterIndex + 1, 0, newSection);
    
    setAnalysisResult({
      ...analysisResult,
      sections: newSections,
    });
    toast({ title: `${type === "image" ? "Image" : "Paragraph"} section added!` });
  };

  const handleSelectTemplate = (type: string) => {
    if (!analysisResult) return;
    
    let newSection: Section;
    
    switch (type) {
      case "quote":
        newSection = {
          type: "quote",
          content: "Enter your quote here...",
          author: "Author Name",
          authorRole: "Role or Title",
          style: "normal",
        };
        break;
      case "facebook-testimonial":
        newSection = {
          type: "facebook-testimonial",
          content: "Share your experience here...",
          author: "User Name",
          timestamp: "2 days ago",
          reactions: 0,
          style: "normal",
        };
        break;
      case "bullet-box":
        newSection = {
          type: "bullet-box",
          content: "",
          heading: "Key Points",
          items: ["Point 1", "Point 2", "Point 3"],
          boxColor: "blue",
          style: "normal",
        };
        break;
      default:
        newSection = {
          type: "text",
          content: "Enter content here...",
          heading: type === "headline" ? "New Section" : undefined,
          style: "normal",
        };
    }
    
    setAnalysisResult({
      ...analysisResult,
      sections: [...analysisResult.sections, ensureSectionId(newSection)],
    });
    
    setShowTemplateModal(false);
    toast({ title: "Section added!" });
  };

  const handleAddMoreText = async () => {
    if (!addMoreText.trim() || !analysisResult) {
      toast({ 
        title: "Please enter some text", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsAddingMore(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-text", {
        body: { text: addMoreText }
      });
      
      if (error) throw error;
      
      if (data && data.sections) {
        // Filter out hero section from new content (we already have one)
        const newSections = data.sections.filter((s: Section) => s.type !== "hero");
        
        // Append new sections to existing ones
        setAnalysisResult({
          ...analysisResult,
          sections: [...analysisResult.sections, ...newSections.map((s: Section) => ensureSectionId(s))]
        });
        
        toast({ 
          title: `Added ${newSections.length} new section${newSections.length > 1 ? 's' : ''}!`,
          description: "Scroll down to see the new content"
        });
        
        setShowAddMoreDialog(false);
        setAddMoreText("");
      }
    } catch (error: any) {
      console.error("Error adding more text:", error);
      toast({ 
        title: "Error parsing text", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsAddingMore(false);
    }
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
        sections: data.sections.map((section: Section) => ensureSectionId({
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
        
        <div className={cn(
          "border-b bg-background/95 backdrop-blur sticky top-0 z-50 transition-transform duration-300 ease-in-out",
          !isHeaderVisible && "-translate-y-full"
        )}>
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
                  <div className="flex gap-1 border rounded-md p-1">
                    <Button
                      variant={previewMode === "desktop" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("desktop")}
                      className="h-6 px-2 text-xs"
                    >
                      Desktop
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("mobile")}
                      className="h-6 px-2 text-xs"
                    >
                      Mobile
                    </Button>
                  </div>
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

                <Collapsible open={isDesignOptionsExpanded} onOpenChange={setIsDesignOptionsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-9 flex items-center justify-between"
                    >
                      <span className="text-xs font-medium">
                        {isDesignOptionsExpanded ? "Hide" : "Show"} Design Options
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isDesignOptionsExpanded && "rotate-180"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-3 mt-3">
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
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="settings" className="m-0 space-y-3">
                <div>
                  <label className="text-xs font-medium mb-2 block">Headline Text Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs"
                    >
                      Small
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9 text-xs"
                    >
                      Medium
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs"
                    >
                      Large
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adjust the size of headlines throughout your page
                  </p>
                </div>
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

        <Sheet open={editingSectionIndex !== null} onOpenChange={(open) => !open && setEditingSectionIndex(null)}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Section</SheetTitle>
            </SheetHeader>
            {editingSectionIndex !== null && (
              <div className="mt-4">
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
            )}
          </SheetContent>
        </Sheet>

        {editingSectionIndex === null && (
          <>
            <div className={cn(
              "mx-auto transition-all duration-300",
              previewMode === "mobile" ? "max-w-[375px]" : "w-full"
            )}>
              {renderTemplate()}
            </div>
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
                  onClick={() => setShowTemplateModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddMoreDialog(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Parse & Add More Text
                </Button>
              </div>
            </div>
          </>
        )}

        <StickyCtaButton 
          text={analysisResult.cta.primary} 
          onClick={() => ctaUrl && window.open(ctaUrl, "_blank")} 
        />

        {/* Parse & Add More Text Dialog */}
        <Dialog open={showAddMoreDialog} onOpenChange={setShowAddMoreDialog}>
          <DialogContent className="bg-background max-w-2xl">
            <DialogHeader>
              <DialogTitle>Parse & Add More Text</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-more-text">
                  Paste additional text to add to your page
                </Label>
                <Textarea
                  id="add-more-text"
                  placeholder="Paste your additional content here... The AI will structure it and add it to the end of your page."
                  value={addMoreText}
                  onChange={(e) => setAddMoreText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  disabled={isAddingMore}
                />
                <p className="text-xs text-muted-foreground">
                  Tip: For best results with long texts (5,000+ words), paste in chunks of ~3,000 words at a time.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddMoreDialog(false);
                  setAddMoreText("");
                }}
                disabled={isAddingMore}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMoreText}
                disabled={isAddingMore}
              >
                {isAddingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse & Add
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Section Template Modal */}
        <SectionTemplateModal
          open={showTemplateModal}
          onOpenChange={setShowTemplateModal}
          onSelectTemplate={handleSelectTemplate}
        />
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
              G&R Advertorial Launcher
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