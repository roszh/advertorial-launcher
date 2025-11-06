import { useEffect, useState, Suspense, lazy } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StickyCtaButton } from "@/components/StickyCtaButton";
import { HeroSkeleton } from "@/components/HeroSkeleton";
import { LazySection } from "@/components/LazySection";

// Code-split template imports for better performance
const MagazineTemplate = lazy(() => import("@/components/templates/MagazineTemplate").then(m => ({ default: m.MagazineTemplate })));
const NewsTemplate = lazy(() => import("@/components/templates/NewsTemplate").then(m => ({ default: m.NewsTemplate })));
const BlogTemplate = lazy(() => import("@/components/templates/BlogTemplate").then(m => ({ default: m.BlogTemplate })));
const ListicleTemplate = lazy(() => import("@/components/templates/ListicleTemplate").then(m => ({ default: m.ListicleTemplate })));

interface Section {
  id?: string;
  type: "hero" | "text" | "image" | "cta" | "testimonial" | "benefits" | "list-item" | "final-cta";
  heading?: string;
  content: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  order?: number;
  number?: number;
  [key: string]: any;
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

  // Normalize section to ensure required fields exist (for backwards compatibility)
  const normalizeSection = (section: any, index: number): Section => ({
    ...section,
    id: section.id || crypto.randomUUID(),
    order: section.order !== undefined ? section.order : index,
    number: section.type === "list-item" 
      ? (section.number !== undefined ? section.number : index) 
      : undefined,
    content: section.content || "",
    heading: section.heading || "",
  });

  // Separate queries for hero and full page data for progressive loading
  const [heroLoaded, setHeroLoaded] = useState(false);

  // First, fetch minimal data for hero section
  const { data: heroData } = useQuery({
    queryKey: ['published-page-hero', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("published_pages")
        .select("id, title, headline, subtitle, image_url, template")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) throw new Error("Page not found");
      setHeroLoaded(true);
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Then fetch full page data (including body sections)
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['published-page', slug],
    queryFn: async () => {
      // Single optimized query - fetch page data with tracking scripts
      const { data: fullPageData, error: pageError } = await supabase
        .from("pages")
        .select(`
          *,
          tracking_script_sets (
            google_analytics_id,
            facebook_pixel_id,
            triplewhale_token,
            microsoft_clarity_id,
            name
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (pageError || !fullPageData) {
        throw new Error("Page not found");
      }

      const template = (fullPageData.template as "magazine" | "news" | "blog" | "listicle") || "magazine";
      const trackingScripts = fullPageData?.tracking_script_sets;
      
      // Normalize sections for backwards compatibility
      const normalizedSections = ((fullPageData.content as any)?.sections || []).map(normalizeSection);

      return {
        id: fullPageData.id || undefined,
        title: fullPageData.title,
        headline: fullPageData.headline,
        subtitle: fullPageData.subtitle || (template === "news" ? "Breaking News" : template === "blog" ? "Expert Insights" : "Featured Story"),
        content: { sections: normalizedSections },
        cta_text: fullPageData.cta_text || "",
        cta_url: fullPageData.cta_url || "",
        cta_style: fullPageData.cta_style || "ctaAmazon",
        sticky_cta_threshold: fullPageData.sticky_cta_threshold || 20,
        image_url: fullPageData.image_url || "",
        template,
        user_id: fullPageData.user_id,
        // Tracking scripts from Country Setup
        trackingScripts: {
          googleAnalyticsId: trackingScripts?.google_analytics_id || undefined,
          facebookPixelId: trackingScripts?.facebook_pixel_id || undefined,
          triplewhaleToken: trackingScripts?.triplewhale_token || undefined,
          microsoftClarityId: trackingScripts?.microsoft_clarity_id || undefined,
        },
        countrySetupName: trackingScripts?.name || undefined,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set page title and SEO meta tags when data loads
  useEffect(() => {
    if (!pageData) return;

    // Set page title
    document.title = pageData.title;

    // Extract description from first text section or use headline
    const firstTextSection = pageData.content.sections.find(s => s.type === 'text' || s.type === 'hero');
    const description = firstTextSection?.content 
      ? firstTextSection.content.replace(/<[^>]*>/g, '').substring(0, 160) 
      : pageData.headline || pageData.title;

    // Helper to set or update meta tag
    const setMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const [key, value] = selector.match(/\[([^=]+)="([^"]+)"\]/)?.slice(1, 3) || [];
        if (key && value) {
          element.setAttribute(key, value);
          document.head.appendChild(element);
        }
      }
      element.setAttribute(attribute, content);
    };

    // Set standard meta description
    setMetaTag('meta[name="description"]', 'content', description);

    // Set Open Graph tags
    setMetaTag('meta[property="og:title"]', 'content', pageData.title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    if (pageData.image_url) {
      setMetaTag('meta[property="og:image"]', 'content', pageData.image_url);
    }
    setMetaTag('meta[property="og:type"]', 'content', 'article');

    // Set Twitter Card tags
    setMetaTag('meta[name="twitter:title"]', 'content', pageData.title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    if (pageData.image_url) {
      setMetaTag('meta[name="twitter:image"]', 'content', pageData.image_url);
    }
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      document.title = "G&R Advertorial Launcher";
    };
  }, [pageData]);

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
        // Google Analytics with retry
        if (scripts.googleAnalyticsId) {
          console.log('[Tracking] Injecting Google Analytics:', scripts.googleAnalyticsId);
          
          if (!(window as any).gtag) {
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${scripts.googleAnalyticsId}`;
            
            gaScript.onerror = () => {
              console.error('[Tracking] ✗ Google Analytics failed, retrying...');
              setTimeout(() => {
                const retryScript = document.createElement('script');
                retryScript.async = true;
                retryScript.src = gaScript.src;
                retryScript.onload = () => console.log('[Tracking] ✓ Google Analytics loaded (retry)');
                document.head.appendChild(retryScript);
              }, 1000);
            };
            
            gaScript.onload = () => console.log('[Tracking] ✓ Google Analytics loaded');
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

        // Facebook Pixel with retry
        if (scripts.facebookPixelId) {
          console.log('[Tracking] Injecting Facebook Pixel:', scripts.facebookPixelId);
          
          if (!(window as any).fbq) {
            const fbScript = document.createElement('script');
            fbScript.innerHTML = `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;t.onerror=function(){console.error('[Tracking] ✗ Facebook Pixel failed');};
              t.onload=function(){console.log('[Tracking] ✓ Facebook Pixel loaded');};
              s=b.getElementsByTagName(e)[0];
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

        // Triple Whale
        if (scripts.triplewhaleToken) {
          console.log('[Tracking] Injecting Triple Whale snippet');
          
          try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = scripts.triplewhaleToken.trim();
            
            let insertedCount = 0;
            Array.from(tempDiv.children).forEach(element => {
              if (element.tagName === 'SCRIPT') {
                // Script elements must be recreated to execute
                const newScript = document.createElement('script');
                newScript.type = 'text/javascript';
                
                // Copy all attributes
                Array.from(element.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                
                // Copy script content
                newScript.textContent = element.textContent;
                
                // Add error/load handlers
                newScript.onerror = () => console.error('[Tracking] ✗ Triple Whale script failed to load');
                newScript.onload = () => console.log('[Tracking] ✓ Triple Whale script executed');
                
                document.head.appendChild(newScript);
                console.log('[Tracking] Triple Whale script element created and appended');
              } else {
                // Link tags and other elements can be cloned normally
                document.head.appendChild(element.cloneNode(true));
              }
              insertedCount++;
            });
            console.log(`[Tracking] ✓ Triple Whale injected (${insertedCount} elements)`);
            
            // Prepare basic context for SPAs if not provided
            (function ensureTWContext(){
              try {
                const w = window as any;
                w.TriplePixelData = w.TriplePixelData || {};
                if (!w.TriplePixelData.plat) w.TriplePixelData.plat = 'CUSTOM';
                w.TriplePixelData.isHeadless = true;
              } catch (e) {
                console.warn('[Tracking] ⚠ Could not set TriplePixelData context', e);
              }
            })();

            // Fire a page view for SPAs once the pixel is ready, with retries
            const fireTWPageLoad = (attempt = 1) => {
              const w = window as any;
              if (typeof w.TriplePixel === 'function') {
                if (!w.__twPageLoadFired) {
                  try {
                    w.TriplePixel('pageLoad');
                    w.__twPageLoadFired = true;
                    console.log('[Tracking] ✓ Triple Whale pageLoad event fired');
                  } catch (err) {
                    console.error('[Tracking] ✗ Error firing Triple Whale pageLoad:', err);
                  }
                }
                return;
              }
              if (attempt < 5) {
                setTimeout(() => fireTWPageLoad(attempt + 1), 1000);
              } else {
                console.warn('[Tracking] ⚠ Triple Whale not available after retries');
              }
            };

            // Initial verification and pageLoad attempt
            setTimeout(() => {
              const w = window as any;
              if (typeof w.TriplePixel === 'function') {
                console.log('[Tracking] ✓ Triple Whale TriplePixel verified loaded');
                fireTWPageLoad();
              } else {
                console.warn('[Tracking] ⚠ Triple Whale TriplePixel not found on window');
                fireTWPageLoad(); // continue retrying
              }
            }, 1000);
          } catch (error) {
            console.error('[Tracking] ✗ Triple Whale failed to inject:', error);
          }
        }

        // Microsoft Clarity with retry
        if (scripts.microsoftClarityId) {
          console.log('[Tracking] Injecting Microsoft Clarity:', scripts.microsoftClarityId);
          
          if (!(window as any).clarity) {
            const clarityScript = document.createElement('script');
            clarityScript.type = 'text/javascript';
            clarityScript.innerHTML = `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                t.onerror=function(){console.error('[Tracking] ✗ Microsoft Clarity failed');};
                t.onload=function(){console.log('[Tracking] ✓ Microsoft Clarity loaded');};
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
        
        // Verify scripts loaded after 3 seconds
        setTimeout(() => {
          const verification = {
            gtag: typeof (window as any).gtag === 'function',
            fbq: typeof (window as any).fbq === 'function',
            clarity: typeof (window as any).clarity === 'function',
          };
          
          console.log('[Tracking] Verification Results:', verification);
          
          if (verification.gtag && scripts.googleAnalyticsId) {
            (window as any).gtag('event', 'page_view_verified');
          }
          if (verification.fbq && scripts.facebookPixelId) {
            (window as any).fbq('trackCustom', 'PageViewVerified');
          }
        }, 3000);
      } catch (error) {
        console.error('[Tracking] CRITICAL ERROR injecting scripts:', error);
      }
    };
    
    // Reduced delay: 500ms with requestIdleCallback, DOMContentLoaded for Safari
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(injectScripts, { timeout: 500 });
    } else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScripts);
      } else {
        setTimeout(injectScripts, 100);
      }
    }
  }, [pageData?.trackingScripts]);

  // Show hero skeleton while loading hero data
  if (!heroLoaded && isLoading) {
    return <HeroSkeleton />;
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
      <Suspense fallback={<HeroSkeleton />}>
        <LazySection threshold={0} rootMargin="0px" fallback={<HeroSkeleton />}>
          {renderTemplate()}
        </LazySection>
      </Suspense>
      <StickyCtaButton 
        text={pageData.cta_text} 
        onClick={() => handleCtaClick("sticky_button")} 
        variant={(pageData.cta_style as any) || "ctaAmazon"}
        scrollThreshold={pageData.sticky_cta_threshold || 20}
        isEditing={false}
      />
    </div>
  );
}