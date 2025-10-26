import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PresellSection } from "@/components/PresellSection";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to analyze");
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
      toast.success("Text analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze text");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCtaClick = () => {
    toast.success("CTA clicked! This would redirect to your offer page.");
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setInputText("");
  };

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <Button variant="outline" onClick={handleReset}>
            Create New Page
          </Button>
        </div>

        {analysisResult.sections.map((section, index) => (
          <PresellSection
            key={index}
            section={section}
            ctaText={analysisResult.cta.primary}
            onCtaClick={handleCtaClick}
          />
        ))}

        <StickyCtaButton text={analysisResult.cta.primary} onClick={handleCtaClick} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Presell Page Generator
          </h1>
          <p className="text-xl text-muted-foreground">
            Paste your text and let AI create a high-converting presell page
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-[var(--shadow-strong)] p-8 space-y-6">
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

          <div className="pt-4 border-t border-border">
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
  );
};

export default Index;
