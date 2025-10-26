import { Button } from "../ui/button";
import placeholderImage from "@/assets/hero-image.jpg";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
}

interface NewsTemplateProps {
  sections: Section[];
  ctaText: string;
  onCtaClick: () => void;
  imageUrl?: string;
  isEditing?: boolean;
}

export const NewsTemplate = ({ sections, ctaText, onCtaClick, imageUrl, isEditing }: NewsTemplateProps) => {
  const heroSection = sections[0];
  const bodySections = sections.slice(1);
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <article className="bg-background min-h-screen">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <time dateTime={new Date().toISOString()}>{currentDate}</time>
            <span className="uppercase tracking-wide font-medium">Breaking News</span>
          </div>
        </div>
      </div>

      <header className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] font-serif">
          {heroSection?.heading || "Breaking: Major Development Unfolds"}
        </h1>
        
        <p className="text-lg md:text-2xl text-muted-foreground mb-8 leading-relaxed font-medium">
          {heroSection?.content}
        </p>

        <figure className="w-full mb-6">
          <img
            src={imageUrl || placeholderImage}
            alt="News article image"
            className="w-full rounded object-cover"
            style={{ maxHeight: '500px' }}
          />
          <figcaption className="text-sm text-muted-foreground mt-3 px-2">
            {isEditing ? "Upload your image to replace this placeholder" : "News Photo"}
          </figcaption>
        </figure>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        {bodySections.map((section, index) => (
          <section key={index} className="mb-6">
            {section.heading && (
              <h2 className="text-xl md:text-2xl font-bold mb-3 font-serif">
                {section.heading}
              </h2>
            )}
            <div className="space-y-4">
              {section.content.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="text-base md:text-lg leading-relaxed text-foreground/90">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {section.type === "cta" && (
              <div className="my-10 p-6 bg-muted/50 border-l-4 border-primary">
                <p className="text-lg font-semibold mb-4">{section.heading}</p>
                <Button
                  variant="cta"
                  size="lg"
                  onClick={onCtaClick}
                  className="w-full md:w-auto"
                >
                  {ctaText}
                </Button>
              </div>
            )}
          </section>
        ))}

        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-secondary/20 rounded-lg p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-4">Stay Updated</h3>
            <Button
              variant="cta"
              size="lg"
              onClick={onCtaClick}
              className="w-full md:w-auto px-12"
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
