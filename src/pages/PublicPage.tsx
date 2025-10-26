import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PresellSection } from "@/components/PresellSection";
import { StickyCtaButton } from "@/components/StickyCtaButton";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "testimonial" | "benefits";
  heading?: string;
  content: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
}

interface PageData {
  title: string;
  content: {
    sections: Section[];
  };
  cta_text: string;
  cta_url: string;
}

export default function PublicPage() {
  const { slug } = useParams();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !data) {
        console.error("Page not found");
      } else {
        setPageData({
          title: data.title,
          content: data.content as any,
          cta_text: data.cta_text || "",
          cta_url: data.cta_url || ""
        });
      }
      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">This page doesn't exist or hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {pageData.content.sections.map((section, index) => (
        <PresellSection
          key={index}
          section={section}
          ctaText={pageData.cta_text}
          onCtaClick={() => window.location.href = pageData.cta_url}
        />
      ))}
      <StickyCtaButton
        text={pageData.cta_text}
        onClick={() => window.location.href = pageData.cta_url}
      />
    </div>
  );
}