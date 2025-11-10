import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn, compressImage } from "@/lib/utils";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImageLibrary } from "./ImageLibrary";

interface InlineImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  userId: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
  onAspectRatioChange?: (ratio: "video" | "square") => void;
  showAspectRatioSelector?: boolean;
  pageId?: string; // Optional: to track which page the image was uploaded from
}

export const InlineImageUpload = ({ 
  currentImageUrl, 
  onImageUploaded, 
  userId,
  className,
  aspectRatio = "video",
  onAspectRatioChange,
  showAspectRatioSelector = false,
  pageId
}: InlineImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClasses = {
    video: "aspect-video",
    square: "aspect-square",
    wide: "aspect-[21/9]"
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      toast({ title: "Image must be less than 1MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Compress image client-side
      const compressedBlob = await compressImage(file);
      
      // Create a unique file name
      const fileName = `${userId}/${Date.now()}.webp`;

      // Upload compressed image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(fileName, compressedBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('page-images')
        .getPublicUrl(fileName);

      // Optimize the image
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageUrl: publicUrl }),
        }
      );

      let finalUrl = publicUrl;

      if (response.ok) {
        const { optimizedUrl } = await response.json();
        
        // If we got a base64 optimized image, upload it again
        if (optimizedUrl.startsWith('data:image')) {
          const base64Response = await fetch(optimizedUrl);
          const blob = await base64Response.blob();
          
          const optimizedFileName = `${userId}/optimized-${Date.now()}.webp`;
          const { error: optimizedUploadError } = await supabase.storage
            .from('page-images')
            .upload(optimizedFileName, blob);

          if (optimizedUploadError) throw optimizedUploadError;

          const { data: { publicUrl: optimizedPublicUrl } } = supabase.storage
            .from('page-images')
            .getPublicUrl(optimizedFileName);

          finalUrl = optimizedPublicUrl;
          
          // Delete the original unoptimized image
          await supabase.storage.from('page-images').remove([fileName]);
        } else {
          finalUrl = optimizedUrl;
        }
      }

      setImageUrl(finalUrl);
      onImageUploaded(finalUrl);
      
      // Save to image library with page_id
      const { error: libraryError } = await supabase
        .from('image_library')
        .insert({
          user_id: userId,
          filename: file.name,
          image_url: finalUrl,
          file_size: file.size,
          page_id: pageId || null // Associate with page if pageId is provided
        });

      if (libraryError) {
        console.error("Error saving to library:", libraryError);
      }
      
      toast({ title: "Image uploaded and optimized!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Error uploading image", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleLibrarySelect = (url: string) => {
    setImageUrl(url);
    onImageUploaded(url);
    setLibraryOpen(false);
    toast({ title: "Image selected from library" });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="space-y-2">
        <div 
          onClick={handleClick}
          className={cn(
            "relative w-full overflow-hidden rounded-lg cursor-pointer group",
            aspectRatioClasses[aspectRatio],
            className
          )}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Section image"
                className="w-full h-full object-cover transition-all group-hover:brightness-75"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">Click to change image</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-xs mt-1">Max 1MB • JPG, PNG, WebP</p>
                </div>
              )}
            </div>
          )}
        </div>

        {showAspectRatioSelector && onAspectRatioChange && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={aspectRatio === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => onAspectRatioChange("video")}
              className="flex-1"
            >
              16:9
            </Button>
            <Button
              type="button"
              variant={aspectRatio === "square" ? "default" : "outline"}
              size="sm"
              onClick={() => onAspectRatioChange("square")}
              className="flex-1"
            >
              1:1
            </Button>
          </div>
        )}

        <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" type="button">
              <ImageIcon className="mr-2 h-4 w-4" />
              Choose from Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select from Image Library</DialogTitle>
            </DialogHeader>
            <ImageLibrary 
              userId={userId} 
              onImageSelect={handleLibrarySelect}
              selectionMode={true}
              selectedImageUrl={imageUrl}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};