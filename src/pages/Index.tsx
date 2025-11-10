import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ImageUpload } from "@/components/ImageUpload";
import { MagazineTemplate } from "@/components/templates/MagazineTemplate";
import { NewsTemplate } from "@/components/templates/NewsTemplate";
import { BlogTemplate } from "@/components/templates/BlogTemplate";
import { ListicleTemplate } from "@/components/templates/ListicleTemplate";
import { getStoryAdvertorialTemplate } from "@/components/templates/StoryAdvertorialTemplate";
import { getPersonalStoryBlogTemplate } from "@/components/templates/PersonalStoryBlogTemplate";
import { SectionEditor } from "@/components/SectionEditor";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { HtmlEditor } from "@/components/HtmlEditor";
import { SectionTemplateModal } from "@/components/SectionTemplateModal";
import { SnippetsSection } from "@/components/SnippetsSection";
import { toast } from "@/hooks/use-toast";
import { stripHtmlTags, cn } from "@/lib/utils";
import { MultiSelectToolbar } from "@/components/MultiSelectToolbar";
import { MultiSectionSnippetDialog } from "@/components/MultiSectionSnippetDialog";
import { 
  Loader2, 
  Save, 
  Globe, 
  Edit2, 
  Plus, 
  Sparkles, 
  Code, 
  X, 
  Undo2, 
  ChevronDown, 
  Settings, 
  Link as LinkIcon, 
  Palette,
  Monitor,
  Smartphone,
  AlertTriangle,
  FileText,
  Newspaper,
  BookOpen,
  ListOrdered,
  BookMarked,
  CheckSquare
} from "lucide-react";

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

interface AnalysisResult {
  layout: string;
  sections: Section[];
  cta: {
    primary: string;
    secondary?: string;
  };
}

const ensureSectionMetadata = (section: Section, index: number): Section & { id: string } => {
  return {
    ...section,
    id: section.id || crypto.randomUUID(),
    order: section.order !== undefined ? section.order : index
  };
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEditId = searchParams.get("edit");
  const [editId, setEditId] = useState<string | null>(initialEditId);
  const [isLoadingExistingPage, setIsLoadingExistingPage] = useState<boolean>(!!initialEditId);

  const [user, setUser] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [inputHtml, setInputHtml] = useState(""); // Store HTML version when pasting
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [ctaUrl, setCTAUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<"magazine" | "news" | "blog" | "listicle" | "story-advertorial" | "personal-story">("magazine");
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
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [addMoreText, setAddMoreText] = useState("");
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const isInitialLoadRef = useRef(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isDesignOptionsExpanded, setIsDesignOptionsExpanded] = useState(false);
  const [selectedCountrySetupId, setSelectedCountrySetupId] = useState<string>("");
  const [availableCountrySetups, setAvailableCountrySetups] = useState<Array<{
    id: string;
    name: string;
    google_analytics_id?: string | null;
    facebook_pixel_id?: string | null;
    triplewhale_token?: string | null;
    microsoft_clarity_id?: string | null;
  }>>([]);
  const [selectedSetupDetails, setSelectedSetupDetails] = useState<any>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(true);
  const [ctaConfigOpen, setCtaConfigOpen] = useState(false);
  const [designOptionsOpen, setDesignOptionsOpen] = useState(false);
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedSections, setSelectedSections] = useState<number[]>([]);
  const [showMultiSnippetDialog, setShowMultiSnippetDialog] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchTags();
      fetchCountrySetups(session.user.id);

      const currentEditId = searchParams.get("edit");
      setEditId(currentEditId);
      if (currentEditId) {
        loadExistingPage(currentEditId);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  // Load snippet from sessionStorage (from "Use in Page" feature)
  useEffect(() => {
    const loadSnippetData = sessionStorage.getItem('loadSnippet');
    if (loadSnippetData) {
      try {
        const snippet = JSON.parse(loadSnippetData);
        const sectionsWithMetadata = snippet.sections.map((s: Section, i: number) => ensureSectionMetadata(s, i));
        
        setAnalysisResult({
          layout: "default",
          sections: sectionsWithMetadata,
          cta: { primary: "Get Started" }
        });
        setIsEditorMode(true);
        
        // Apply snippet tags if available
        if (snippet.tags && Array.isArray(snippet.tags)) {
          setSelectedTags(snippet.tags.map((t: any) => t.id));
        }
        
        // Set page title from snippet name
        setPageTitle(snippet.name);
        
        // Clear sessionStorage to prevent re-loading on refresh
        sessionStorage.removeItem('loadSnippet');
        
        toast({ 
          title: "Snippet loaded successfully", 
          description: `${sectionsWithMetadata.length} sections loaded from "${snippet.name}"` 
        });
      } catch (error) {
        console.error("Error loading snippet:", error);
        toast({ 
          title: "Error loading snippet", 
          description: "Failed to parse snippet data", 
          variant: "destructive" 
        });
        sessionStorage.removeItem('loadSnippet');
      }
    }
  }, []);

  // Auto-hide header on scroll down, show on scroll up (disabled in editor mode)
  useEffect(() => {
    // Keep header always visible in editor mode
    if (isEditorMode) {
      setIsHeaderVisible(true);
      return;
    }

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
  }, [isEditorMode]);

  const loadExistingPage = async (pageId: string) => {
    setIsLoadingExistingPage(true);
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .maybeSingle();

    if (error) {
      toast({ title: "Error loading page", description: error.message, variant: "destructive" });
      setIsLoadingExistingPage(false);
      return;
    }

    if (!data) {
      toast({ title: "Page not found", description: "This page may have been deleted.", variant: "destructive" });
      navigate("/dashboard");
      setIsLoadingExistingPage(false);
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
      setSelectedCountrySetupId((data as any).tracking_script_set_id || "");
      setIsPublished(data.status === "published");
      
      setAnalysisResult({
        layout: "default",
        sections: content.sections.map((s: Section, i: number) => ensureSectionMetadata(s, i)),
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
    setIsLoadingExistingPage(false);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .order("name");
    setAvailableTags(data || []);
  };

  const fetchCountrySetups = async (userId?: string) => {
    const effectiveUserId = userId || user?.id;
    if (!effectiveUserId) return;
    
    const { data } = await supabase
      .from("tracking_script_sets")
      .select("id, name, google_analytics_id, facebook_pixel_id, triplewhale_token, microsoft_clarity_id")
      .eq("user_id", effectiveUserId)
      .order("name");
    
    setAvailableCountrySetups(data || []);
    
    // Auto-select if only one setup exists and creating new page
    if (!editId && data && data.length === 1) {
      setSelectedCountrySetupId(data[0].id);
    }
  };

  // Fetch selected Country Setup details for preview
  useEffect(() => {
    if (selectedCountrySetupId) {
      supabase
        .from("tracking_script_sets")
        .select("*")
        .eq("id", selectedCountrySetupId)
        .maybeSingle()
        .then(({ data }) => setSelectedSetupDetails(data || null));
    } else {
      setSelectedSetupDetails(null);
    }
  }, [selectedCountrySetupId]);

  // Autosave functionality
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges || !pageTitle.trim() || !analysisResult) {
      return;
    }

    const autosaveInterval = setInterval(() => {
      handleAutosave();
    }, 30000); // 30 seconds

    return () => clearInterval(autosaveInterval);
  }, [autosaveEnabled, hasUnsavedChanges, pageTitle, analysisResult]);

  // Track changes to set hasUnsavedChanges
  useEffect(() => {
    // Skip the initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    
    if (analysisResult) {
      setHasUnsavedChanges(true);
    }
  }, [
    analysisResult,
    pageTitle,
    pageSlug,
    ctaUrl,
    imageUrl,
    selectedTemplate,
    ctaStyle,
    stickyCtaThreshold,
    subtitle,
    headline,
    selectedTags,
    selectedCountrySetupId
  ]);

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
      // Use HTML version if preserve formatting is on and we have HTML
      const contentToAnalyze = preserveFormatting && inputHtml ? inputHtml : inputText;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: contentToAnalyze, preserveHtml: preserveFormatting }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze text");
      }

      const data = await response.json();
      
      // Strip HTML tags from content only if not preserving formatting
      const cleanedData = {
        ...data,
        sections: data.sections.map((section: Section, i: number) => ensureSectionMetadata({
          ...section,
          heading: section.heading && !preserveFormatting ? stripHtmlTags(section.heading) : section.heading,
          content: preserveFormatting ? section.content : stripHtmlTags(section.content),
        }, i)),
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
      const baseSlug = generateSlug(autoTitle, !editId);
      const slug = await ensureUniqueSlug(baseSlug, editId || undefined);
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
        published_at: null,
        tracking_script_set_id: selectedCountrySetupId || null
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
          const newPageId = insertData[0].id;
          setEditId(newPageId);
          const newUrl = `/?edit=${newPageId}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
      
      toast({ title: "Page analyzed and saved as draft!" });
    } catch (error) {
      console.error("Analysis error:", error);
      
      // Better error messaging
      let errorMessage = error instanceof Error ? error.message : "Failed to analyze text";
      if (errorMessage?.includes("duplicate") || errorMessage?.includes("unique constraint")) {
        errorMessage = "A page with this URL already exists. The system will automatically create a unique URL when you save.";
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartFromTemplate = (templateType: "magazine" | "news" | "blog" | "listicle" | "story-advertorial" | "personal-story") => {
    const templates = {
      magazine: {
        title: "Breaking Discovery Revealed",
        headline: "This Discovery Is Changing Everything",
        subtitle: "Featured Story",
        sections: [
          ensureSectionMetadata({
            type: "hero" as const,
            heading: "This Discovery Is Changing Everything",
            content: "Scientists are calling it the breakthrough of the decade. What started as a simple observation has turned into a revolutionary finding that could change the way we live.",
            style: "normal" as const,
            imagePosition: "none" as const,
          }, 0),
          ensureSectionMetadata({
            type: "text" as const,
            content: "For years, researchers struggled with this problem. Traditional approaches weren't working, and many had given up hope. But then everything changed when a team discovered something unexpected.",
            style: "normal" as const,
            imagePosition: "none" as const,
          }, 1),
        ],
        cta: { primary: "Learn More", secondary: "" },
      },
      news: {
        title: "Breaking News Update",
        headline: "Just Announced: Major Development",
        subtitle: "Breaking News",
        sections: [
          ensureSectionMetadata({
            type: "hero" as const,
            heading: "Just Announced: Major Development",
            content: "In a surprising turn of events, experts have confirmed what many suspected. This changes everything we thought we knew.",
            style: "normal" as const,
            imagePosition: "none" as const,
          }, 0),
        ],
        cta: { primary: "Read Full Story", secondary: "" },
      },
      blog: {
        title: "The Ultimate Guide",
        headline: "Everything You Need To Know",
        subtitle: "Expert Insights",
        sections: [
          ensureSectionMetadata({
            type: "hero" as const,
            heading: "Everything You Need To Know",
            content: "After years of research and testing, we've compiled the complete guide. Here's what actually works.",
            style: "normal" as const,
            imagePosition: "none" as const,
          }, 0),
        ],
        cta: { primary: "Get Started", secondary: "" },
      },
      listicle: {
        title: "5 Amazing Reasons Why This Changes Everything",
        headline: "5 Amazing Reasons Why This Changes Everything",
        subtitle: "Top List",
        sections: [
          ensureSectionMetadata({
            type: "hero" as const,
            heading: "5 Amazing Reasons Why This Changes Everything",
            content: "Discover the top 5 reasons why everyone is talking about this revolutionary discovery. Here's what you need to know.",
            style: "normal" as const,
            imagePosition: "none" as const,
          }, 0),
          ensureSectionMetadata({
            type: "list-item" as const,
            heading: "1. It's Faster, Easier, & More Convenient",
            content: "Unlike traditional methods that take hours or even days, this new approach delivers results in minutes. It's designed to fit seamlessly into your busy lifestyle.",
            imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=600&fit=crop",
            style: "normal" as const,
            imagePosition: "left" as const,
            number: 1,
          }, 1),
          ensureSectionMetadata({
            type: "list-item" as const,
            heading: "2. Customize It However You Want",
            content: "Every person is different, and this solution recognizes that. With multiple options and settings, you can personalize your experience to match your exact needs and preferences.",
            imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=600&fit=crop",
            style: "normal" as const,
            imagePosition: "left" as const,
            number: 2,
          }, 2),
          ensureSectionMetadata({
            type: "list-item" as const,
            heading: "3. Save Money While Getting Better Results",
            content: "Traditional solutions cost a fortune, and the results are often disappointing. This approach delivers superior outcomes at a fraction of the cost, helping you achieve more while spending less.",
            imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=600&fit=crop",
            style: "normal" as const,
            imagePosition: "left" as const,
            number: 3,
          }, 3),
          ensureSectionMetadata({
            type: "list-item" as const,
            heading: "4. Backed By Science & Real Results",
            content: "This isn't just marketing hype. Leading researchers have validated the approach through rigorous testing, and thousands of people are already experiencing the benefits firsthand.",
            imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=600&fit=crop",
            style: "normal" as const,
            imagePosition: "left" as const,
            number: 4,
          }, 4),
          ensureSectionMetadata({
            type: "list-item" as const,
            heading: "5. Join A Growing Community of Success Stories",
            content: "You're not alone in this journey. Over 150,000 people have already made the switch, and they're sharing their incredible experiences. Join the community and see why everyone is talking about it.",
            imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=600&fit=crop",
            style: "normal" as const,
            imagePosition: "left" as const,
            number: 5,
          }, 5),
          ensureSectionMetadata({
            type: "final-cta" as const,
            heading: "Exclusive Limited-Time Offer",
            content: "Act now and get access to this revolutionary solution before it's too late.",
            imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=600&fit=crop",
            items: ["Free shipping with your order", "Free gift with your order", "Biggest sale of the year"],
            buttonText: "SELL-OUT RISK: HIGH | FREE SHIPPING",
            style: "normal" as const,
            imagePosition: "left" as const,
          }, 6),
        ],
        cta: { primary: "Claim Your Offer Now", secondary: "" },
      },
      "story-advertorial": (() => {
        const storyTemplate = getStoryAdvertorialTemplate();
        return {
          title: storyTemplate.headline,
          headline: storyTemplate.headline,
          subtitle: "Advertorial",
          sections: storyTemplate.sections.map((s, i) => ensureSectionMetadata(s, i)),
          cta: { primary: "Claim Your Exclusive Discount Now", secondary: "" },
        };
      })(),
      "personal-story": (() => {
        const personalTemplate = getPersonalStoryBlogTemplate();
        return {
          title: personalTemplate.headline,
          headline: personalTemplate.headline,
          subtitle: "Personal Story",
          sections: personalTemplate.sections.map((s, i) => ensureSectionMetadata(s, i)),
          cta: { primary: "Start Your Transformation Today", secondary: "" },
        };
      })(),
    };

    const template = templates[templateType];
    setSelectedTemplate(templateType);
    setPageTitle(template.title);
    setHeadline(template.headline);
    setSubtitle(template.subtitle);
    setAnalysisResult({
      layout: templateType,
      sections: template.sections,
      cta: template.cta,
    });
    setIsEditorMode(true);
    toast({ 
      title: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} template loaded!`, 
      description: "Customize the content and images to match your needs." 
    });
  };

  const generateSlug = (title: string, addUniqueSuffix: boolean = false) => {
    // Remove leading/trailing punctuation and quotes first
    let cleanTitle = title.replace(/^[„"'«»\s]+|[„"'«»\s]+$/g, '');
    
    const baseSlug = cleanTitle
      .toLowerCase()
      // Replace Cyrillic and other special chars but keep alphanumerics
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-") // Keep Latin, numbers, and Cyrillic
      .replace(/[^a-z0-9-]/gi, "-") // Convert remaining to dashes
      .replace(/-+/g, "-") // Collapse multiple dashes
      .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
    
    // Ensure slug is not empty and has meaningful content
    const finalSlug = baseSlug || 'page';
    
    if (addUniqueSuffix) {
      // Add timestamp + short random string for uniqueness
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 6);
      return `${finalSlug}-${timestamp}${random}`;
    }
    
    return finalSlug;
  };

  const ensureUniqueSlug = async (proposedSlug: string, currentPageId?: string): Promise<string> => {
    // Check if slug exists for another page
    let query = supabase
      .from("pages")
      .select("id")
      .eq("slug", proposedSlug);
    
    if (currentPageId) {
      query = query.neq("id", currentPageId);
    }
    
    const { data } = await query;
    
    // If slug doesn't exist or only exists for current page, it's unique
    if (!data || data.length === 0) {
      return proposedSlug;
    }
    
    // Slug exists, add unique suffix
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${proposedSlug}-${timestamp}${random}`;
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

    // Check Country Setup is selected before publishing
    if (status === "published" && !selectedCountrySetupId) {
      toast({ 
        title: "Country Setup required", 
        description: "Please select a Country Setup before publishing.",
        variant: "destructive" 
      });
      return;
    }

    // NEW: Check if Country Setup has actual tracking scripts configured
    if (status === "published" && selectedCountrySetupId) {
      const { data: setupData } = await supabase
        .from("tracking_script_sets")
        .select("*")
        .eq("id", selectedCountrySetupId)
        .maybeSingle();
      
      const hasScripts = setupData && (
        setupData.google_analytics_id ||
        setupData.facebook_pixel_id ||
        setupData.triplewhale_token ||
        setupData.microsoft_clarity_id
      );
      
      if (!hasScripts) {
        toast({
          title: "Country Setup is empty",
          description: `The selected setup "${setupData?.name}" has no tracking scripts configured. Please add at least one tracking script in Settings or select a different setup.`,
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/settings')}
            >
              Go to Settings
            </Button>
          )
        });
        return;
      }
    }

    // Warn if no Country Setup selected for draft
    if (status === "draft" && !selectedCountrySetupId && availableCountrySetups.length > 0) {
      toast({ 
        title: "Note", 
        description: "Remember to select a Country Setup before publishing." 
      });
    }

    setSaving(true);
    try {
      const baseSlug = pageSlug || generateSlug(pageTitle, !editId);
      const slug = await ensureUniqueSlug(baseSlug, editId || undefined);
      
      // Use the latest imageUrl from state
      const currentImageUrl = imageUrl;
      
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
        image_url: currentImageUrl,
        published_at: status === "published" ? new Date().toISOString() : null,
        tracking_script_set_id: selectedCountrySetupId || null
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
        
        // Update editId for future autosaves
        if (pageId) {
          setEditId(pageId);
        }
      }

      // Handle tags
      if (pageId) {
        // Delete existing page_tags
        await supabase
          .from("page_tags")
          .delete()
          .eq("page_id", pageId);

        // Insert new page_tags with proper error handling
        if (selectedTags.length > 0) {
          const pageTagsToInsert = selectedTags.map(tagId => ({
            page_id: pageId,
            tag_id: tagId
          }));

          const { error: tagsError } = await supabase
            .from("page_tags")
            .insert(pageTagsToInsert);
          
          if (tagsError) {
            console.error("Error saving tags:", tagsError);
            toast({ 
              title: "Warning", 
              description: "Page saved but tags couldn't be added. Please try editing the page to add tags.",
              variant: "default"
            });
          }
        }
      }

      toast({ title: `Page ${status === "published" ? "published" : "saved"}!` });
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());
      setIsPublished(status === "published");
    } catch (error: any) {
      console.error("Save error:", error);
      
      // Better error messaging for common issues
      let errorMessage = error.message;
      if (error.message?.includes("duplicate") || error.message?.includes("unique constraint")) {
        errorMessage = "A page with this URL already exists. Please choose a different title or URL.";
      }
      
      toast({ 
        title: "Error saving page", 
        description: errorMessage, 
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAutosave = async () => {
    // Only autosave if we have content and a title
    if (!pageTitle.trim() || !analysisResult) {
      return;
    }

    // Don't autosave if already saving
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const baseSlug = pageSlug || generateSlug(pageTitle, !editId);
      const slug = await ensureUniqueSlug(baseSlug, editId || undefined);
      
      // Use the latest imageUrl from state
      const currentImageUrl = imageUrl;
      
      const pageData = {
        user_id: user.id,
        title: pageTitle,
        slug: slug,
        status: "draft" as const,
        template: selectedTemplate,
        cta_style: ctaStyle,
        sticky_cta_threshold: stickyCtaThreshold,
        subtitle: subtitle,
        headline: headline,
        content: { sections: analysisResult?.sections || [] } as any,
        cta_text: analysisResult?.cta.primary || "Get Started",
        cta_url: ctaUrl,
        image_url: currentImageUrl,
        published_at: null,
        tracking_script_set_id: selectedCountrySetupId || null
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
        
        // Update editId for future autosaves
        if (pageId) {
          setEditId(pageId);
        }
      }

      // Handle tags
      if (pageId) {
        await supabase
          .from("page_tags")
          .delete()
          .eq("page_id", pageId);

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

      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());
      
      toast({ 
        title: "Autosaved", 
        description: "Your changes have been saved automatically.",
        duration: 2000
      });
    } catch (error: any) {
      console.error("Autosave error:", error);
      // Silently fail autosave - don't show error toast to avoid disruption
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
    
    const newSection: Section = ensureSectionMetadata({
      type: "text",
      content: "Enter your content here...",
      heading: "New Section",
      imagePosition: "none",
      style: "normal",
    }, analysisResult.sections.length);
    
    setAnalysisResult({
      ...analysisResult,
      sections: [...analysisResult.sections, newSection],
    });
    toast({ title: "Section added!" });
  };

  const handleUpdateSection = (index: number, updatedSection: Section) => {
    if (!analysisResult) return;
    const newSections = [...analysisResult.sections];
    // Preserve existing ID and other fields, then apply updates
    newSections[index] = ensureSectionMetadata({
      ...newSections[index],
      ...updatedSection
    }, index);
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
    const handleImageUpload = (url: string) => {
      setImageUrl(url);
      setHasUnsavedChanges(true);
    };

    const templateProps = {
      sections: analysisResult?.sections || [],
      ctaText: analysisResult?.cta.primary || "Get Started",
      ctaUrl: ctaUrl,
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
      onImageUpload: handleImageUpload,
      multiSelectMode,
      selectedSections,
      onToggleMultiSelect: () => {
        setMultiSelectMode(!multiSelectMode);
        setSelectedSections([]);
      },
      onToggleSectionSelect: (index: number) => {
        setSelectedSections(prev => 
          prev.includes(index) 
            ? prev.filter(i => i !== index)
            : [...prev, index].sort((a, b) => a - b)
        );
      },
      onSaveSelectedToSnippet: () => {
        if (selectedSections.length > 0) {
          setShowMultiSnippetDialog(true);
        }
      },
    };

    // For Listicle template, we need different prop mapping
    if (selectedTemplate === "listicle") {
      const sectionsWithIds = (analysisResult?.sections || []).map(ensureSectionMetadata);
      return (
        <ListicleTemplate
          sections={sectionsWithIds}
          onSectionUpdate={(id, updates) => {
            if (!analysisResult) return;
            const index = analysisResult.sections.findIndex((s) => s.id === id);
            if (index !== -1) {
              handleUpdateSection(index, { ...analysisResult.sections[index], ...updates } as any);
            }
          }}
          onSectionDelete={(id) => {
            if (!analysisResult) return;
            const index = analysisResult.sections.findIndex((s) => s.id === id);
            if (index !== -1) handleDeleteSection(index);
          }}
            onSectionAdd={(afterId, type) => {
              if (!analysisResult) return;
              const index = analysisResult.sections.findIndex((s) => s.id === afterId);
              if (index === -1) return;
              
              // Create section based on type
              let newSection: Section;
              
              switch (type) {
                case "cta":
                  newSection = ensureSectionMetadata({
                    type: "cta",
                    content: "",
                    buttonText: "Click Here",
                    buttonUrl: "",
                  }, index + 1);
                  break;
                case "quote":
                  newSection = ensureSectionMetadata({
                    type: "quote",
                    content: "Enter your quote here...",
                    author: "Author Name",
                    authorRole: "Role or Title",
                    style: "normal",
                  }, index + 1);
                  break;
                case "facebook-testimonial":
                  newSection = ensureSectionMetadata({
                    type: "facebook-testimonial",
                    content: "Share your experience here...",
                    author: "User Name",
                    authorAvatar: "",
                    timestamp: "2 days ago",
                    reactions: 0,
                    style: "normal",
                  }, index + 1);
                  break;
                case "bullet-box":
                  newSection = ensureSectionMetadata({
                    type: "bullet-box",
                    content: "",
                    heading: "Key Points",
                    items: ["Point 1", "Point 2", "Point 3"],
                    boxColor: "blue",
                    style: "normal",
                  }, index + 1);
                  break;
                case "update":
                  newSection = ensureSectionMetadata({
                    type: "update",
                    content: "Update content here...",
                    updateDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    style: "normal",
                  }, index + 1);
                  break;
                case "list-item":
                  // Calculate the next number based on existing list-items
                  const existingListItems = analysisResult.sections.filter(s => s.type === "list-item");
                  const nextNumber = existingListItems.length > 0 
                    ? Math.max(...existingListItems.map(s => s.number || 0)) + 1 
                    : 1;
                  newSection = ensureSectionMetadata({
                    type: "list-item",
                    content: "Enter list item content...",
                    heading: "List Item Title",
                    imagePosition: "none",
                    style: "normal",
                    number: nextNumber,
                  }, index + 1);
                  break;
                case "image":
                  newSection = ensureSectionMetadata({
                    type: "image",
                    content: "",
                    imageUrl: "",
                    imagePosition: "full",
                    style: "normal",
                  }, index + 1);
                  break;
                case "headline":
                  newSection = ensureSectionMetadata({
                    type: "text",
                    content: "Enter your headline here...",
                    heading: "New Headline",
                    style: "emphasized",
                  }, index + 1);
                  break;
                case "complete-section":
                  // Create headline + image + paragraph as three sections
                  const headlineSection = ensureSectionMetadata({
                    type: "text",
                    content: "",
                    heading: "New Section Headline",
                    style: "emphasized",
                  }, index + 1);
                  const imageSection = ensureSectionMetadata({
                    type: "image",
                    content: "",
                    imageUrl: "",
                    imagePosition: "full",
                    style: "normal",
                  }, index + 2);
                  const textSection = ensureSectionMetadata({
                    type: "text",
                    content: "Enter your paragraph here...",
                    imagePosition: "none",
                    style: "normal",
                  }, index + 3);
                  
                  // Insert all three sections
                  const newSections = [...analysisResult.sections];
                  newSections.splice(index + 1, 0, headlineSection, imageSection, textSection);
                  
                  // Update order for all sections
                  const reorderedSections = newSections.map((s, i) => ({
                    ...s,
                    order: i
                  }));
                  
                  setAnalysisResult({
                    ...analysisResult,
                    sections: reorderedSections,
                  });
                  toast({ title: "Complete section added!" });
                  return; // Early return to avoid the default single-section logic below
                default: // "text"
                  newSection = ensureSectionMetadata({
                    type: "text",
                    content: "Enter your paragraph here...",
                    imagePosition: "none",
                    style: "normal",
                  }, index + 1);
              }
              
              // Recalculate order for all sections after insertion
              const newSections = [...analysisResult.sections];
              newSections.splice(index + 1, 0, newSection);
              
              // Update order for all sections
              const reorderedSections = newSections.map((s, i) => ({
                ...s,
                order: i
              }));
              
              setAnalysisResult({
                ...analysisResult,
                sections: reorderedSections,
              });
              toast({ title: "Section added!" });
            }}
          onSectionsReorder={(newSections) => {
            if (!analysisResult) return;
            setAnalysisResult({
              ...analysisResult,
              sections: newSections as any,
            });
          }}
          onSectionClone={(id) => {
            if (!analysisResult) return;
            const index = analysisResult.sections.findIndex((s) => s.id === id);
            if (index !== -1) {
              const sectionToClone = analysisResult.sections[index];
              const clonedSection = ensureSectionMetadata({ ...sectionToClone }, index + 1);
              const newSections = [...analysisResult.sections];
              newSections.splice(index + 1, 0, clonedSection);
              // Update order for all sections
              const reorderedSections = newSections.map((s, i) => ({
                ...s,
                order: i
              }));
              setAnalysisResult({
                ...analysisResult,
                sections: reorderedSections,
              });
              toast({ title: "Section cloned successfully!" });
            }
          }}
          isEditing={true}
          ctaText={analysisResult?.cta.primary || "Get Started"}
          ctaUrl={ctaUrl}
          userId={user?.id}
          onCtaTextUpdate={handleUpdateCta}
        />
      );
    }

    switch (selectedTemplate) {
      case "news":
        return <NewsTemplate {...templateProps as any} />;
      case "blog":
        return <BlogTemplate {...templateProps as any} />;
      case "magazine":
      default:
        return <MagazineTemplate {...templateProps as any} />;
    }
  };
  const handleAddSectionAt = (
    afterIndex: number, 
    type: "text" | "image" | "complete-section",
    sectionConfig?: Partial<Section>
  ) => {
    if (!analysisResult) return;
    console.log("[handleAddSectionAt] type=", type, "afterIndex=", afterIndex);
    
    // Handle complete-section separately
    if (type === "complete-section") {
      console.log("[handleAddSectionAt] inserting complete-section bundle");
      const headlineSection = ensureSectionMetadata({
        type: "text",
        content: "",
        heading: "New Section Headline",
        style: "emphasized",
      }, afterIndex + 1);
      const imageSection = ensureSectionMetadata({
        type: "image",
        content: "",
        imageUrl: "",
        imagePosition: "full",
        style: "normal",
      }, afterIndex + 2);
      const textSection = ensureSectionMetadata({
        type: "text",
        content: "Enter your paragraph here...",
        imagePosition: "none",
        style: "normal",
      }, afterIndex + 3);
      
      const newSections = [...analysisResult.sections];
      newSections.splice(afterIndex + 1, 0, headlineSection, imageSection, textSection);
      
      // Update order for all sections
      const reorderedSections = newSections.map((s, i) => ({
        ...s,
        order: i
      }));
      
      setAnalysisResult({
        ...analysisResult,
        sections: reorderedSections,
      });
      toast({ title: "Complete section added!" });
      return;
    }
    
    let baseSection: Section;
    
    if (type === "image") {
      baseSection = {
        type: "image",
        content: "",
        imageUrl: "",
        imagePosition: "full",
        style: "normal",
      };
    } else {
      baseSection = {
        type: "text",
        content: "Enter your paragraph here...",
        imagePosition: "right",
        style: "normal",
      };
    }
    
    // Merge with custom configuration if provided
    const newSection: Section = ensureSectionMetadata({
      ...baseSection,
      ...sectionConfig
    }, afterIndex + 1);
    
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
          authorAvatar: "",
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
      case "update":
        newSection = {
          type: "update",
          content: "Ever since more people have learned about this, we've seen a massive spike in interest. Due to its popularity and positive reviews, we're now offering a special **limited-time discount** with **FREE SHIPPING**. To see if it's still available, click the button below.",
          updateDate: "September 14, 2024",
          style: "normal",
        };
        break;
      case "complete-section": {
        // Append headline + image + paragraph to the end
        console.log("[handleSelectTemplate] complete-section selected");
        const startIndex = analysisResult.sections.length;
        const headlineSection = ensureSectionMetadata({
          type: "text",
          content: "",
          heading: "New Section Headline",
          style: "emphasized",
        }, startIndex);
        const imageSection = ensureSectionMetadata({
          type: "image",
          content: "",
          imageUrl: "",
          imagePosition: "full",
          style: "normal",
        }, startIndex + 1);
        const textSection = ensureSectionMetadata({
          type: "text",
          content: "Enter your paragraph here...",
          imagePosition: "none",
          style: "normal",
        }, startIndex + 2);
        setAnalysisResult({
          ...analysisResult,
          sections: [...analysisResult.sections, headlineSection, imageSection, textSection],
        });
        setShowTemplateModal(false);
        toast({ title: "Complete section added!" });
        return;
      }
      default:
        newSection = {
          type: "text",
          content: "Enter content here...",
          heading: type === "headline" ? "New Section" : undefined,
          imagePosition: "right",
          style: "normal",
        };
    }
    
    setAnalysisResult({
      ...analysisResult,
      sections: [...analysisResult.sections, ensureSectionMetadata(newSection, analysisResult.sections.length)],
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
      // Get HTML from the textarea if available
      const textarea = document.getElementById('add-more-text') as HTMLTextAreaElement;
      const pastedHtml = textarea?.dataset.pastedHtml;
      const contentToAnalyze = preserveFormatting && pastedHtml ? pastedHtml : addMoreText;
      
      const { data, error } = await supabase.functions.invoke("analyze-text", {
        body: { text: contentToAnalyze, preserveHtml: preserveFormatting }
      });
      
      if (error) throw error;
      
      if (data && data.sections) {
        // Filter out hero section from new content (we already have one)
        const newSections = data.sections.filter((s: Section) => s.type !== "hero");
        
        // Append new sections to existing ones
        setAnalysisResult({
          ...analysisResult,
          sections: [...analysisResult.sections, ...newSections.map((s: Section, i: number) => ensureSectionMetadata(s, analysisResult.sections.length + i))]
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
        sections: data.sections.map((section: Section, i: number) => ensureSectionMetadata({
          ...section,
          heading: section.heading ? stripHtmlTags(section.heading) : section.heading,
          content: stripHtmlTags(section.content),
        }, i)),
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

  if (isLoadingExistingPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  if (isEditorMode && analysisResult) {
    // Check if all required fields are filled
    const isValidForSave = pageTitle.trim() && pageSlug.trim() && selectedTags.length > 0 && selectedCountrySetupId;

    return (
      <div className="min-h-screen w-full flex flex-col bg-background">
        <Navigation user={user} />
        <SidebarProvider defaultOpen={true}>
          <div className="flex flex-1 w-full min-h-0 overflow-x-hidden">
            {/* Sidebar */}
            <Sidebar className="border-r">
              <div className="p-4 border-b flex items-center">
                <h2 className="font-semibold text-sm">Page Settings</h2>
              </div>
              
              <SidebarContent>
                {/* Page Settings */}
                <Collapsible open={pageSettingsOpen} onOpenChange={setPageSettingsOpen}>
                  <SidebarGroup>
                    <CollapsibleTrigger className="w-full">
                      <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 px-3 py-2 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>Required Settings</span>
                          {!isValidForSave && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">
                              Incomplete
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", pageSettingsOpen && "rotate-180")} />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarGroupContent className="px-3 py-2 space-y-3">
                        <div>
                          <Label htmlFor="pageTitle" className="text-xs font-medium flex items-center gap-1">
                            Page Title <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="pageTitle"
                            type="text"
                            placeholder="Enter page title"
                            value={pageTitle}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 200); // Max 200 chars
                              setPageTitle(value);
                              const currentGeneratedSlug = generateSlug(pageTitle, false);
                              if (!pageSlug || pageSlug === currentGeneratedSlug || pageSlug.startsWith(currentGeneratedSlug + "-")) {
                                setPageSlug(generateSlug(value, false));
                              }
                            }}
                            className={cn(
                              "h-8 mt-1",
                              !pageTitle.trim() && "border-destructive focus:border-destructive"
                            )}
                            required
                          />
                          {!pageTitle.trim() && (
                            <p className="text-xs text-destructive mt-1">Page title is required</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="slug" className="text-xs font-medium flex items-center gap-1">
                            URL Slug <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="slug"
                            type="text"
                            placeholder="auto-generated"
                            value={pageSlug}
                            onChange={(e) => {
                              const sanitized = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]/g, '-')
                                .replace(/^-|-$/g, '')
                                .slice(0, 100); // Max 100 chars
                              setPageSlug(sanitized);
                            }}
                            className={cn(
                              "h-8 mt-1 font-mono",
                              !pageSlug.trim() && "border-destructive focus:border-destructive"
                            )}
                            required
                          />
                          {!pageSlug.trim() && (
                            <p className="text-xs text-destructive mt-1">URL slug is required</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="tags" className="text-xs font-medium flex items-center gap-1">
                            Tags <span className="text-destructive">*</span>
                          </Label>
                          <div className={cn(
                            "flex items-center gap-2 flex-wrap min-h-[32px] p-2 mt-1 rounded-md border bg-background/50",
                            selectedTags.length === 0 && "border-destructive"
                          )}>
                            {selectedTags.map(tagId => {
                              const tag = availableTags.find(t => t.id === tagId);
                              return tag ? (
                                <Badge 
                                  key={tagId}
                                  style={{backgroundColor: tag.color, color: 'white'}}
                                  className="cursor-pointer text-xs px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
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
                              <SelectTrigger className="h-6 w-[100px] text-xs border-dashed">
                                <SelectValue placeholder="Add..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="create-new" className="text-xs font-semibold text-primary">
                                  <Plus className="inline h-3 w-3 mr-1" />
                                  Create new
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
                          {selectedTags.length === 0 && (
                            <p className="text-xs text-destructive mt-1">At least one tag is required</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="countrySetup" className="text-xs font-medium flex items-center gap-1">
                            Tracking Setup <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={selectedCountrySetupId || ""}
                            onValueChange={setSelectedCountrySetupId}
                          >
                            <SelectTrigger id="countrySetup" className={cn(
                              "h-8 mt-1",
                              !selectedCountrySetupId && "border-destructive focus:border-destructive"
                            )}>
                              <SelectValue placeholder="Select setup" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCountrySetups.length === 0 ? (
                                <div className="p-3 text-xs text-muted-foreground">
                                  No setups. <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/settings")}>Create one</Button>
                                </div>
                              ) : (
                                availableCountrySetups.map(setup => {
                                  const scriptCount = [
                                    setup.google_analytics_id,
                                    setup.facebook_pixel_id,
                                    setup.triplewhale_token,
                                    setup.microsoft_clarity_id
                                  ].filter(Boolean).length;
                                  
                                  return (
                                    <SelectItem key={setup.id} value={setup.id} className="text-xs">
                                      <div className="flex items-center justify-between w-full gap-2">
                                        <span>{setup.name}</span>
                                        {scriptCount > 0 && (
                                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                            {scriptCount}
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                          {!selectedCountrySetupId && (
                            <p className="text-xs text-destructive mt-1">Tracking setup is required</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="ctaUrl" className="text-xs font-medium">CTA URL</Label>
                          <Input
                            id="ctaUrl"
                            type="url"
                            placeholder="https://example.com"
                            value={ctaUrl}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 500); // Max 500 chars
                              setCTAUrl(value);
                            }}
                            className="h-8 mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Where users go when clicking CTA buttons
                          </p>
                        </div>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>

                {/* Remove the separate CTA Configuration section */}

                {/* Design Options */}
                <Collapsible open={designOptionsOpen} onOpenChange={setDesignOptionsOpen}>
                  <SidebarGroup>
                    <CollapsibleTrigger className="w-full">
                      <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 px-3 py-2 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          <span>Design Options</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", designOptionsOpen && "rotate-180")} />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarGroupContent className="px-3 py-2 space-y-3">
                        <div>
                          <Label htmlFor="templateSelect" className="text-xs font-medium">Template</Label>
                          <Select value={selectedTemplate} onValueChange={setSelectedTemplate as any}>
                            <SelectTrigger id="templateSelect" className="h-8 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="magazine">Magazine</SelectItem>
                              <SelectItem value="news">News</SelectItem>
                              <SelectItem value="blog">Blog</SelectItem>
                              <SelectItem value="listicle">Listicle</SelectItem>
                              <SelectItem value="story-advertorial">Story Advertorial</SelectItem>
                              <SelectItem value="personal-story">Personal Story</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="ctaStyleSelect" className="text-xs font-medium">CTA Style</Label>
                          <Select value={ctaStyle} onValueChange={setCtaStyle as any}>
                            <SelectTrigger id="ctaStyleSelect" className="h-8 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ctaAmazon">Amazon</SelectItem>
                              <SelectItem value="ctaUrgent">Urgent</SelectItem>
                              <SelectItem value="ctaPremium">Premium</SelectItem>
                              <SelectItem value="ctaTrust">Trust</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs font-medium">Sticky CTA ({stickyCtaThreshold}%)</Label>
                          <div className="pt-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={stickyCtaThreshold}
                              onChange={(e) => setStickyCtaThreshold(Number(e.target.value))}
                              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                        </div>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>

                {/* Snippets Section */}
                <Collapsible open={snippetsOpen} onOpenChange={setSnippetsOpen}>
                  <SidebarGroup>
                    <CollapsibleTrigger className="w-full">
                      <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 px-3 py-2 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                          <BookMarked className="h-4 w-4" />
                          <span>Snippets</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", snippetsOpen && "rotate-180")} />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SnippetsSection
                        sections={analysisResult?.sections || []}
                        currentPageTags={availableTags.filter(t => selectedTags.includes(t.id))}
                        onLoadSnippet={(snippetSections) => {
                          if (!analysisResult) return;
                          const sectionsWithIds = snippetSections.map((s, i) => 
                            ensureSectionMetadata(s, analysisResult.sections.length + i)
                          );
                          setAnalysisResult({
                            ...analysisResult,
                            sections: [...analysisResult.sections, ...sectionsWithIds],
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              </SidebarContent>
            </Sidebar>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className={cn(
                "border-b bg-background sticky top-0 z-50 transition-transform duration-300 ease-in-out",
                !isHeaderVisible && "-translate-y-full"
              )}>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <SidebarTrigger className="h-8 px-3" />
                      
                      {!isValidForSave && (
                        <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="hidden sm:inline">Incomplete</span>
                        </Badge>
                      )}
                      
                      {selectedCountrySetupId && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Globe className="h-3 w-3" />
                          <span className="hidden sm:inline">{availableCountrySetups.find(s => s.id === selectedCountrySetupId)?.name || 'Unknown'}</span>
                        </Badge>
                      )}
                    </div>
                
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSave("draft")}
                        disabled={saving || !isValidForSave}
                        className="gap-2 h-8"
                        title={!isValidForSave ? "Please fill all required fields" : "Save draft"}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden md:inline">Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span className="hidden md:inline">Save</span>
                          </>
                        )}
                      </Button>

                      {undoStack && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUndo}
                          className="gap-2 h-8"
                        >
                          <Undo2 className="h-4 w-4" />
                          <span className="hidden md:inline">Undo</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleSave("published")}
                        disabled={saving || !isValidForSave}
                        className="gap-2 h-8"
                        title={!isValidForSave ? "Please fill all required fields" : "Publish page"}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden md:inline">Publishing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span className="hidden md:inline">Publish</span>
                          </>
                        )}
                      </Button>
                  {isPublished && pageSlug && (
                    <Button
                      onClick={() => window.open(`/p/${pageSlug}`, "_blank")}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      View Live
                    </Button>
                  )}
                  
                  {/* Autosave indicator */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                    {hasUnsavedChanges && (
                      <Badge variant="outline" className="h-6 text-xs">
                        Unsaved changes
                      </Badge>
                    )}
                    {lastSavedTime && !hasUnsavedChanges && (
                      <span className="text-xs">
                        Saved {new Date(lastSavedTime).toLocaleTimeString()}
                      </span>
                    )}
                    {autosaveEnabled && (
                      <Badge variant="secondary" className="h-6 text-xs">
                        Autosave ON
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Area - Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="container mx-auto px-4 pb-24" style={{
                  maxWidth: previewMode === "mobile" ? "425px" : "100%",
                  transition: "max-width 0.3s ease"
                }}>
                  {renderTemplate()}
                </div>
                
                {/* Multi-Select Toolbar */}
                {multiSelectMode && (
                  <MultiSelectToolbar
                    selectedCount={selectedSections.length}
                    onSaveToSnippet={() => {
                      if (selectedSections.length > 0) {
                        setShowMultiSnippetDialog(true);
                      }
                    }}
                    onCancel={() => {
                      setMultiSelectMode(false);
                      setSelectedSections([]);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
            </div>
          </div>
        </SidebarProvider>

        {/* Multi-Section Snippet Dialog */}
        {analysisResult && (
          <MultiSectionSnippetDialog
            open={showMultiSnippetDialog}
            onOpenChange={(open) => {
              setShowMultiSnippetDialog(open);
              if (!open) {
                setMultiSelectMode(false);
                setSelectedSections([]);
              }
            }}
            sections={selectedSections.map(idx => analysisResult.sections[idx]).filter(Boolean)}
            userId={user?.id || ""}
          />
        )}

        {/* Dialogs and Modals */}
        {showHtmlEditor && (
          <HtmlEditor
            sections={analysisResult.sections}
            onSave={(newSections) => {
              setAnalysisResult({
                ...analysisResult,
                sections: newSections as any,
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
                  section={analysisResult.sections[editingSectionIndex] as any}
                  index={editingSectionIndex}
                  totalSections={analysisResult.sections.length}
                  onSave={(updatedSection) => handleSaveSection(editingSectionIndex, updatedSection as any)}
                  onDelete={() => handleDeleteSection(editingSectionIndex)}
                  onMoveUp={() => handleMoveSection(editingSectionIndex, "up")}
                  onMoveDown={() => handleMoveSection(editingSectionIndex, "down")}
                  onCancel={() => setEditingSectionIndex(null)}
                  userId={user?.id || ""}
                />
              </div>
            )}
          </SheetContent>
        </Sheet>

        <StickyCtaButton 
          text={analysisResult.cta.primary} 
          onClick={() => ctaUrl && window.open(ctaUrl, "_blank")} 
          isEditing={true}
        />

        {/* Parse & Add More Text Dialog */}
        <Dialog open={showAddMoreDialog} onOpenChange={setShowAddMoreDialog}>
          <DialogContent className="bg-background max-w-2xl">
            <DialogHeader>
              <DialogTitle>Parse & Add More Text</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="add-more-text">
                    Paste additional text to add to your page
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="preserve-formatting-more"
                      checked={preserveFormatting}
                      onCheckedChange={setPreserveFormatting}
                    />
                    <Label htmlFor="preserve-formatting-more" className="text-sm font-normal cursor-pointer">
                      Preserve Formatting
                    </Label>
                  </div>
                </div>
                <Textarea
                  id="add-more-text"
                  placeholder="Paste your additional content here... The AI will structure it and add it to the end of your page."
                  value={addMoreText}
                  onChange={(e) => setAddMoreText(e.target.value)}
                  onPaste={(e) => {
                    // Capture HTML when pasting if preserve formatting is on
                    if (preserveFormatting) {
                      const html = e.clipboardData.getData('text/html');
                      if (html) {
                        // Store for later use in handleAddMoreText
                        e.currentTarget.dataset.pastedHtml = html;
                        console.log('Captured HTML from paste:', html.substring(0, 200));
                      }
                    }
                  }}
                  className="min-h-[300px] font-mono text-sm"
                  disabled={isAddingMore}
                />
                <p className="text-xs text-muted-foreground">
                  {preserveFormatting 
                    ? "💡 HTML formatting will be preserved. Tip: For long texts (5,000+ words), paste in chunks of ~3,000 words."
                    : "Tip: For best results with long texts (5,000+ words), paste in chunks of ~3,000 words at a time."}
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
            {/* Quick Start Templates */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-center">Quick Start</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartFromTemplate("magazine")}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-2xl">📰</span>
                  <span className="text-xs">Magazine</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartFromTemplate("news")}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-2xl">📱</span>
                  <span className="text-xs">News</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartFromTemplate("blog")}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-2xl">✍️</span>
                  <span className="text-xs">Blog</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartFromTemplate("listicle")}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-2xl">📋</span>
                  <span className="text-xs">Listicle</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartFromTemplate("story-advertorial")}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-2xl">📖</span>
                  <span className="text-xs">Story Ad</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartFromTemplate("personal-story")}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-2xl">👤</span>
                  <span className="text-xs">Personal Story Blog</span>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or paste your content</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-medium">
                  Your Content
                </label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="preserve-formatting"
                    checked={preserveFormatting}
                    onCheckedChange={setPreserveFormatting}
                  />
                  <Label htmlFor="preserve-formatting" className="text-sm font-normal cursor-pointer">
                    Preserve Formatting
                  </Label>
                </div>
              </div>
              <Textarea
                id="content"
                placeholder="Paste your advertorial or presell content here... The AI will analyze it and create an optimized layout with headlines, sections, and CTAs."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={(e) => {
                  // Capture HTML when pasting if preserve formatting is on
                  if (preserveFormatting) {
                    const html = e.clipboardData.getData('text/html');
                    if (html) {
                      setInputHtml(html);
                      console.log('Captured HTML from paste:', html.substring(0, 200));
                    }
                  }
                }}
                className="min-h-[300px] resize-y"
              />
              {preserveFormatting && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 HTML formatting (headlines, bold, italic) will be preserved when splitting into sections
                </p>
              )}
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