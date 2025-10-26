import { Button } from "../ui/button";
import placeholderImage from "@/assets/hero-image.jpg";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
}

interface BlogTemplateProps {
  sections: Section[];
  ctaText: string;
  onCtaClick: () => void;
  imageUrl?: string;
  isEditing?: boolean;
}

export const BlogTemplate = ({ sections, ctaText, onCtaClick, imageUrl, isEditing }: BlogTemplateProps) => {
  const heroSection = sections[0];
  const bodySections = sections.slice(1);
  
  return (
    <article className="bg-background">
      <header className="relative">
        <div className="relative w-full" style={{ height: '60vh', minHeight: '400px' }}>
          <img
            src={imageUrl || placeholderImage}
            alt="Blog post header"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 -mt-32 md:-mt-48">
          <div className="bg-background/95 backdrop-blur rounded-lg p-6 md:p-10 shadow-xl">
            <div className="text-sm text-primary font-semibold mb-3 uppercase tracking-wider">
              Expert Insights
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {heroSection?.heading || "Discover the Ultimate Guide"}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {heroSection?.content}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {bodySections.map((section, index) => (
          <section key={index} className="mb-10">
            {section.heading && (
              <h2 className="text-2xl md:text-3xl font-bold mb-5 leading-tight">
                {section.heading}
              </h2>
            )}
            <div className="space-y-5">
              {section.content.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="text-base md:text-lg leading-[1.8] text-foreground/90">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {section.type === "cta" && (
              <div className="my-12 text-center">
                <div className="inline-block bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8">
                  <h3 className="text-2xl font-bold mb-4">{section.heading}</h3>
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
            )}
          </section>
        ))}

        <footer className="mt-16 pt-10 border-t border-border text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg text-muted-foreground mb-6">Join thousands who have already transformed their lives</p>
          <Button
            variant="cta"
            size="lg"
            onClick={onCtaClick}
            className="text-lg px-12 py-6 h-auto"
          >
            {ctaText}
          </Button>
        </footer>
      </div>
      
      {isEditing && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Upload your image to replace the placeholder
        </div>
      )}
    </article>
  );
};
