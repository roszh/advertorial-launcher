import { Button } from "../ui/button";
import { InlineImageUpload } from "../InlineImageUpload";
import { RichTextEditor } from "../RichTextEditor";
import { SectionControls } from "../SectionControls";
import { DraggableSections } from "../DraggableSections";
import placeholderImage from "@/assets/hero-image.jpg";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
  ctaText?: string;
}

interface NewsTemplateProps {
  sections: Section[];
  ctaText: string;
  onCtaClick: (elementId: string) => void;
  imageUrl?: string;
  isEditing?: boolean;
  userId?: string;
  subtitle?: string;
  onUpdateSubtitle?: (subtitle: string) => void;
  ctaVariant?: "ctaAmazon" | "ctaUrgent" | "ctaPremium" | "ctaTrust";
  onUpdateSection?: (index: number, section: Section) => void;
  onUpdateCta?: (text: string) => void;
  onAddSection?: (index: number, type: "text" | "image") => void;
  onDeleteSection?: (index: number) => void;
  onReorderSections?: (newOrder: string[]) => void;
}

export const NewsTemplate = ({ 
  sections, 
  ctaText, 
  onCtaClick, 
  imageUrl, 
  isEditing,
  userId,
  subtitle = "Breaking News",
  onUpdateSubtitle,
  ctaVariant = "ctaAmazon",
  onUpdateSection,
  onUpdateCta,
  onAddSection,
  onDeleteSection,
  onReorderSections
}: NewsTemplateProps) => {
  const heroSection = sections[0];
  const bodySections = sections.slice(1);
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  
  const handleSectionUpdate = (index: number, field: keyof Section, value: any) => {
    if (!isEditing || !onUpdateSection) return;
    const section = sections[index];
    onUpdateSection(index, { ...section, [field]: value });
  };
  
  const handleReorder = (newOrder: string[]) => {
    if (!onReorderSections) return;
    onReorderSections(newOrder);
  };
  
  const draggableItems = bodySections.map((section, idx) => {
    const actualIndex = idx + 1;
    const isDeleting = deletingIndex === actualIndex;
    
    return {
      id: actualIndex.toString(),
      content: (
        <div className={cn(
          "group relative transition-all duration-300",
          isDeleting && "ring-4 ring-destructive ring-opacity-50 bg-destructive/5 rounded-lg animate-pulse"
        )}>
          <section className="mb-5 md:mb-6">
            {section.heading && (
              isEditing ? (
                <RichTextEditor
                  value={section.heading}
                  onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                  onDelete={() => onDeleteSection?.(actualIndex)}
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
            
            {(section.type === "image" || !!section.imageUrl) && (
              <div className="mb-4 md:mb-6">
                {isEditing && userId && section.type === "image" ? (
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
            
            {section.type !== "cta" && (
              <div className="space-y-3 md:space-y-4">
                {isEditing ? (
                  <RichTextEditor
                    value={section.content}
                    onSave={(value) => handleSectionUpdate(actualIndex, "content", value)}
                    onDelete={() => onDeleteSection?.(actualIndex)}
                    multiline
                    className="text-sm md:text-base lg:text-lg leading-relaxed text-foreground/90 break-words"
                    as="p"
                    enableAiOptimize={true}
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
            )}
            
            {section.type === "cta" && (
              <div className="my-6 md:my-10 p-4 md:p-6 bg-muted/50 border-l-4 border-primary">
                {section.heading && (
                  isEditing ? (
                    <RichTextEditor
                      value={section.heading}
                      onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                      className="text-base md:text-lg font-semibold mb-3 md:mb-4"
                      as="p"
                    />
                  ) : (
                    <p className="text-base md:text-lg font-semibold mb-3 md:mb-4">{section.heading}</p>
                  )
                )}
                {isEditing ? (
                  <Button
                    variant={ctaVariant}
                    size="lg"
                    className="w-full"
                  >
                    <RichTextEditor
                      value={section.ctaText || ctaText}
                      onSave={(value) => handleSectionUpdate(actualIndex, "ctaText", value)}
                      className="font-bold"
                      as="p"
                    />
                  </Button>
                ) : (
                  <Button
                    variant={ctaVariant}
                    size="lg"
                    onClick={() => onCtaClick(`button${actualIndex}`)}
                    className="w-full"
                  >
                    {section.ctaText || ctaText}
                  </Button>
                )}
              </div>
            )}
          </section>
          
          {isEditing && onAddSection && onDeleteSection && (
            <SectionControls
              index={actualIndex}
              onAddTextBelow={() => onAddSection(actualIndex, "text")}
              onAddImageBelow={() => onAddSection(actualIndex, "image")}
              onAddCtaBelow={() => {
                const ctaSection = {
                  type: "cta" as const,
                  content: "",
                  ctaText: ctaText || "Click Here"
                };
                onUpdateSection?.(actualIndex + 1, ctaSection);
              }}
              onDeleteSection={() => onDeleteSection(actualIndex)}
              onCloneSection={() => {
                const clonedSection = { ...section };
                onAddSection(actualIndex, section.type as "text" | "image");
                setTimeout(() => {
                  const newIndex = actualIndex + 1;
                  onUpdateSection?.(newIndex, clonedSection);
                }, 100);
              }}
              onDeleteHover={(isHovering) => setDeletingIndex(isHovering ? actualIndex : null)}
            />
          )}
        </div>
      )
    };
  });
  
  return (
    <article className="bg-background min-h-screen overflow-x-hidden">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
            <time dateTime={new Date().toISOString()}>{currentDate}</time>
            <span className="uppercase tracking-wide font-medium">
              {isEditing && onUpdateSubtitle ? (
                <RichTextEditor
                  value={subtitle}
                  onSave={onUpdateSubtitle}
                  className="text-xs md:text-sm text-muted-foreground uppercase tracking-wide font-medium"
                  as="p"
                />
              ) : (
                subtitle
              )}
            </span>
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
        <DraggableSections
          items={draggableItems}
          onReorder={handleReorder}
          isEditing={isEditing}
        />

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border">
          <div className="bg-secondary/20 rounded-lg p-4 md:p-6 lg:p-8 text-center">
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4">Stay Updated</h3>
            <Button
              variant={ctaVariant}
              size="lg"
              onClick={() => onCtaClick("final_cta")}
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