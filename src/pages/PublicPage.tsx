import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MagazineTemplate } from "@/components/templates/MagazineTemplate";
import { NewsTemplate } from "@/components/templates/NewsTemplate";
import { BlogTemplate } from "@/components/templates/BlogTemplate";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { Loader2 } from "lucide-react";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "testimonial" | "benefits";
  heading?: string;
  content: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
}

interface PageData {
  id?: string;
  title: string;
  content: {
    sections: Section[];
  };
  cta_text: string;
  cta_url: string;
  cta_style?: string;
  sticky_cta_threshold?: number;
  image_url?: string;
  template: "magazine" | "news" | "blog";
}

export default function PublicPage() {
  const { slug } = useParams();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data, error } = await supabase
        .from("published_pages")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        console.error("Page not found");
      } else {
        const template = (data.template as "magazine" | "news" | "blog") || "magazine";
        setPageData({
          id: data.id || undefined,
          title: data.title,
          content: data.content as any,
          cta_text: data.cta_text || "",
          cta_url: data.cta_url || "",
          cta_style: data.cta_style || "ctaAmazon",
          sticky_cta_threshold: data.sticky_cta_threshold || 20,
          image_url: data.image_url || "",
          template,
        });
        
        // Set page title
        document.title = data.title;
      }
      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  // Track page view
  useEffect(() => {
    const trackView = async () => {
      if (!pageData?.id) return;
      
      try {
        await supabase.from("page_analytics").insert({
          page_id: pageData.id,
          event_type: "view",
          user_agent: navigator.userAgent,
          referrer: document.referrer || null
        });
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    trackView();
  }, [pageData?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  const normalizeUrl = (url: string): string => {
    if (!url) return url;
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  const handleCtaClick = async () => {
    if (!pageData?.cta_url || !pageData?.id) return;
    
    // Track the click
    try {
      await supabase.from("page_analytics").insert({
        page_id: pageData.id,
        event_type: "click",
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
    
    const normalizedUrl = normalizeUrl(pageData.cta_url);
    window.open(normalizedUrl, "_blank");
  };

  const templateProps = {
    sections: pageData.content.sections,
    ctaText: pageData.cta_text,
    onCtaClick: handleCtaClick,
    ctaVariant: (pageData.cta_style as any) || "ctaAmazon",
    imageUrl: pageData.image_url,
  };

  const renderTemplate = () => {
    switch (pageData.template) {
      case "news":
        return <NewsTemplate {...templateProps} />;
      case "blog":
        return <BlogTemplate {...templateProps} />;
      case "magazine":
      default:
        return <MagazineTemplate {...templateProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderTemplate()}
      <StickyCtaButton 
        text={pageData.cta_text} 
        onClick={handleCtaClick} 
        variant={(pageData.cta_style as any) || "ctaAmazon"}
        scrollThreshold={pageData.sticky_cta_threshold || 20}
      />
    </div>
  );
}