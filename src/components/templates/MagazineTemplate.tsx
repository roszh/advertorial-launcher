import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import placeholderImage from "@/assets/hero-image.jpg";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
}

interface MagazineTemplateProps {
  sections: Section[];
  ctaText: string;
  onCtaClick: () => void;
  imageUrl?: string;
  isEditing?: boolean;
}

export const MagazineTemplate = ({ sections, ctaText, onCtaClick, imageUrl, isEditing }: MagazineTemplateProps) => {
  const heroSection = sections[0];
  const bodySections = sections.slice(1);
  
  return (
    <article className="bg-background">
      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <div className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
            Featured Story
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight font-serif">
            {heroSection?.heading || "Your Compelling Headline Here"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {heroSection?.content}
          </p>
        </div>
        
        <figure className="w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-4">
          <img
            src={imageUrl || placeholderImage}
            alt="Article hero image"
            className="w-full h-full object-cover"
          />
        </figure>
        <figcaption className="text-sm text-muted-foreground text-center">
          {isEditing ? "Upload your image to replace this placeholder" : "Photo illustration"}
        </figcaption>
      </header>

      {/* Body Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {bodySections.map((section, index) => (
          <section key={index} className="mb-8">
            {section.heading && (
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-serif leading-tight">
                {section.heading}
              </h2>
            )}
            <div className="prose prose-lg max-w-none">
              {section.content.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="text-base md:text-lg leading-relaxed mb-4 text-foreground/90 font-serif">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {section.type === "cta" && (
              <div className="my-8 p-6 md:p-8 bg-secondary/30 rounded-lg text-center">
                <Button
                  variant="cta"
                  size="lg"
                  onClick={onCtaClick}
                  className="text-base md:text-lg px-8 py-6 h-auto"
                >
                  {ctaText}
                </Button>
              </div>
            )}
          </section>
        ))}

        {/* Final CTA */}
        <div className="border-t border-border pt-8 mt-12 text-center">
          <Button
            variant="cta"
            size="lg"
            onClick={onCtaClick}
            className="text-base md:text-lg px-10 py-6 h-auto"
          >
            {ctaText}
          </Button>
        </div>
      </div>
    </article>
  );
};
