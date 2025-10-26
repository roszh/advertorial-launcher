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
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollableHeight = documentHeight - windowHeight;
      const scrollPercentage = (scrollTop / scrollableHeight) * 100;
      
      setIsVisible(scrollPercentage >= scrollThreshold);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold]);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-background/95 backdrop-blur-sm border-t border-border shadow-[var(--shadow-strong)] p-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          <Button
            variant={variant}
            size="lg"
            onClick={onClick}
            className="w-full md:w-auto text-base md:text-lg px-8 md:px-12 py-4 md:py-6 h-auto relative z-10"
          >
            {text}
          </Button>
        </div>
      </div>
    </div>
  );
};
