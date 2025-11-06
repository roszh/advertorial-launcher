import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2, Upload, Trash2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageLibraryProps {
  userId: string;
  onImageSelect?: (imageUrl: string) => void;
  selectionMode?: boolean;
  selectedImageUrl?: string;
}

export const ImageLibrary = ({ 
  userId, 
  onImageSelect, 
  selectionMode = false,
  selectedImageUrl 
}: ImageLibraryProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch images from library
  const { data: images, isLoading } = useQuery({
    queryKey: ['image-library', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('image_library')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Compress image
      const compressedBlob = await compressImage(file);
      
      // Upload to storage
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(fileName, compressedBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('page-images')
        .getPublicUrl(fileName);

      // Save to image library
      const { error: dbError } = await supabase
        .from('image_library')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          filename: file.name,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-library', userId] });
      toast({ title: "Image added to library!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const image = images?.find(img => img.id === imageId);
      if (!image) throw new Error("Image not found");

      // Extract filename from URL
      const urlParts = image.image_url.split('/');
      const fileName = urlParts.slice(-2).join('/'); // user_id/filename

      // Delete from storage
      await supabase.storage
        .from('page-images')
        .remove([fileName]);

      // Delete from database
      const { error } = await supabase
        .from('image_library')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-library', userId] });
      toast({ title: "Image deleted from library" });
      setImageToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Delete failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Image Library</h3>
          <p className="text-sm text-muted-foreground">
            {images?.length || 0} images • Upload once, reuse everywhere
          </p>
        </div>
        <div>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="library-upload"
          />
          <Button
            onClick={() => document.getElementById('library-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </>
            )}
          </Button>
        </div>
      </div>

      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card 
              key={image.id} 
              className={`relative group overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                selectionMode && selectedImageUrl === image.image_url 
                  ? 'ring-2 ring-primary' 
                  : ''
              }`}
              onClick={() => onImageSelect?.(image.image_url)}
            >
              <div className="aspect-video relative">
                <img
                  src={image.image_url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
                {selectionMode && selectedImageUrl === image.image_url && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                      <Check className="h-6 w-6" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageToDelete(image.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate" title={image.filename}>
                  {image.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No images in your library yet</p>
          <Button
            variant="outline"
            onClick={() => document.getElementById('library-upload')?.click()}
            disabled={uploading}
          >
            Upload Your First Image
          </Button>
        </div>
      )}

      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image from your library. Pages using this image may no longer display it correctly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => imageToDelete && deleteMutation.mutate(imageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};