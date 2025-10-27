import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { InlineImageUpload } from "../InlineImageUpload";
import { RichTextEditor } from "../RichTextEditor";
import { SectionControls } from "../SectionControls";
import { DraggableSections } from "../DraggableSections";
import placeholderImage from "@/assets/hero-image.jpg";
import { useState } from "react";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
}

interface MagazineTemplateProps {
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

export const MagazineTemplate = ({ 
  sections, 
  ctaText, 
  onCtaClick, 
  imageUrl, 
  isEditing,
  userId,
  subtitle = "Featured Story",
  onUpdateSubtitle,
  ctaVariant = "ctaAmazon",
  onUpdateSection,
  onUpdateCta,
  onAddSection,
  onDeleteSection,
  onReorderSections
}: MagazineTemplateProps) => {
  const heroSection = sections[0];
  const bodySections = sections.slice(1);
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
          <section className="mb-6 md:mb-8">
            {section.heading && (
              isEditing ? (
                <RichTextEditor
                  value={section.heading}
                  onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                  onDelete={() => onDeleteSection?.(actualIndex)}
                  className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 font-serif leading-tight"
                  as="h2"
                />
              ) : (
                <h2 
                  className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 font-serif leading-tight"
                  dangerouslySetInnerHTML={{ __html: section.heading.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') }}
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
            
            <div className="prose prose-base md:prose-lg max-w-none break-words">
              {isEditing ? (
                <RichTextEditor
                  value={section.content}
                  onSave={(value) => handleSectionUpdate(actualIndex, "content", value)}
                  onDelete={() => onDeleteSection?.(actualIndex)}
                  multiline
                  className="text-sm md:text-base lg:text-lg leading-relaxed text-foreground/90 font-serif"
                  as="p"
                  enableAiOptimize={true}
                />
              ) : (
                section.content.split('\n\n').map((paragraph, pIndex) => (
                  <p 
                    key={pIndex} 
                    className="text-sm md:text-base lg:text-lg leading-relaxed mb-3 md:mb-4 text-foreground/90 font-serif break-words"
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
              <div className="my-6 md:my-8 p-4 md:p-6 lg:p-8 bg-secondary/30 rounded-lg text-center">
                <Button
                  variant={ctaVariant}
                  size="lg"
                  onClick={() => onCtaClick(`button${actualIndex}`)}
                  className="text-sm md:text-base lg:text-lg px-6 md:px-8 py-4 md:py-6 h-auto w-full md:w-auto"
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
              onAddCtaBelow={() => {
                const ctaSection = {
                  type: "cta" as const,
                  content: "Ready to take action?",
                  heading: "Get Started Now"
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
    <article className="bg-background overflow-x-hidden">
      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <div className="text-center mb-6 md:mb-8">
          <div className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 uppercase tracking-wider font-medium">
            {isEditing && onUpdateSubtitle ? (
              <RichTextEditor
                value={subtitle}
                onSave={onUpdateSubtitle}
                className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider font-medium text-center"
                as="p"
              />
            ) : (
              subtitle
            )}
          </div>
          {isEditing ? (
            <RichTextEditor
              value={heroSection?.heading || "Your Compelling Headline Here"}
              onSave={(value) => handleSectionUpdate(0, "heading", value)}
              className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight font-serif text-center"
              as="h1"
            />
          ) : (
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight font-serif">
              {heroSection?.heading || "Your Compelling Headline Here"}
            </h1>
          )}
          {isEditing ? (
            <div className="max-w-3xl mx-auto">
              <RichTextEditor
                value={heroSection?.content || ""}
                onSave={(value) => handleSectionUpdate(0, "content", value)}
                multiline
                className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed"
                as="p"
              />
            </div>
          ) : (
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {heroSection?.content}
            </p>
          )}
        </div>
        
        {isEditing && userId ? (
          <InlineImageUpload
            currentImageUrl={imageUrl || placeholderImage}
            onImageUploaded={(url) => handleSectionUpdate(0, "imageUrl", url)}
            userId={userId}
            aspectRatio="video"
          />
        ) : (
          <figure className="w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-3 md:mb-4">
            <img
              src={imageUrl || placeholderImage}
              alt="Article hero image"
              className="w-full h-full object-cover"
            />
          </figure>
        )}
        <figcaption className="text-xs md:text-sm text-muted-foreground text-center mt-3 md:mt-4">
          {isEditing ? "Click image to replace" : "Photo illustration"}
        </figcaption>
      </header>

      {/* Body Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 md:py-6">
        <DraggableSections
          items={draggableItems}
          onReorder={handleReorder}
          isEditing={isEditing}
        />

        {/* Final CTA */}
        <div className="border-t border-border pt-6 md:pt-8 mt-8 md:mt-12 text-center">
          {isEditing && onUpdateCta ? (
            <Button
              variant={ctaVariant}
              size="lg"
              className="text-sm md:text-base lg:text-lg px-8 md:px-10 py-4 md:py-6 h-auto w-full md:w-auto"
            >
              <RichTextEditor
                value={ctaText}
                onSave={onUpdateCta}
                className="font-bold"
                as="p"
              />
            </Button>
          ) : (
            <Button
              variant={ctaVariant}
              size="lg"
              onClick={() => onCtaClick("final_cta")}
              className="text-sm md:text-base lg:text-lg px-8 md:px-10 py-4 md:py-6 h-auto w-full md:w-auto"
            >
              {ctaText}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
