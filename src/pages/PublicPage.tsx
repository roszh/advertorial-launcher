import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MagazineTemplate } from "@/components/templates/MagazineTemplate";
import { NewsTemplate } from "@/components/templates/NewsTemplate";
import { BlogTemplate } from "@/components/templates/BlogTemplate";
import { ListicleTemplate } from "@/components/templates/ListicleTemplate";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { PublicPageSkeleton } from "@/components/PublicPageSkeleton";

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
  template: "magazine" | "news" | "blog" | "listicle";
}

export default function PublicPage() {
  const { slug } = useParams();

  // Use React Query for automatic caching and background refetching
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['published-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("published_pages")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        throw new Error("Page not found");
      }

      const template = (data.template as "magazine" | "news" | "blog" | "listicle") || "magazine";
      
      return {
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
        user_id: data.user_id,
        // Tracking scripts from Country Setup
        trackingScripts: {
          googleAnalyticsId: data.google_analytics_id || undefined,
          facebookPixelId: data.facebook_pixel_id || undefined,
          triplewhaleToken: data.triplewhale_token || undefined,
          microsoftClarityId: data.microsoft_clarity_id || undefined,
        },
        countrySetupName: data.tracking_script_set_name || undefined,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set page title when data loads
  useEffect(() => {
    if (pageData?.title) {
      document.title = pageData.title;
    }
  }, [pageData?.title]);

  // Log Country Setup being used for debugging
  useEffect(() => {
    if (pageData?.countrySetupName) {
      console.log(`[Tracking] Using Country Setup: ${pageData.countrySetupName}`);
    }
  }, [pageData?.countrySetupName]);

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

  // Inject tracking scripts from Country Setup lazily when browser is idle
  useEffect(() => {
    const scripts = pageData?.trackingScripts;
    if (!scripts || !Object.values(scripts).some(v => v)) {
      console.log('[Tracking] No tracking scripts configured for this page');
      return;
    }
    
    console.log('[Tracking] Initializing tracking scripts:', {
      googleAnalytics: !!scripts.googleAnalyticsId,
      facebookPixel: !!scripts.facebookPixelId,
      tripleWhale: !!scripts.triplewhaleToken,
      microsoftClarity: !!scripts.microsoftClarityId,
    });
    
    const injectScripts = () => {
      try {
        // Google Analytics
        if (scripts.googleAnalyticsId) {
          console.log('[Tracking] Injecting Google Analytics:', scripts.googleAnalyticsId);
          
          // Check if already loaded
          if (!(window as any).gtag) {
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${scripts.googleAnalyticsId}`;
            gaScript.onload = () => console.log('[Tracking] ✓ Google Analytics loaded');
            gaScript.onerror = () => console.error('[Tracking] ✗ Google Analytics failed to load');
            document.head.appendChild(gaScript);

            const gaConfigScript = document.createElement('script');
            gaConfigScript.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${scripts.googleAnalyticsId}');
              console.log('[Tracking] Google Analytics configured');
            `;
            document.head.appendChild(gaConfigScript);
          } else {
            console.log('[Tracking] Google Analytics already loaded');
          }
        }

        // Facebook Pixel
        if (scripts.facebookPixelId) {
          console.log('[Tracking] Injecting Facebook Pixel:', scripts.facebookPixelId);
          
          // Check if already loaded
          if (!(window as any).fbq) {
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
              fbq('init', '${scripts.facebookPixelId}');
              fbq('track', 'PageView');
              console.log('[Tracking] ✓ Facebook Pixel initialized');
            `;
            document.head.appendChild(fbScript);

            const fbNoScript = document.createElement('noscript');
            fbNoScript.innerHTML = `<img height="1" width="1" style="display:none"
              src="https://www.facebook.com/tr?id=${scripts.facebookPixelId}&ev=PageView&noscript=1"/>`;
            document.body.appendChild(fbNoScript);
          } else {
            console.log('[Tracking] Facebook Pixel already loaded');
          }
        }

        // Triple Whale - inject raw HTML snippet
        if (scripts.triplewhaleToken) {
          console.log('[Tracking] Injecting Triple Whale snippet');
          
          try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = scripts.triplewhaleToken.trim();
            
            // Insert all elements from the snippet into head
            let insertedCount = 0;
            Array.from(tempDiv.children).forEach(element => {
              document.head.appendChild(element.cloneNode(true));
              insertedCount++;
            });
            console.log(`[Tracking] ✓ Triple Whale injected (${insertedCount} elements)`);
          } catch (error) {
            console.error('[Tracking] ✗ Triple Whale failed to inject:', error);
          }
        }

        // Microsoft Clarity
        if (scripts.microsoftClarityId) {
          console.log('[Tracking] Injecting Microsoft Clarity:', scripts.microsoftClarityId);
          
          // Check if already loaded
          if (!(window as any).clarity) {
            const clarityScript = document.createElement('script');
            clarityScript.type = 'text/javascript';
            clarityScript.innerHTML = `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${scripts.microsoftClarityId}");
              console.log('[Tracking] ✓ Microsoft Clarity initialized');
            `;
            document.head.appendChild(clarityScript);
          } else {
            console.log('[Tracking] Microsoft Clarity already loaded');
          }
        }

        console.log('[Tracking] All configured scripts injected successfully');
      } catch (error) {
        console.error('[Tracking] Error injecting scripts:', error);
      }
    };
    
    // Use requestIdleCallback with fallback for Safari
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(injectScripts, { timeout: 2000 });
    } else {
      setTimeout(injectScripts, 2000);
    }
  }, [pageData?.trackingScripts]);

  // Show skeleton while loading
  if (isLoading) {
    return <PublicPageSkeleton />;
  }

  // Show error state
  if (error || !pageData) {
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
    window.location.href = normalizedUrl;
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
      case "listicle":
        return (
          <ListicleTemplate
            sections={pageData.content.sections}
            onSectionUpdate={() => {}}
            onSectionDelete={() => {}}
            onSectionAdd={() => {}}
            onSectionsReorder={() => {}}
            isEditing={false}
            ctaText={pageData.cta_text || "Learn More"}
            ctaUrl={pageData.cta_url || ""}
          />
        );
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