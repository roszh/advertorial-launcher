import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  userId: string;
}

export const ImageUpload = ({ currentImageUrl, onImageUploaded, userId }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

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
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      if (response.ok) {
        const { optimizedUrl } = await response.json();
        
        // If we got a base64 optimized image, we need to upload it again
        if (optimizedUrl.startsWith('data:image')) {
          // Convert base64 to blob
          const base64Response = await fetch(optimizedUrl);
          const blob = await base64Response.blob();
          
          const optimizedFileName = `${userId}/optimized-${Date.now()}.webp`;
          const { error: optimizedUploadError } = await supabase.storage
            .from('page-images')
            .upload(optimizedFileName, blob);

          if (optimizedUploadError) throw optimizedUploadError;

          const { data: { publicUrl: finalUrl } } = supabase.storage
            .from('page-images')
            .getPublicUrl(optimizedFileName);

          setPreviewUrl(finalUrl);
          onImageUploaded(finalUrl);
          
          // Delete the original unoptimized image
          await supabase.storage.from('page-images').remove([fileName]);
        } else {
          setPreviewUrl(optimizedUrl);
          onImageUploaded(optimizedUrl);
        }
      } else {
        // If optimization fails, use the original
        setPreviewUrl(publicUrl);
        onImageUploaded(publicUrl);
      }

      toast({ title: "Image uploaded successfully!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Error uploading image", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageUploaded("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {previewUrl ? "Change Image" : "Upload Image"}
              </>
            )}
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {previewUrl && (
        <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-border">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto object-cover"
          />
        </div>
      )}
    </div>
  );
};
