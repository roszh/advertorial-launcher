import { Button } from "../ui/button";
import { InlineImageUpload } from "../InlineImageUpload";
import { RichTextEditor } from "../RichTextEditor";
import { SectionControls } from "../SectionControls";
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
  ctaVariant?: "ctaAmazon" | "ctaUrgent" | "ctaPremium" | "ctaTrust";
  onUpdateSection?: (index: number, section: Section) => void;
  onUpdateCta?: (text: string) => void;
  onAddSection?: (index: number, type: "text" | "image") => void;
  onDeleteSection?: (index: number) => void;
}

export const NewsTemplate = ({ 
  sections, 
  ctaText, 
  onCtaClick, 
  imageUrl, 
  isEditing,
  userId,
  ctaVariant = "ctaAmazon",
  onUpdateSection,
  onUpdateCta,
  onAddSection,
  onDeleteSection
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
    <article className="bg-background min-h-screen overflow-x-hidden">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
            <time dateTime={new Date().toISOString()}>{currentDate}</time>
            <span className="uppercase tracking-wide font-medium">Breaking News</span>
          </div>
        </div>
      </div>

      <header className="max-w-5xl mx-auto px-4 py-6 md:py-12">
        {isEditing ? (
          <RichTextEditor
            value={heroSection?.heading || "Breaking: Major Development Unfolds"}
            onSave={(value) => handleSectionUpdate(0, "heading", value)}
            className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-[1.1] font-serif"
            as="h1"
          />
        ) : (
          <h1 
            className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-[1.1] font-serif"
            dangerouslySetInnerHTML={{ 
              __html: (heroSection?.heading || "Breaking: Major Development Unfolds")
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>') 
            }}
          />
        )}
        
        {isEditing ? (
          <RichTextEditor
            value={heroSection?.content || ""}
            onSave={(value) => handleSectionUpdate(0, "content", value)}
            multiline
            className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed font-medium"
            as="p"
          />
        ) : (
          <p 
            className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ 
              __html: (heroSection?.content || "")
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>') 
            }}
          />
        )}

        <figure className="w-full mb-4 md:mb-6">
          {isEditing && userId ? (
            <InlineImageUpload
              currentImageUrl={imageUrl || placeholderImage}
              onImageUploaded={(url) => handleSectionUpdate(0, "imageUrl", url)}
              userId={userId}
              aspectRatio="wide"
              className="max-h-[300px] md:max-h-[500px]"
            />
          ) : (
            <img
              src={imageUrl || placeholderImage}
              alt="News article image"
              className="w-full max-w-full rounded object-cover"
              style={{ maxHeight: '300px' }}
            />
          )}
          <figcaption className="text-xs md:text-sm text-muted-foreground mt-2 md:mt-3 px-2">
            {isEditing ? "Click image to replace" : "News Photo"}
          </figcaption>
        </figure>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-8 md:pb-12">
        {bodySections.map((section, idx) => {
          const actualIndex = idx + 1;
          return (
            <div key={idx} className="group relative">
              <section className="mb-5 md:mb-6">
                {section.heading && (
                  isEditing ? (
                    <RichTextEditor
                      value={section.heading}
                      onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                      className="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 font-serif"
                      as="h2"
                    />
                  ) : (
                    <h2 
                      className="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 font-serif"
                      dangerouslySetInnerHTML={{ 
                        __html: section.heading
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                      }}
                    />
                  )
                )}
                
                {section.imageUrl !== undefined && (
                  <div className="mb-4 md:mb-6">
                    {isEditing && userId ? (
                      <InlineImageUpload
                        currentImageUrl={section.imageUrl}
                        onImageUploaded={(url) => handleSectionUpdate(actualIndex, "imageUrl", url)}
                        userId={userId}
                        aspectRatio="video"
                      />
                    ) : section.imageUrl ? (
                      <img
                        src={section.imageUrl}
                        alt={section.heading || "Section image"}
                        className="w-full max-w-full rounded"
                      />
                    ) : null}
                  </div>
                )}
                
                <div className="space-y-3 md:space-y-4">
                  {isEditing ? (
                    <RichTextEditor
                      value={section.content}
                      onSave={(value) => handleSectionUpdate(actualIndex, "content", value)}
                      multiline
                      className="text-sm md:text-base lg:text-lg leading-relaxed text-foreground/90 break-words"
                      as="p"
                    />
                  ) : (
                    section.content.split('\n\n').map((paragraph, pIndex) => (
                      <p 
                        key={pIndex} 
                        className="text-sm md:text-base lg:text-lg leading-relaxed text-foreground/90 break-words"
                        dangerouslySetInnerHTML={{ 
                          __html: paragraph
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                        }}
                      />
                    ))
                  )}
                </div>
                
                {section.type === "cta" && (
                  <div className="my-6 md:my-10 p-4 md:p-6 bg-muted/50 border-l-4 border-primary">
                    <p className="text-base md:text-lg font-semibold mb-3 md:mb-4">{section.heading}</p>
                    <Button
                      variant={ctaVariant}
                      size="lg"
                      onClick={onCtaClick}
                      className="w-full"
                    >
                      {ctaText}
                    </Button>
                  </div>
                )}
              </section>
              
              {isEditing && onAddSection && onDeleteSection && (
                <SectionControls
                  index={actualIndex}
                  onAddTextBelow={() => onAddSection(actualIndex, "text")}
                  onAddImageBelow={() => onAddSection(actualIndex, "image")}
                  onDeleteSection={() => onDeleteSection(actualIndex)}
                />
              )}
            </div>
          );
        })}

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border">
          <div className="bg-secondary/20 rounded-lg p-4 md:p-6 lg:p-8 text-center">
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4">Stay Updated</h3>
            <Button
              variant={ctaVariant}
              size="lg"
              onClick={onCtaClick}
              className="w-full px-6 md:px-12"
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};