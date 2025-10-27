import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Save, X, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
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

interface SectionEditorProps {
  section: Section;
  index: number;
  totalSections: number;
  onSave: (section: Section) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCancel: () => void;
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
}: SectionEditorProps) => {
  const [editedSection, setEditedSection] = useState<Section>(section);

  const handleSave = () => {
    onSave(editedSection);
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
