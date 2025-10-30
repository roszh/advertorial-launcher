import { RichTextEditor } from "@/components/RichTextEditor";
import { InlineImageUpload } from "@/components/InlineImageUpload";
import { SectionControls } from "@/components/SectionControls";
import { DraggableSections } from "@/components/DraggableSections";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { formatMarkdownText } from "@/lib/utils";
import { PresellSection } from "@/components/PresellSection";

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
  onSectionAdd: (afterId: string, type: string) => void;
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
    // Handle CTA/Button sections
    if (section.type === "cta") {
      return (
        <div key={section.id} className="relative group">
          {isEditing && (
            <SectionControls
              index={index + 1}
              onAddSectionBelow={(type) => onSectionAdd(section.id, type)}
              onDeleteSection={() => onSectionDelete(section.id)}
              onCloneSection={onSectionClone ? () => onSectionClone(section.id) : undefined}
            />
          )}
          <div className="flex justify-center my-8">
            {isEditing ? (
              <div className="space-y-2 w-full max-w-md">
                <input
                  type="text"
                  value={section.buttonText || ""}
                  onChange={(e) => onSectionUpdate(section.id, { buttonText: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Button text..."
                />
                <input
                  type="text"
                  value={section.buttonUrl || ""}
                  onChange={(e) => onSectionUpdate(section.id, { buttonUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Button URL..."
                />
                <select
                  value={section.style || "ctaAmazon"}
                  onChange={(e) => onSectionUpdate(section.id, { style: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="ctaAmazon">Amazon Style</option>
                  <option value="ctaAction">Action Style</option>
                  <option value="ctaSubtle">Subtle Style</option>
                </select>
                <Button
                  variant={section.style as any || "ctaAmazon"}
                  size="lg"
                  className="w-full"
                  disabled
                >
                  {section.buttonText || "Click Here"}
                </Button>
              </div>
            ) : (
              <Button
                variant={section.style as any || "ctaAmazon"}
                size="lg"
                onClick={() => {
                  if (section.buttonUrl) {
                    window.open(section.buttonUrl.startsWith('http') ? section.buttonUrl : `https://${section.buttonUrl}`, '_blank');
                  }
                }}
                className="min-w-[200px]"
              >
                {section.buttonText || "Click Here"}
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Handle special section types (quote, testimonial, bullet-box, update)
    if (["quote", "facebook-testimonial", "bullet-box", "update"].includes(section.type)) {
      return (
        <div key={section.id} className="relative group">
          {isEditing && (
            <SectionControls
              index={index + 1}
              onAddSectionBelow={(type) => onSectionAdd(section.id, type)}
              onDeleteSection={() => onSectionDelete(section.id)}
              onCloneSection={onSectionClone ? () => onSectionClone(section.id) : undefined}
            />
          )}
          <PresellSection
            section={section as any}
            ctaText={ctaText}
            onCtaClick={() => {}}
            isEditing={false}
          />
        </div>
      );
    }

    // Handle list-item sections
    if (section.type === "list-item") {
      return (
        <div key={section.id} className="relative group">
          {isEditing && (
            <SectionControls
              index={index + 1}
              onAddSectionBelow={(type) => onSectionAdd(section.id, type)}
              onDeleteSection={() => onSectionDelete(section.id)}
              onCloneSection={onSectionClone ? () => onSectionClone(section.id) : undefined}
            />
          )}
          <div className="mb-12 bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={section.heading || ""}
                      onChange={(e) => onSectionUpdate(section.id, { heading: e.target.value })}
                      className="w-full text-2xl font-bold bg-transparent border-b-2 border-primary/20 focus:border-primary outline-none pb-2"
                      placeholder="List item heading..."
                    />
                    <RichTextEditor
                      value={section.content}
                      onSave={(content) => onSectionUpdate(section.id, { content })}
                      multiline
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold mb-3 text-foreground">
                      {section.heading}
                    </h3>
                    <div
                      className="prose prose-lg max-w-none text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </>
                )}
                {section.imageUrl && (
                  <div className="mt-4">
                    {isEditing ? (
                      <InlineImageUpload
                        currentImageUrl={section.imageUrl}
                        onImageUploaded={(url) => onSectionUpdate(section.id, { imageUrl: url })}
                        userId={userId}
                      />
                    ) : (
                      <img
                        src={section.imageUrl}
                        alt={section.heading || ""}
                        className="w-full rounded-lg shadow-md"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle image sections
    if (section.type === "image") {
      return (
        <div key={section.id} className="relative group mb-8">
          {isEditing && (
            <SectionControls
              index={index + 1}
              onAddSectionBelow={(type) => onSectionAdd(section.id, type)}
              onDeleteSection={() => onSectionDelete(section.id)}
              onCloneSection={onSectionClone ? () => onSectionClone(section.id) : undefined}
            />
          )}
          {isEditing ? (
            <InlineImageUpload
              currentImageUrl={section.imageUrl}
              onImageUploaded={(url) => onSectionUpdate(section.id, { imageUrl: url })}
              userId={userId}
            />
          ) : (
            section.imageUrl && (
              <img
                src={section.imageUrl}
                alt={section.heading || "Section image"}
                className="w-full rounded-lg shadow-md"
              />
            )
          )}
        </div>
      );
    }

    // Handle text sections (including headlines)
    if (section.type === "text") {
      const isHeadline = section.heading || section.style === "emphasized";
      
      return (
        <div key={section.id} className="relative group mb-8">
          {isEditing && (
            <SectionControls
              index={index + 1}
              onAddSectionBelow={(type) => onSectionAdd(section.id, type)}
              onDeleteSection={() => onSectionDelete(section.id)}
              onCloneSection={onSectionClone ? () => onSectionClone(section.id) : undefined}
            />
          )}
          {isHeadline && section.heading && !isEditing && (
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              {section.heading}
            </h2>
          )}
          {isEditing && isHeadline && (
            <input
              type="text"
              value={section.heading || ""}
              onChange={(e) => onSectionUpdate(section.id, { heading: e.target.value })}
              className="w-full text-3xl font-bold bg-transparent border-b-2 border-primary/20 focus:border-primary outline-none pb-2 mb-4"
              placeholder="Headline text..."
            />
          )}
          {isEditing ? (
            <RichTextEditor
              value={section.content}
              onSave={(content) => onSectionUpdate(section.id, { content })}
              multiline
            />
          ) : (
            <div
              className="prose prose-lg max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: section.content }}
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
                  onAddSectionBelow={(type) => onSectionAdd(heroSection.id, type)}
                  onDeleteSection={() => onSectionDelete(heroSection.id)}
                  onCloneSection={onSectionClone ? () => onSectionClone(heroSection.id) : undefined}
                />
              </>
            ) : (
              <>
                <h1 
                  className="text-4xl font-bold mb-6 text-foreground"
                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(heroSection.heading || "") }}
                />
                <div 
                  className="text-lg text-muted-foreground max-w-3xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(heroSection.content || "") }}
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
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(finalCtaSection.heading || "") }}
                  />
                  <div 
                    className="text-base text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(finalCtaSection.content || "") }}
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
                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(finalCtaSection.buttonText || "") }}
                />
              </div>
            )}

            {isEditing && (
              <SectionControls
                index={sections.indexOf(finalCtaSection)}
                onAddSectionBelow={(type) => onSectionAdd(finalCtaSection.id, type)}
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
