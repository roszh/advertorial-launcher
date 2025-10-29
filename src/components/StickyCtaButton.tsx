import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface StickyCtaButtonProps {
  text: string;
  onClick: () => void;
  variant?: "ctaAmazon" | "ctaUrgent" | "ctaPremium" | "ctaTrust";
  scrollThreshold?: number;
}

export const StickyCtaButton = ({ text, onClick, variant = "ctaAmazon", scrollThreshold = 20 }: StickyCtaButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      // Show button after scrolling past the threshold percentage of viewport height
      const triggerPoint = windowHeight * (scrollThreshold / 100);
      setIsVisible(scrollTop >= triggerPoint);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold]);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out pointer-events-none",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="bg-background/95 backdrop-blur-sm border-t border-border shadow-[var(--shadow-strong)] p-4 pointer-events-auto">
        <div className="max-w-4xl mx-auto flex justify-center">
          <Button
            variant={variant}
            size="lg"
            onClick={onClick}
            className="w-full md:w-auto text-base md:text-lg px-8 md:px-12 py-4 md:py-6 h-auto touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            {text}
          </Button>
        </div>
      </div>
    </div>
  );
};
