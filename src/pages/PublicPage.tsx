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

  // Single optimized query using RPC to bypass RLS on tracking scripts
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['published-page', slug],
    queryFn: async () => {
      // Use RPC function that bypasses RLS to ensure tracking scripts always load
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_published_page_with_scripts', { p_slug: slug })
        .maybeSingle();

      if (rpcError) throw rpcError;
      if (!rpcData) throw new Error("Page not found");

      const template = (rpcData.template as "magazine" | "news" | "blog" | "listicle") || "magazine";
      
      // Normalize sections for backwards compatibility
      const normalizedSections = ((rpcData.content as any)?.sections || []).map(normalizeSection);

      return {
        id: rpcData.id || undefined,
        title: rpcData.title,
        headline: rpcData.headline,
        subtitle: rpcData.subtitle || (template === "news" ? "Breaking News" : template === "blog" ? "Expert Insights" : "Featured Story"),
        content: { sections: normalizedSections },
        cta_text: rpcData.cta_text || "",
        cta_url: rpcData.cta_url || "",
        cta_style: rpcData.cta_style || "ctaAmazon",
        sticky_cta_threshold: rpcData.sticky_cta_threshold || 20,
        image_url: rpcData.image_url || "",
        template,
        user_id: rpcData.user_id,
        // Tracking scripts from RPC function (bypasses RLS)
        trackingScripts: {
          googleAnalyticsId: rpcData.google_analytics_id || undefined,
          facebookPixelId: rpcData.facebook_pixel_id || undefined,
          triplewhaleToken: rpcData.triplewhale_token || undefined,
          microsoftClarityId: rpcData.microsoft_clarity_id || undefined,
        },
        countrySetupName: rpcData.tracking_set_name || undefined,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - aggressive caching for published pages
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
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

  // Robust tracking script injection with idempotency guards and retry logic
  useEffect(() => {
    const scripts = pageData?.trackingScripts;
    if (!scripts || !Object.values(scripts).some(v => v)) {
      console.log('[Tracking] No tracking scripts configured for this page');
      return;
    }

    // Guard: prevent duplicate injection for the same slug
    const w = window as any;
    if (w.__trackingInjectedSlug === slug) {
      console.log('[Tracking] Scripts already injected for this page, dispatching page views');
      
      // Re-dispatch page view events for SPA navigation
      setTimeout(() => {
        if (typeof w.gtag === 'function' && scripts.googleAnalyticsId) {
          w.gtag('event', 'page_view', { page_path: window.location.pathname });
          console.log('[Tracking] ✓ GA page_view re-dispatched');
        }
        if (typeof w.fbq === 'function' && scripts.facebookPixelId) {
          w.fbq('track', 'PageView');
          console.log('[Tracking] ✓ FB PageView re-dispatched');
        }
        if (typeof w.TriplePixel === 'function' && scripts.triplewhaleToken) {
          w.TriplePixel('pageLoad');
          console.log('[Tracking] ✓ TW pageLoad re-dispatched');
        }
      }, 100);
      return;
    }

    console.log('[Tracking] Initializing tracking scripts for:', slug, {
      googleAnalytics: !!scripts.googleAnalyticsId,
      facebookPixel: !!scripts.facebookPixelId,
      tripleWhale: !!scripts.triplewhaleToken,
      microsoftClarity: !!scripts.microsoftClarityId,
    });
    
    const injectScripts = () => {
      try {
        // Google Analytics - idempotent injection
        if (scripts.googleAnalyticsId && !document.getElementById('ga-loader')) {
          console.log('[Tracking] Injecting Google Analytics:', scripts.googleAnalyticsId);
          
          const gaScript = document.createElement('script');
          gaScript.id = 'ga-loader';
          gaScript.async = true;
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${scripts.googleAnalyticsId}`;
          
          gaScript.onerror = () => {
            console.error('[Tracking] ✗ Google Analytics failed, retrying...');
            setTimeout(() => {
              if (!document.getElementById('ga-loader-retry')) {
                const retryScript = document.createElement('script');
                retryScript.id = 'ga-loader-retry';
                retryScript.async = true;
                retryScript.src = gaScript.src;
                retryScript.onload = () => console.log('[Tracking] ✓ Google Analytics loaded (retry)');
                document.head.appendChild(retryScript);
              }
            }, 1000);
          };
          
          gaScript.onload = () => console.log('[Tracking] ✓ Google Analytics script loaded');
          document.head.appendChild(gaScript);

          const gaConfigScript = document.createElement('script');
          gaConfigScript.id = 'ga-config';
          gaConfigScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${scripts.googleAnalyticsId}', { page_path: '${window.location.pathname}' });
            console.log('[Tracking] ✓ Google Analytics configured');
          `;
          document.head.appendChild(gaConfigScript);
        } else if (scripts.googleAnalyticsId) {
          console.log('[Tracking] Google Analytics already loaded');
        }

        // Facebook Pixel - idempotent injection
        if (scripts.facebookPixelId && !document.getElementById('fb-loader')) {
          console.log('[Tracking] Injecting Facebook Pixel:', scripts.facebookPixelId);
          
          const fbScript = document.createElement('script');
          fbScript.id = 'fb-loader';
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
            console.log('[Tracking] ✓ Facebook Pixel initialized and PageView tracked');
          `;
          document.head.appendChild(fbScript);

          const fbNoScript = document.createElement('noscript');
          fbNoScript.innerHTML = `<img height="1" width="1" style="display:none"
            src="https://www.facebook.com/tr?id=${scripts.facebookPixelId}&ev=PageView&noscript=1"/>`;
          document.body.appendChild(fbNoScript);
        } else if (scripts.facebookPixelId) {
          console.log('[Tracking] Facebook Pixel already loaded');
        }

        // Triple Whale - idempotent injection with robust retry
        if (scripts.triplewhaleToken && !document.getElementById('tw-loader')) {
          console.log('[Tracking] Injecting Triple Whale snippet');
          
          try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = scripts.triplewhaleToken.trim();
            
            let insertedCount = 0;
            Array.from(tempDiv.children).forEach((element, idx) => {
              if (element.tagName === 'SCRIPT') {
                const newScript = document.createElement('script');
                newScript.id = `tw-loader-${idx}`;
                newScript.type = 'text/javascript';
                
                Array.from(element.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                
                newScript.textContent = element.textContent;
                newScript.onerror = () => console.error('[Tracking] ✗ Triple Whale script failed to load');
                newScript.onload = () => console.log('[Tracking] ✓ Triple Whale script executed');
                
                document.head.appendChild(newScript);
              } else {
                document.head.appendChild(element.cloneNode(true));
              }
              insertedCount++;
            });
            console.log(`[Tracking] ✓ Triple Whale injected (${insertedCount} elements)`);
            
            // Ensure TriplePixelData context
            w.TriplePixelData = w.TriplePixelData || {};
            if (!w.TriplePixelData.plat) w.TriplePixelData.plat = 'CUSTOM';
            w.TriplePixelData.isHeadless = true;

            // Retry logic: attempt pageLoad up to 10 times with exponential backoff
            const fireTWPageLoad = (attempt = 1) => {
              if (typeof w.TriplePixel === 'function') {
                try {
                  w.TriplePixel('pageLoad');
                  console.log(`[Tracking] ✓ Triple Whale pageLoad fired (attempt ${attempt})`);
                  return;
                } catch (err) {
                  console.error('[Tracking] ✗ Error firing Triple Whale pageLoad:', err);
                }
              }
              
              if (attempt < 10) {
                const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000);
                console.log(`[Tracking] ⏳ Triple Whale retry ${attempt} in ${delay}ms`);
                setTimeout(() => fireTWPageLoad(attempt + 1), delay);
              } else {
                console.error('[Tracking] ✗ Triple Whale pageLoad failed after 10 attempts');
              }
            };

            // Start retry sequence
            setTimeout(() => fireTWPageLoad(1), 500);
          } catch (error) {
            console.error('[Tracking] ✗ Triple Whale failed to inject:', error);
          }
        } else if (scripts.triplewhaleToken) {
          console.log('[Tracking] Triple Whale already loaded');
        }

        // Microsoft Clarity - idempotent injection
        if (scripts.microsoftClarityId && !document.getElementById('clarity-loader')) {
          console.log('[Tracking] Injecting Microsoft Clarity:', scripts.microsoftClarityId);
          
          const clarityScript = document.createElement('script');
          clarityScript.id = 'clarity-loader';
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
        } else if (scripts.microsoftClarityId) {
          console.log('[Tracking] Microsoft Clarity already loaded');
        }

        console.log('[Tracking] ✓ All configured scripts processed');
        
        // Verify and dispatch page view events after 3 seconds
        setTimeout(() => {
          const verification = {
            gtag: typeof w.gtag === 'function',
            fbq: typeof w.fbq === 'function',
            clarity: typeof w.clarity === 'function',
            triplePixel: typeof w.TriplePixel === 'function',
          };
          
          console.log('[Tracking] Verification (3s):', verification);
          
          // Dispatch page view events to ensure tracking validators see activity
          if (verification.gtag && scripts.googleAnalyticsId) {
            w.gtag('event', 'page_view', { page_path: window.location.pathname });
            console.log('[Tracking] ✓ GA page_view dispatched');
          }
          if (verification.fbq && scripts.facebookPixelId) {
            w.fbq('track', 'PageView');
            console.log('[Tracking] ✓ FB PageView dispatched');
          }
        }, 3000);

        // Final verification and re-dispatch at 10 seconds (defense in depth)
        setTimeout(() => {
          const finalVerification = {
            gtag: typeof w.gtag === 'function',
            fbq: typeof w.fbq === 'function',
            triplePixel: typeof w.TriplePixel === 'function',
          };
          
          console.log('[Tracking] Final verification (10s):', finalVerification);
          
          if (finalVerification.gtag && scripts.googleAnalyticsId) {
            w.gtag('event', 'page_view', { page_path: window.location.pathname });
            console.log('[Tracking] ✓ GA page_view re-dispatched (10s)');
          }
          if (finalVerification.fbq && scripts.facebookPixelId) {
            w.fbq('track', 'PageView');
            console.log('[Tracking] ✓ FB PageView re-dispatched (10s)');
          }
        }, 10000);

        // Mark this slug as injected
        w.__trackingInjectedSlug = slug;
      } catch (error) {
        console.error('[Tracking] CRITICAL ERROR injecting scripts:', error);
      }
    };
    
    // Inject immediately (non-blocking)
    setTimeout(injectScripts, 0);
  }, [slug, pageData?.trackingScripts]);

  // Show loading state while fetching
  if (isLoading) {
    return <HeroSkeleton />;
  }

  // Show error state only when there's an actual error (not during loading)
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