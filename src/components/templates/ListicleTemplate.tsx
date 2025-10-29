import { RichTextEditor } from "@/components/RichTextEditor";
import { InlineImageUpload } from "@/components/InlineImageUpload";
import { SectionControls } from "@/components/SectionControls";
import { DraggableSections } from "@/components/DraggableSections";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Section {
  id: string;
  type: string;
  content: string;
  heading?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  items?: string[];
  [key: string]: any;
}

interface ListicleTemplateProps {
  sections: Section[];
  onSectionUpdate: (id: string, updates: Partial<Section>) => void;
  onSectionDelete: (id: string) => void;
  onSectionAdd: (afterId: string) => void;
  onSectionsReorder: (sections: Section[]) => void;
  isEditing: boolean;
  ctaText: string;
  ctaUrl: string;
  onSectionClone?: (id: string) => void;
  userId?: string;
}

export const ListicleTemplate = ({
  sections,
  onSectionUpdate,
  onSectionDelete,
  onSectionAdd,
  onSectionsReorder,
  isEditing,
  ctaText,
  ctaUrl,
  onSectionClone,
  userId = "",
}: ListicleTemplateProps) => {

  const heroSection = sections.find(s => s.type === "hero");
  const bodySections = sections.filter(s => s.type !== "hero" && s.type !== "final-cta");
  const finalCtaSection = sections.find(s => s.type === "final-cta");

  const handleCtaClick = () => {
    if (ctaUrl) {
      window.open(ctaUrl.startsWith('http') ? ctaUrl : `https://${ctaUrl}`, '_blank');
    }
  };

  const renderBodySection = (section: Section, index: number) => {
    if (section.type === "list-item") {
      return (
        <div key={section.id} className="mb-16 group relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Image */}
            <div className="w-full md:w-1/3 flex-shrink-0">
              {isEditing ? (
                <InlineImageUpload
                  currentImageUrl={section.imageUrl}
                  onImageUploaded={(url) => onSectionUpdate(section.id, { imageUrl: url })}
                  userId={userId}
                  aspectRatio="square"
                />
              ) : (
                section.imageUrl && (
                  <img
                    src={section.imageUrl}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                )
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              {isEditing ? (
                <>
                  <RichTextEditor
                    value={section.heading || ""}
                    onSave={(value) => onSectionUpdate(section.id, { heading: value })}
                    as="h2"
                    className="text-2xl font-bold mb-4"
                  />
                  <RichTextEditor
                    value={section.content || ""}
                    onSave={(value) => onSectionUpdate(section.id, { content: value })}
                    multiline
                    className="text-base text-muted-foreground"
                  />
                </>
              ) : (
                <>
                  <h2 
                    className="text-2xl font-bold mb-4 text-foreground"
                    dangerouslySetInnerHTML={{ __html: section.heading || "" }}
                  />
                  <div 
                    className="text-base text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: section.content || "" }}
                  />
                </>
              )}
            </div>
          </div>
          
          {isEditing && (
            <SectionControls
              index={index}
              onAddSectionBelow={(type) => onSectionAdd(section.id)}
              onDeleteSection={() => onSectionDelete(section.id)}
              onCloneSection={onSectionClone ? () => onSectionClone(section.id) : undefined}
            />
          )}
        </div>
      );
    }

    if (section.type === "text") {
      return (
        <div key={section.id} className="mb-12 group relative">
          {isEditing ? (
            <RichTextEditor
              value={section.content || ""}
              onSave={(value) => onSectionUpdate(section.id, { content: value })}
              multiline
              className="prose prose-lg max-w-none"
            />
          ) : (
            <div 
              className="prose prose-lg max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: section.content || "" }}
            />
          )}
          
          {isEditing && (
            <SectionControls
              index={index}
              onAddSectionBelow={(type) => onSectionAdd(section.id)}
              onDeleteSection={() => onSectionDelete(section.id)}
              onCloneSection={onSectionClone ? () => onSectionClone(section.id) : undefined}
            />
          )}
        </div>
      );
    }

    return null;
  };

  const bodyItems = bodySections.map((section, index) => ({
    id: section.id,
    content: renderBodySection(section, index + 1)
  }));

  return (
    <article className="min-h-screen bg-background">
      {/* Hero Section */}
      {heroSection && (
        <div className="relative border-b border-border group">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            {isEditing ? (
              <>
                <RichTextEditor
                  value={heroSection.heading || ""}
                  onSave={(value) => onSectionUpdate(heroSection.id, { heading: value })}
                  as="h1"
                  className="text-4xl font-bold mb-6"
                />
                <RichTextEditor
                  value={heroSection.content || ""}
                  onSave={(value) => onSectionUpdate(heroSection.id, { content: value })}
                  multiline
                  className="text-lg text-muted-foreground"
                />
                <SectionControls
                  index={0}
                  onAddSectionBelow={(type) => onSectionAdd(heroSection.id)}
                  onDeleteSection={() => onSectionDelete(heroSection.id)}
                  onCloneSection={onSectionClone ? () => onSectionClone(heroSection.id) : undefined}
                />
              </>
            ) : (
              <>
                <h1 
                  className="text-4xl font-bold mb-6 text-foreground"
                  dangerouslySetInnerHTML={{ __html: heroSection.heading || "" }}
                />
                <div 
                  className="text-lg text-muted-foreground max-w-3xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: heroSection.content || "" }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* List Items */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isEditing ? (
          <DraggableSections
            items={bodyItems}
            onReorder={(newOrder) => {
              const reordered = newOrder.map(id => bodySections.find(s => s.id === id)!).filter(Boolean);
              const newSections = [
                ...(heroSection ? [heroSection] : []),
                ...reordered,
                ...(finalCtaSection ? [finalCtaSection] : []),
              ];
              onSectionsReorder(newSections);
            }}
            isEditing={isEditing}
          />
        ) : (
          bodyItems.map(item => item.content)
        )}
      </div>

      {/* Final CTA Box */}
      {finalCtaSection && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="border-4 border-dashed border-primary p-8 rounded-lg bg-card group relative">
            <div className="text-center mb-6">
              {isEditing ? (
                <>
                  <RichTextEditor
                    value={finalCtaSection.heading || ""}
                    onSave={(value) => onSectionUpdate(finalCtaSection.id, { heading: value })}
                    as="h2"
                    className="text-3xl font-bold mb-2"
                  />
                  <RichTextEditor
                    value={finalCtaSection.content || ""}
                    onSave={(value) => onSectionUpdate(finalCtaSection.id, { content: value })}
                    multiline
                    className="text-base text-muted-foreground"
                  />
                </>
              ) : (
                <>
                  <h2 
                    className="text-3xl font-bold mb-2 text-foreground"
                    dangerouslySetInnerHTML={{ __html: finalCtaSection.heading || "" }}
                  />
                  <div 
                    className="text-base text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: finalCtaSection.content || "" }}
                  />
                </>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
              {/* CTA Image */}
              <div className="w-full md:w-1/3">
                {isEditing ? (
                  <InlineImageUpload
                    currentImageUrl={finalCtaSection.imageUrl}
                    onImageUploaded={(url) => onSectionUpdate(finalCtaSection.id, { imageUrl: url })}
                    userId={userId}
                    aspectRatio="square"
                  />
                ) : (
                  finalCtaSection.imageUrl && (
                    <img
                      src={finalCtaSection.imageUrl}
                      alt="Special offer"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  )
                )}
              </div>

              {/* Bullet Points */}
              <div className="flex-1 space-y-3">
                {isEditing ? (
                  <RichTextEditor
                    value={finalCtaSection.items?.join('\n') || ""}
                    onSave={(value) => {
                      const items = value.split('\n').filter(item => item.trim());
                      onSectionUpdate(finalCtaSection.id, { items });
                    }}
                    multiline
                    className="text-sm"
                  />
                ) : (
                  finalCtaSection.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="text-base font-medium text-foreground">{item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CTA Button */}
            {!isEditing && ctaUrl && (
              <div className="text-center">
                <Button 
                  onClick={handleCtaClick}
                  size="lg"
                  className="w-full md:w-auto px-12 py-6 text-lg font-bold mb-4"
                >
                  {ctaText || "Get Started Now"}
                </Button>
                <div 
                  className="text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: finalCtaSection.buttonText || "" }}
                />
              </div>
            )}

            {isEditing && (
              <SectionControls
                index={sections.indexOf(finalCtaSection)}
                onAddSectionBelow={(type) => onSectionAdd(finalCtaSection.id)}
                onDeleteSection={() => onSectionDelete(finalCtaSection.id)}
                onCloneSection={onSectionClone ? () => onSectionClone(finalCtaSection.id) : undefined}
              />
            )}
          </div>
        </div>
      )}

      {/* Bottom CTA Button */}
      {!isEditing && ctaUrl && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Button 
            onClick={handleCtaClick}
            size="lg"
            className="w-full py-6 text-lg font-bold"
          >
            {ctaText || "Get Started Now"}
          </Button>
        </div>
      )}
    </article>
  );
};
