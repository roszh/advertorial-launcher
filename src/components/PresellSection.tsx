import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Edit2 } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import successImage from "@/assets/success-image.jpg";
import trustBg from "@/assets/trust-bg.jpg";

interface PresellSectionProps {
  section: {
    type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial" | "quote" | "facebook-testimonial" | "bullet-box";
    content: string;
    heading?: string;
    imagePosition?: "left" | "right" | "full" | "none";
    style?: "normal" | "emphasized" | "callout";
    author?: string;
    authorRole?: string;
    authorAvatar?: string;
    timestamp?: string;
    reactions?: number;
    items?: string[];
    boxColor?: "green" | "blue" | "purple" | "yellow";
  };
  ctaText: string;
  onCtaClick: (elementId: string) => void;
  elementId?: string;
  isEditing?: boolean;
  onEdit?: () => void;
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

export const PresellSection = ({ section, ctaText, onCtaClick, elementId = "untracked", isEditing = false, onEdit }: PresellSectionProps) => {
  const isHero = section.type === "hero";
  const isCta = section.type === "cta";
  const isQuote = section.type === "quote";
  const isFacebookTestimonial = section.type === "facebook-testimonial";
  const isBulletBox = section.type === "bullet-box";
  const hasImage = section.imagePosition && section.imagePosition !== "none";
  const imageSrc = getImageForSection(section.type);

  // Quote Section
  if (isQuote) {
    return (
      <div className="py-12 md:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div 
            className={cn(
              "relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 md:p-12 border border-primary/10",
              isEditing && "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            )}
            onClick={isEditing ? onEdit : undefined}
          >
            <div className="absolute -top-4 -left-4 text-6xl md:text-8xl text-primary/20 font-serif">"</div>
            <blockquote className="relative z-10">
              <p className="text-lg md:text-2xl font-serif italic leading-relaxed mb-6">
                {section.content}
              </p>
            </blockquote>
            <div className="flex items-center gap-4">
              {section.authorAvatar && (
                <img 
                  src={section.authorAvatar} 
                  alt={section.author}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-base md:text-lg">{section.author}</p>
                {section.authorRole && (
                  <p className="text-sm text-muted-foreground">{section.authorRole}</p>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Facebook Testimonial Section
  if (isFacebookTestimonial) {
    return (
      <div className="py-8 md:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div 
            className={cn(
              "bg-background dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6 border border-border relative group",
              isEditing && "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            )}
            onClick={isEditing ? onEdit : undefined}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {section.authorAvatar ? (
                  <img src={section.authorAvatar} alt={section.author} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold">{section.author?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm md:text-base truncate">{section.author}</p>
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">{section.timestamp || "2 days ago"}</p>
              </div>
            </div>
            <p className="text-sm md:text-base leading-relaxed mb-4 whitespace-pre-wrap">
              {section.content}
            </p>
            <div className="flex items-center gap-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-blue-500">👍</span>
                <span className="text-red-500">❤️</span>
                <span>{section.reactions || 0}</span>
              </div>
            </div>
            {isEditing && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Bullet Box Section
  if (isBulletBox) {
    const colorClasses = {
      green: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
      blue: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
      purple: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
      yellow: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
    };
    
    const iconColorClasses = {
      green: "text-green-600 dark:text-green-400",
      blue: "text-blue-600 dark:text-blue-400",
      purple: "text-purple-600 dark:text-purple-400",
      yellow: "text-yellow-600 dark:text-yellow-400",
    };

    return (
      <div className="py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className={cn(
              "rounded-xl p-6 md:p-8 border-2 relative group",
              colorClasses[section.boxColor || "blue"],
              isEditing && "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            )}
            onClick={isEditing ? onEdit : undefined}
          >
            {section.heading && (
              <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">{section.heading}</h3>
            )}
            <ul className="space-y-3 md:space-y-4">
              {section.items?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg 
                    className={cn("w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5", iconColorClasses[section.boxColor || "blue"])}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm md:text-lg leading-relaxed flex-1">{item}</span>
                </li>
              ))}
            </ul>
            {isEditing && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isCta) {
    return (
      <div className="py-16 text-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{section.heading}</h2>
          <p className="text-lg text-muted-foreground mb-8">{section.content}</p>
          <Button
            variant="cta"
            size="lg"
            onClick={() => onCtaClick(elementId)}
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
            onClick={() => onCtaClick(elementId)}
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
