import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InlineImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  userId: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
}

export const InlineImageUpload = ({ 
  currentImageUrl, 
  onImageUploaded, 
  userId,
  className,
  aspectRatio = "video"
}: InlineImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(fileName, file);

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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      
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
                <p className="text-xs mt-1">Max 5MB • JPG, PNG, WebP</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};