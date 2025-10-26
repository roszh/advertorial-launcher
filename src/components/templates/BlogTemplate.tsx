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

interface BlogTemplateProps {
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

export const BlogTemplate = ({ 
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
}: BlogTemplateProps) => {
  const heroSection = sections[0];
  const bodySections = sections.slice(1);
  
  const handleSectionUpdate = (index: number, field: keyof Section, value: any) => {
    if (!isEditing || !onUpdateSection) return;
    const section = sections[index];
    onUpdateSection(index, { ...section, [field]: value });
  };
  
  return (
    <article className="bg-background overflow-x-hidden">
      <header className="relative">
        <div className="relative w-full" style={{ height: '50vh', minHeight: '300px' }}>
          {isEditing && userId ? (
            <div className="w-full h-full">
              <InlineImageUpload
                currentImageUrl={imageUrl || placeholderImage}
                onImageUploaded={(url) => handleSectionUpdate(0, "imageUrl", url)}
                userId={userId}
                aspectRatio="wide"
                className="h-full"
              />
            </div>
          ) : (
            <img
              src={imageUrl || placeholderImage}
              alt="Blog post header"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 -mt-20 md:-mt-32 lg:-mt-48">
          <div className="bg-background/95 backdrop-blur rounded-lg p-4 md:p-6 lg:p-10 shadow-xl">
            <div className="text-xs md:text-sm text-primary font-semibold mb-2 md:mb-3 uppercase tracking-wider">
              Expert Insights
            </div>
            {isEditing ? (
              <RichTextEditor
                value={heroSection?.heading || "Discover the Ultimate Guide"}
                onSave={(value) => handleSectionUpdate(0, "heading", value)}
                className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 leading-tight"
                as="h1"
              />
            ) : (
              <h1 
                className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 leading-tight"
                dangerouslySetInnerHTML={{ 
                  __html: (heroSection?.heading || "Discover the Ultimate Guide")
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
                className="text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed"
                as="p"
              />
            ) : (
              <p 
                className="text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: (heroSection?.content || "")
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                }}
              />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 lg:py-16">
        {bodySections.map((section, idx) => {
          const actualIndex = idx + 1;
          return (
            <div key={idx} className="group relative">
              <section className="mb-6 md:mb-8 lg:mb-10">
                {section.heading && (
                  isEditing ? (
                    <RichTextEditor
                      value={section.heading}
                      onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                      className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 lg:mb-5 leading-tight"
                      as="h2"
                    />
                  ) : (
                    <h2 
                      className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 lg:mb-5 leading-tight"
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
                        className="w-full max-w-full rounded-lg"
                      />
                    ) : null}
                  </div>
                )}
                
                <div className="space-y-3 md:space-y-4 lg:space-y-5">
                  {isEditing ? (
                    <RichTextEditor
                      value={section.content}
                      onSave={(value) => handleSectionUpdate(actualIndex, "content", value)}
                      multiline
                      className="text-sm md:text-base lg:text-lg leading-[1.7] md:leading-[1.8] text-foreground/90 break-words"
                      as="p"
                    />
                  ) : (
                    section.content.split('\n\n').map((paragraph, pIndex) => (
                      <p 
                        key={pIndex} 
                        className="text-sm md:text-base lg:text-lg leading-[1.7] md:leading-[1.8] text-foreground/90 break-words"
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
                  <div className="my-8 md:my-12 text-center">
                    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-4 md:p-6 lg:p-8">
                      {isEditing && section.heading ? (
                        <RichTextEditor
                          value={section.heading}
                          onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                          className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4"
                          as="h3"
                        />
                      ) : (
                        <h3 
                          className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4"
                          dangerouslySetInnerHTML={{ 
                            __html: (section.heading || "")
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                          }}
                        />
                      )}
                      <Button
                        variant="cta"
                        size="lg"
                        onClick={onCtaClick}
                        className="text-sm md:text-base lg:text-lg px-6 md:px-10 py-4 md:py-6 h-auto w-full md:w-auto"
                      >
                        {ctaText}
                      </Button>
                    </div>
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

        <footer className="mt-10 md:mt-16 pt-6 md:pt-10 border-t border-border text-center">
          <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">Ready to Get Started?</h3>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground mb-4 md:mb-6">Join thousands who have already transformed their lives</p>
          <Button
            variant="cta"
            size="lg"
            onClick={onCtaClick}
            className="text-sm md:text-base lg:text-lg px-8 md:px-12 py-4 md:py-6 h-auto w-full md:w-auto"
          >
            {ctaText}
          </Button>
        </footer>
      </div>
    </article>
  );
};