import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import heroImage from "@/assets/hero-image.jpg";
import successImage from "@/assets/success-image.jpg";
import trustBg from "@/assets/trust-bg.jpg";

interface PresellSectionProps {
  section: {
    type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
    content: string;
    heading?: string;
    imagePosition?: "left" | "right" | "full" | "none";
    style?: "normal" | "emphasized" | "callout";
  };
  ctaText: string;
  onCtaClick: () => void;
}

const getImageForSection = (type: string) => {
  switch (type) {
    case "hero":
      return heroImage;
    case "benefits":
      return successImage;
    case "testimonial":
      return trustBg;
    default:
      return successImage;
  }
};

export const PresellSection = ({ section, ctaText, onCtaClick }: PresellSectionProps) => {
  const isHero = section.type === "hero";
  const isCta = section.type === "cta";
  const hasImage = section.imagePosition && section.imagePosition !== "none";
  const imageSrc = getImageForSection(section.type);

  if (isCta) {
    return (
      <div className="py-16 text-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{section.heading}</h2>
          <p className="text-lg text-muted-foreground mb-8">{section.content}</p>
          <Button
            variant="cta"
            size="lg"
            onClick={onCtaClick}
            className="text-lg px-12 py-6 h-auto"
          >
            {ctaText}
          </Button>
        </div>
      </div>
    );
  }

  if (isHero) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-background z-0" />
        {hasImage && section.imagePosition === "full" && (
          <div className="absolute inset-0 z-0">
            <img
              src={imageSrc}
              alt="Hero background"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {section.heading}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            {section.content}
          </p>
          <Button
            variant="cta"
            size="lg"
            onClick={onCtaClick}
            className="text-lg px-10 py-6 h-auto"
          >
            {ctaText}
          </Button>
        </div>
      </div>
    );
  }

  const containerClasses = cn(
    "py-12 px-4",
    section.style === "emphasized" && "bg-secondary/30",
    section.style === "callout" && "bg-gradient-to-r from-primary/5 to-accent/5 border-l-4 border-primary"
  );

  if (hasImage && (section.imagePosition === "left" || section.imagePosition === "right")) {
    return (
      <div className={containerClasses}>
        <div
          className={cn(
            "max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center",
            section.imagePosition === "right" && "md:grid-flow-dense"
          )}
        >
          <div className={cn(section.imagePosition === "right" && "md:col-start-2")}>
            {section.heading && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif leading-tight">
                {section.heading}
              </h2>
            )}
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed whitespace-pre-wrap font-serif text-foreground/90">
                {section.content}
              </p>
            </div>
          </div>
          <div className={cn(section.imagePosition === "right" && "md:col-start-1 md:row-start-1")}>
            <img
              src={imageSrc}
              alt={section.heading || "Section image"}
              className="w-full h-auto rounded-lg shadow-[var(--shadow-soft)]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="max-w-4xl mx-auto">
        {section.heading && (
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif leading-tight">
            {section.heading}
          </h2>
        )}
        <div className="prose prose-lg max-w-none">
          <p className="text-lg leading-relaxed whitespace-pre-wrap font-serif text-foreground/90">
            {section.content}
          </p>
        </div>
      </div>
    </div>
  );
};
