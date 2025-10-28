import { Button } from "../ui/button";
import { InlineImageUpload } from "../InlineImageUpload";
import { RichTextEditor } from "../RichTextEditor";
import { SectionControls } from "../SectionControls";
import { DraggableSections } from "../DraggableSections";
import { PresellSection } from "../PresellSection";
import placeholderImage from "@/assets/hero-image.jpg";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id?: string;
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial" | "quote" | "facebook-testimonial" | "bullet-box";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
  ctaText?: string;
  author?: string;
  authorRole?: string;
  authorAvatar?: string;
  timestamp?: string;
  reactions?: number;
  items?: string[];
  boxColor?: "green" | "blue" | "purple" | "yellow";
}

interface BlogTemplateProps {
  sections: Section[];
  ctaText: string;
  onCtaClick: (elementId: string) => void;
  imageUrl?: string;
  isEditing?: boolean;
  userId?: string;
  subtitle?: string;
  headline?: string;
  onUpdateSubtitle?: (subtitle: string) => void;
  onUpdateHeadline?: (headline: string) => void;
  ctaVariant?: "ctaAmazon" | "ctaUrgent" | "ctaPremium" | "ctaTrust";
  onUpdateSection?: (index: number, section: Section) => void;
  onUpdateCta?: (text: string) => void;
  onAddSection?: (index: number, type: "text" | "image") => void;
  onDeleteSection?: (index: number) => void;
  onReorderSections?: (newOrder: string[]) => void;
  onEditSection?: (index: number) => void;
}

export const BlogTemplate = ({ 
  sections, 
  ctaText, 
  onCtaClick, 
  imageUrl, 
  isEditing = false,
  userId,
  subtitle = "Expert Insights",
  headline = "",
  onUpdateSubtitle,
  onUpdateHeadline,
  ctaVariant = "ctaAmazon",
  onUpdateSection,
  onUpdateCta,
  onAddSection,
  onDeleteSection,
  onReorderSections,
  onEditSection
}: BlogTemplateProps) => {
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
      id: section.id!,
      content: (
        <div className={cn(
          "group relative transition-all duration-300",
          isDeleting && "ring-4 ring-destructive ring-opacity-50 bg-destructive/5 rounded-lg animate-pulse"
        )}>
          {(section.type === "quote" || section.type === "facebook-testimonial" || section.type === "bullet-box") ? (
            <PresellSection
              section={section}
              ctaText={ctaText}
              onCtaClick={onCtaClick}
              elementId={`section${actualIndex}`}
              isEditing={isEditing}
              onEdit={() => onEditSection?.(actualIndex)}
            />
          ) : (
          <section className="mb-6 md:mb-8 lg:mb-10">
            {section.heading && (
              isEditing ? (
                <RichTextEditor
                  value={section.heading}
                  onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                  onDelete={() => onDeleteSection?.(actualIndex)}
                  className="text-[22px] md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 lg:mb-5 leading-tight"
                  as="h2"
                />
              ) : (
                <h2 
                  className="text-[22px] md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 lg:mb-5 leading-tight"
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
                    className="w-full max-w-full rounded-lg"
                  />
                ) : null}
              </div>
            )}
            
            {section.type !== "cta" && (
              <div className="space-y-3 md:space-y-4 lg:space-y-5">
                {isEditing ? (
                  <RichTextEditor
                    value={section.content}
                    onSave={(value) => handleSectionUpdate(actualIndex, "content", value)}
                    onDelete={() => onDeleteSection?.(actualIndex)}
                    multiline
                    className="text-lg md:text-base lg:text-lg leading-[1.7] md:leading-[1.8] text-foreground/90 break-words"
                    as="p"
                    enableAiOptimize={true}
                  />
                ) : (
                  section.content.split('\n\n').map((paragraph, pIndex) => {
                    const trimmed = paragraph.trim();
                    
                    // Detect bullet points (•, -, *)
                    if (trimmed.match(/^[•\-\*]\s/)) {
                      return (
                        <div key={pIndex} className="flex gap-2 md:gap-3 mb-2 md:mb-3 text-lg md:text-base lg:text-lg leading-[1.7] md:leading-[1.8] text-foreground/90">
                          <span className="flex-shrink-0 font-bold">•</span>
                          <span 
                            className="flex-1 break-words"
                            dangerouslySetInnerHTML={{ 
                              __html: trimmed.replace(/^[•\-\*]\s*/, '')
                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                            }}
                          />
                        </div>
                      );
                    }
                    
                    // Detect numbered lists (1., 2., etc.)
                    const numberMatch = trimmed.match(/^(\d+)\.\s/);
                    if (numberMatch) {
                      return (
                        <div key={pIndex} className="flex gap-2 md:gap-3 mb-2 md:mb-3 text-lg md:text-base lg:text-lg leading-[1.7] md:leading-[1.8] text-foreground/90">
                          <span className="flex-shrink-0 font-bold">{numberMatch[1]}.</span>
                          <span 
                            className="flex-1 break-words"
                            dangerouslySetInnerHTML={{ 
                              __html: trimmed.replace(/^\d+\.\s*/, '')
                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                            }}
                          />
                        </div>
                      );
                    }
                    
                    // Regular paragraph
                    return (
                      <p 
                        key={pIndex} 
                        className="text-lg md:text-base lg:text-lg leading-[1.7] md:leading-[1.8] text-foreground/90 break-words"
                        dangerouslySetInnerHTML={{ 
                          __html: paragraph
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                        }}
                      />
                    );
                  })
                )}
              </div>
            )}
            
            {section.type === "cta" && (
              <div className="my-8 md:my-12 text-center">
                <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-4 md:p-6 lg:p-8">
                  {isEditing && section.heading ? (
                    <RichTextEditor
                      value={section.heading || ""}
                      onSave={(value) => handleSectionUpdate(actualIndex, "heading", value)}
                      className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4"
                      as="h3"
                    />
                  ) : section.heading ? (
                    <h3 
                      className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4"
                      dangerouslySetInnerHTML={{ 
                        __html: (section.heading || "")
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>') 
                      }}
                    />
                  ) : null}
                  {isEditing ? (
                    <Button
                      variant={ctaVariant}
                      size="lg"
                      className="text-sm md:text-base lg:text-lg px-6 md:px-10 py-4 md:py-6 h-auto w-full md:w-auto"
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
                      className="text-sm md:text-base lg:text-lg px-6 md:px-10 py-4 md:py-6 h-auto w-full md:w-auto"
                    >
                      {section.ctaText || ctaText}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>
          )}
          
          {isEditing && onAddSection && onDeleteSection && (
            <SectionControls
              index={actualIndex}
              onAddSectionBelow={(type) => {
                if (type === "text" || type === "image") {
                  onAddSection(actualIndex, type);
                } else if (type === "quote") {
                  onAddSection(actualIndex, "text");
                  setTimeout(() => {
                    onUpdateSection?.(actualIndex + 1, {
                      type: "quote",
                      content: "Enter your quote here...",
                      author: "Author Name",
                      authorRole: "Role or Title",
                      style: "normal"
                    });
                  }, 0);
                } else if (type === "facebook-testimonial") {
                  onAddSection(actualIndex, "text");
                  setTimeout(() => {
                    onUpdateSection?.(actualIndex + 1, {
                      type: "facebook-testimonial",
                      content: "Share your experience here...",
                      author: "User Name",
                      timestamp: "2 days ago",
                      reactions: 0,
                      style: "normal"
                    });
                  }, 0);
                } else if (type === "bullet-box") {
                  onAddSection(actualIndex, "text");
                  setTimeout(() => {
                    onUpdateSection?.(actualIndex + 1, {
                      type: "bullet-box",
                      content: "",
                      heading: "Key Points",
                      items: ["Point 1", "Point 2", "Point 3"],
                      boxColor: "blue",
                      style: "normal"
                    });
                  }, 0);
                } else if (type === "headline") {
                  onAddSection(actualIndex, "text");
                  setTimeout(() => {
                    onUpdateSection?.(actualIndex + 1, {
                      type: "text",
                      content: "",
                      heading: "New Section Heading",
                      style: "normal"
                    });
                  }, 0);
                } else if (type === "cta") {
                  onAddSection(actualIndex, "text");
                  setTimeout(() => {
                    onUpdateSection?.(actualIndex + 1, {
                      type: "cta",
                      content: "",
                      ctaText: ctaText || "Click Here",
                      style: "normal"
                    });
                  }, 0);
                }
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
              {isEditing && onUpdateSubtitle ? (
                <RichTextEditor
                  value={subtitle}
                  onSave={onUpdateSubtitle}
                  className="text-xs md:text-sm text-primary font-semibold uppercase tracking-wider"
                  as="p"
                />
              ) : (
                subtitle
              )}
            </div>
            {isEditing && onUpdateHeadline ? (
              <RichTextEditor
                value={headline || "Discover the Ultimate Guide"}
                onSave={onUpdateHeadline}
                className="text-[25px] md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 leading-tight"
                as="h1"
              />
            ) : (
              <h1 
                className="text-[25px] md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 leading-tight"
                dangerouslySetInnerHTML={{ 
                  __html: (headline || "Discover the Ultimate Guide")
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
                className="text-lg md:text-base lg:text-lg text-muted-foreground leading-relaxed"
                as="p"
              />
            ) : (
              <p 
                className="text-lg md:text-base lg:text-lg text-muted-foreground leading-relaxed"
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
        <DraggableSections
          items={draggableItems}
          onReorder={handleReorder}
          isEditing={isEditing}
        />

        <footer className="mt-10 md:mt-16 pt-6 md:pt-10 border-t border-border text-center">
          <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">Ready to Get Started?</h3>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground mb-4 md:mb-6">Join thousands who have already transformed their lives</p>
          <Button
            variant={ctaVariant}
            size="lg"
            onClick={() => onCtaClick("final_cta")}
            className="text-sm md:text-base lg:text-lg px-8 md:px-12 py-4 md:py-6 h-auto w-full md:w-auto"
          >
            {ctaText}
          </Button>
        </footer>
      </div>
    </article>
  );
};