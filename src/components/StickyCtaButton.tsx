import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface StickyCtaButtonProps {
  text: string;
  onClick: () => void;
  variant?: "ctaAmazon" | "ctaUrgent" | "ctaPremium" | "ctaTrust";
}

export const StickyCtaButton = ({ text, onClick, variant = "ctaAmazon" }: StickyCtaButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 300px
      const shouldShow = window.scrollY > 300;
      setIsVisible(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            className="w-full md:w-auto text-lg px-12 py-6 h-auto"
          >
            {text}
          </Button>
        </div>
      </div>
    </div>
  );
};
