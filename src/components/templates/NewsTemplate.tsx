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
          <RichTextEditor
            value={heroSection?.heading || "Breaking: Major Development Unfolds"}
            onSave={(value) => handleSectionUpdate(0, "heading", value)}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] font-serif"
            as="h1"
          />
        ) : (
          <h1 
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] font-serif"
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
            className="text-lg md:text-2xl text-muted-foreground mb-8 leading-relaxed font-medium"
            as="p"
          />
        ) : (
          <p 
            className="text-lg md:text-2xl text-muted-foreground mb-8 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ 
              __html: (heroSection?.content || "")
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>') 
            }}
          />
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
            <div key={idx} className="group relative">
              <section className="mb-6">
                {section.heading && (
                  isEditing ? (
                    <RichTextEditor
                      value={section.heading}
                      onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                      className="text-xl md:text-2xl font-bold mb-3 font-serif"
                      as="h2"
                    />
                  ) : (
                    <h2 
                      className="text-xl md:text-2xl font-bold mb-3 font-serif"
                      dangerouslySetInnerHTML={{ 
                        __html: section.heading
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                      }}
                    />
                  )
                )}
                
                {section.imageUrl !== undefined && (
                  <div className="mb-6">
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
                        className="w-full rounded"
                      />
                    ) : null}
                  </div>
                )}
                
                <div className="space-y-4">
                  {isEditing ? (
                    <RichTextEditor
                      value={section.content}
                      onSave={(value) => handleSectionUpdate(actualIndex, "content", value)}
                      multiline
                      className="text-base md:text-lg leading-relaxed text-foreground/90"
                      as="p"
                    />
                  ) : (
                    section.content.split('\n\n').map((paragraph, pIndex) => (
                      <p 
                        key={pIndex} 
                        className="text-base md:text-lg leading-relaxed text-foreground/90"
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