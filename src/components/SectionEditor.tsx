import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Save, X, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { InlineImageUpload } from "./InlineImageUpload";
import { cn, stripHtmlTags } from "@/lib/utils";

interface Section {
  type: "hero" | "text" | "image" | "cta" | "benefits" | "testimonial" | "quote" | "facebook-testimonial" | "bullet-box" | "list-item" | "final-cta" | "update";
  content: string;
  heading?: string;
  imagePosition?: "left" | "right" | "full" | "none";
  style?: "normal" | "emphasized" | "callout";
  imageUrl?: string;
  imageAspectRatio?: "video" | "square";
  imageLinksToUrl?: boolean;
  ctaText?: string;
  author?: string;
  authorRole?: string;
  authorAvatar?: string;
  timestamp?: string;
  reactions?: number;
  items?: string[];
  boxColor?: "green" | "blue" | "purple" | "yellow";
  buttonText?: string;
  buttonUrl?: string;
  updateDate?: string;
}

interface SectionEditorProps {
  section: Section;
  index: number;
  totalSections: number;
  onSave: (section: Section) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCancel: () => void;
  userId: string;
}

export const SectionEditor = ({
  section,
  index,
  totalSections,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCancel,
  userId,
}: SectionEditorProps) => {
  const [editedSection, setEditedSection] = useState<Section>(section);

  const handleSave = () => {
    // Strip HTML tags to ensure clean markdown storage
    const cleanedSection = {
      ...editedSection,
      content: stripHtmlTags(editedSection.content),
      heading: editedSection.heading ? stripHtmlTags(editedSection.heading) : editedSection.heading,
    };
    onSave(cleanedSection);
  };

  return (
    <div className="border-2 border-primary/50 rounded-lg p-6 bg-background/95 backdrop-blur space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">
          Edit Section {index + 1} ({section.type})
        </h3>
        <div className="flex gap-2">
          {index > 0 && (
            <Button size="sm" variant="outline" onClick={onMoveUp}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
          {index < totalSections - 1 && (
            <Button size="sm" variant="outline" onClick={onMoveDown}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {section.heading !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Heading</label>
            <Input
              value={editedSection.heading || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, heading: e.target.value })
              }
              placeholder="Enter heading..."
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Content</label>
          <Textarea
            value={editedSection.content}
            onChange={(e) =>
              setEditedSection({ ...editedSection, content: e.target.value })
            }
            placeholder="Enter content..."
            className="min-h-[150px]"
          />
        </div>

        {section.imagePosition && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Image Position</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={editedSection.imagePosition}
                onChange={(e) =>
                  setEditedSection({
                    ...editedSection,
                    imagePosition: e.target.value as any,
                  })
                }
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="full">Full</option>
                <option value="none">None</option>
              </select>
            </div>

            {editedSection.imagePosition !== "none" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Section Image</label>
                <InlineImageUpload
                  currentImageUrl={editedSection.imageUrl || ""}
                  onImageUploaded={(url) =>
                    setEditedSection({ ...editedSection, imageUrl: url })
                  }
                  userId={userId}
                  aspectRatio={editedSection.imageAspectRatio || (editedSection.imagePosition === "full" ? "wide" : "video")}
                  showAspectRatioSelector={editedSection.imagePosition !== "full"}
                  onAspectRatioChange={(ratio) =>
                    setEditedSection({ ...editedSection, imageAspectRatio: ratio })
                  }
                />
                {editedSection.imageUrl && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="imageLinksToUrl"
                        checked={editedSection.imageLinksToUrl || false}
                        onChange={(e) =>
                          setEditedSection({ ...editedSection, imageLinksToUrl: e.target.checked })
                        }
                        className="rounded border-input"
                      />
                      <label htmlFor="imageLinksToUrl" className="text-sm cursor-pointer">
                        Link image to CTA URL
                      </label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditedSection({ ...editedSection, imageUrl: "" })}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {section.style && (
          <div>
            <label className="text-sm font-medium mb-2 block">Style</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={editedSection.style}
              onChange={(e) =>
                setEditedSection({
                  ...editedSection,
                  style: e.target.value as any,
                })
              }
            >
              <option value="normal">Normal</option>
              <option value="emphasized">Emphasized</option>
              <option value="callout">Callout</option>
            </select>
          </div>
        )}

        {section.author !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Author</label>
            <Input
              value={editedSection.author || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, author: e.target.value })
              }
              placeholder="Author name..."
            />
          </div>
        )}

        {section.authorRole !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Author Role</label>
            <Input
              value={editedSection.authorRole || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, authorRole: e.target.value })
              }
              placeholder="Author role..."
            />
          </div>
        )}

        {section.type === "facebook-testimonial" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Profile Photo</label>
            <InlineImageUpload
              currentImageUrl={editedSection.authorAvatar || ""}
              onImageUploaded={(url) =>
                setEditedSection({ ...editedSection, authorAvatar: url })
              }
              userId={userId}
              aspectRatio="square"
              className="max-w-[200px]"
            />
            {editedSection.authorAvatar && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditedSection({ ...editedSection, authorAvatar: "" })}
                >
                  Remove Photo
                </Button>
              </div>
            )}
          </div>
        )}

        {section.timestamp !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Timestamp</label>
            <Input
              value={editedSection.timestamp || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, timestamp: e.target.value })
              }
              placeholder="e.g. 2 days ago"
            />
          </div>
        )}

        {section.reactions !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Reactions</label>
            <Input
              type="number"
              value={editedSection.reactions || 0}
              onChange={(e) =>
                setEditedSection({ ...editedSection, reactions: parseInt(e.target.value) || 0 })
              }
              placeholder="Number of reactions"
            />
          </div>
        )}

        {section.updateDate !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Update Date</label>
            <Input
              value={editedSection.updateDate || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, updateDate: e.target.value })
              }
              placeholder="e.g. September 14, 2021"
            />
          </div>
        )}

        {section.items !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Bullet Points</label>
            <Textarea
              value={editedSection.items?.join("\n") || ""}
              onChange={(e) =>
                setEditedSection({ 
                  ...editedSection, 
                  items: e.target.value.split("\n").filter(i => i.trim()) 
                })
              }
              placeholder="Enter one bullet point per line..."
              className="min-h-[100px]"
            />
          </div>
        )}

        {section.boxColor !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">Box Color</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={editedSection.boxColor}
              onChange={(e) =>
                setEditedSection({
                  ...editedSection,
                  boxColor: e.target.value as any,
                })
              }
            >
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="yellow">Yellow</option>
            </select>
          </div>
        )}

        {section.ctaText !== undefined && (
          <div>
            <label className="text-sm font-medium mb-2 block">CTA Button Text</label>
            <Input
              value={editedSection.ctaText || ""}
              onChange={(e) =>
                setEditedSection({ ...editedSection, ctaText: e.target.value })
              }
              placeholder="Button text..."
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
};
