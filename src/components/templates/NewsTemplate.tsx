import { Button } from "../ui/button";
import { InlineImageUpload } from "../InlineImageUpload";
import { InlineTextEditor } from "../InlineTextEditor";
import placeholderImage from "@/assets/hero-image.jpg";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
}

interface NewsTemplateProps {
  sections: Section[];
  ctaText: string;
  onCtaClick: () => void;
  imageUrl?: string;
  isEditing?: boolean;
  userId?: string;
  onUpdateSection?: (index: number, section: Section) => void;
  onUpdateCta?: (text: string) => void;
}

export const NewsTemplate = ({ 
  sections, 
  ctaText, 
  onCtaClick, 
  imageUrl, 
  isEditing,
  userId,
  onUpdateSection,
  onUpdateCta
}: NewsTemplateProps) => {
  const heroSection = sections[0];
  const bodySections = sections.slice(1);
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const handleSectionUpdate = (index: number, field: keyof Section, value: any) => {
    if (!isEditing || !onUpdateSection) return;
    const section = sections[index];
    onUpdateSection(index, { ...section, [field]: value });
  };
  
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
        {isEditing ? (
          <InlineTextEditor
            value={heroSection?.heading || "Breaking: Major Development Unfolds"}
            onSave={(value) => handleSectionUpdate(0, "heading", value)}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] font-serif"
            as="h1"
          />
        ) : (
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] font-serif">
            {heroSection?.heading || "Breaking: Major Development Unfolds"}
          </h1>
        )}
        
        {isEditing ? (
          <InlineTextEditor
            value={heroSection?.content || ""}
            onSave={(value) => handleSectionUpdate(0, "content", value)}
            multiline
            className="text-lg md:text-2xl text-muted-foreground mb-8 leading-relaxed font-medium"
            as="p"
          />
        ) : (
          <p className="text-lg md:text-2xl text-muted-foreground mb-8 leading-relaxed font-medium">
            {heroSection?.content}
          </p>
        )}

        <figure className="w-full mb-6">
          {isEditing && userId ? (
            <InlineImageUpload
              currentImageUrl={imageUrl || placeholderImage}
              onImageUploaded={(url) => handleSectionUpdate(0, "imageUrl", url)}
              userId={userId}
              aspectRatio="wide"
              className="max-h-[500px]"
            />
          ) : (
            <img
              src={imageUrl || placeholderImage}
              alt="News article image"
              className="w-full rounded object-cover"
              style={{ maxHeight: '500px' }}
            />
          )}
          <figcaption className="text-sm text-muted-foreground mt-3 px-2">
            {isEditing ? "Click image to replace" : "News Photo"}
          </figcaption>
        </figure>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        {bodySections.map((section, idx) => {
          const actualIndex = idx + 1;
          return (
            <section key={idx} className="mb-6">
              {section.heading && (
                isEditing ? (
                  <InlineTextEditor
                    value={section.heading}
                    onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                    className="text-xl md:text-2xl font-bold mb-3 font-serif"
                    as="h2"
                  />
                ) : (
                  <h2 className="text-xl md:text-2xl font-bold mb-3 font-serif">
                    {section.heading}
                  </h2>
                )
              )}
              
              {section.imageUrl && (
                <div className="mb-6">
                  {isEditing && userId ? (
                    <InlineImageUpload
                      currentImageUrl={section.imageUrl}
                      onImageUploaded={(url) => handleSectionUpdate(actualIndex, "imageUrl", url)}
                      userId={userId}
                      aspectRatio="video"
                    />
                  ) : (
                    <img
                      src={section.imageUrl}
                      alt={section.heading || "Section image"}
                      className="w-full rounded"
                    />
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {isEditing ? (
                  <InlineTextEditor
                    value={section.content}
                    onSave={(value) => handleSectionUpdate(actualIndex, "content", value)}
                    multiline
                    className="text-base md:text-lg leading-relaxed text-foreground/90"
                    as="p"
                  />
                ) : (
                  section.content.split('\n\n').map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-base md:text-lg leading-relaxed text-foreground/90">
                      {paragraph}
                    </p>
                  ))
                )}
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
                    {isEditing && onUpdateCta ? (
                      <InlineTextEditor
                        value={ctaText}
                        onSave={onUpdateCta}
                        className="font-bold"
                        as="p"
                      />
                    ) : (
                      ctaText
                    )}
                  </Button>
                </div>
              )}
            </section>
          );
        })}

        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-secondary/20 rounded-lg p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-4">Stay Updated</h3>
            {isEditing && onUpdateCta ? (
              <Button
                variant="cta"
                size="lg"
                className="w-full md:w-auto px-12"
              >
                <InlineTextEditor
                  value={ctaText}
                  onSave={onUpdateCta}
                  className="font-bold"
                  as="p"
                />
              </Button>
            ) : (
              <Button
                variant="cta"
                size="lg"
                onClick={onCtaClick}
                className="w-full md:w-auto px-12"
              >
                {ctaText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};