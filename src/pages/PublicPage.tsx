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
  headline?: string;
  subtitle?: string;
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
  const [trackingScripts, setTrackingScripts] = useState<{
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    triplewhaleToken?: string;
    microsoftClarityId?: string;
  }>({});

  useEffect(() => {
    const fetchPage = async () => {
      // Fetch page content (fast - no JOIN)
      const { data, error } = await supabase
        .from("published_pages")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        console.error("Page not found");
        setPageData(null);
      } else {
        const template = (data.template as "magazine" | "news" | "blog") || "magazine";
        
        // Set page data immediately for instant rendering
        setPageData({
          id: data.id || undefined,
          title: data.title,
          headline: data.headline,
          subtitle: data.subtitle || (template === "news" ? "Breaking News" : template === "blog" ? "Expert Insights" : "Featured Story"),
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

        // Fetch tracking scripts in parallel (non-blocking)
        if (data.user_id) {
          supabase
            .from("profiles")
            .select("google_analytics_id, facebook_pixel_id, triplewhale_token, microsoft_clarity_id")
            .eq("id", data.user_id)
            .single()
            .then(({ data: profileData }) => {
              if (profileData) {
                setTrackingScripts({
                  googleAnalyticsId: profileData.google_analytics_id || undefined,
                  facebookPixelId: profileData.facebook_pixel_id || undefined,
                  triplewhaleToken: profileData.triplewhale_token || undefined,
                  microsoftClarityId: profileData.microsoft_clarity_id || undefined,
                });
              }
            });
        }
      }
    };

    fetchPage();
  }, [slug]);

  // Track page view (non-blocking - happens in background after render)
  useEffect(() => {
    if (!pageData?.id) return;
    
    // Fire and forget - track asynchronously without blocking
    (async () => {
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
    })();
  }, [pageData?.id]);

  // Inject tracking scripts
  useEffect(() => {
    // Google Analytics
    if (trackingScripts.googleAnalyticsId) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${trackingScripts.googleAnalyticsId}`;
      document.head.appendChild(gaScript);

      const gaConfigScript = document.createElement('script');
      gaConfigScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${trackingScripts.googleAnalyticsId}');
      `;
      document.head.appendChild(gaConfigScript);
    }

    // Facebook Pixel
    if (trackingScripts.facebookPixelId) {
      const fbScript = document.createElement('script');
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${trackingScripts.facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      const fbNoScript = document.createElement('noscript');
      fbNoScript.innerHTML = `<img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${trackingScripts.facebookPixelId}&ev=PageView&noscript=1"/>`;
      document.body.appendChild(fbNoScript);
    }

    // Triple Whale - inject raw HTML snippet
    if (trackingScripts.triplewhaleToken) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = trackingScripts.triplewhaleToken.trim();
      
      // Insert all elements from the snippet into head
      Array.from(tempDiv.children).forEach(element => {
        document.head.appendChild(element.cloneNode(true));
      });
    }

    // Microsoft Clarity
    if (trackingScripts.microsoftClarityId) {
      const clarityScript = document.createElement('script');
      clarityScript.type = 'text/javascript';
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${trackingScripts.microsoftClarityId}");
      `;
      document.head.appendChild(clarityScript);
    }
  }, [trackingScripts]);

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

  const handleCtaClick = async (elementId: string = "untracked") => {
    if (!pageData?.cta_url || !pageData?.id) return;
    
    // Track the click with element_id
    try {
      await supabase.from("page_analytics").insert({
        page_id: pageData.id,
        event_type: "click",
        element_id: elementId,
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
    headline: pageData.headline,
    subtitle: pageData.subtitle,
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
        onClick={() => handleCtaClick("sticky_button")} 
        variant={(pageData.cta_style as any) || "ctaAmazon"}
        scrollThreshold={pageData.sticky_cta_threshold || 20}
      />
    </div>
  );
}