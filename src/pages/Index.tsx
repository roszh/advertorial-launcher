import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PresellSection } from "@/components/PresellSection";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Globe, Edit2 } from "lucide-react";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
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
  const [ctaUrl, setCTAUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

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
      setCTAUrl(data.cta_url || "");
      setAnalysisResult({
        layout: "default",
        sections: content.sections,
        cta: { primary: data.cta_text || "Get Started" }
      });
      setIsEditorMode(true);
    }
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
      setAnalysisResult(data);
      setIsEditorMode(true);
      toast({ title: "Text analyzed successfully!" });
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
      const slug = generateSlug(pageTitle);
      const pageData = {
        user_id: user.id,
        title: pageTitle,
        slug: slug,
        status: status,
        content: { sections: analysisResult?.sections || [] } as any,
        cta_text: analysisResult?.cta.primary || "Get Started",
        cta_url: ctaUrl,
        published_at: status === "published" ? new Date().toISOString() : null
      };

      if (editId) {
        const { error } = await supabase
          .from("pages")
          .update(pageData)
          .eq("id", editId);

        if (error) throw error;
        toast({ title: `Page ${status === "published" ? "published" : "saved"}!` });
      } else {
        const { error } = await supabase.from("pages").insert([pageData]);
        if (error) throw error;
        toast({ title: `Page ${status === "published" ? "published" : "saved"}!` });
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Error saving page", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setInputText("");
    setIsEditorMode(false);
    setPageTitle("");
    setCTAUrl("");
    navigate("/");
  };

  if (isEditorMode && analysisResult) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        
        <div className="border-b bg-background/95 backdrop-blur">
          <div className="container py-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Page Title</label>
                  <Input
                    placeholder="Enter page title..."
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">CTA URL</label>
                  <Input
                    placeholder="https://your-offer.com"
                    value={ctaUrl}
                    onChange={(e) => setCTAUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => handleSave("draft")} disabled={saving} variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button onClick={() => handleSave("published")} disabled={saving}>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish
                </Button>
                <Button onClick={handleReset} variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {analysisResult.sections.map((section, index) => (
          <PresellSection
            key={index}
            section={section}
            ctaText={analysisResult.cta.primary}
            onCtaClick={() => ctaUrl && window.open(ctaUrl, "_blank")}
          />
        ))}

        <StickyCtaButton 
          text={analysisResult.cta.primary} 
          onClick={() => ctaUrl && window.open(ctaUrl, "_blank")} 
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