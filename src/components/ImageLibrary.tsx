import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, Upload, Trash2, Check, Filter } from "lucide-react";
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

interface Tag {
  id: string;
  name: string;
  color: string;
}

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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  // Fetch available tags
  const { data: tags } = useQuery({
    queryKey: ["tags", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      
      if (error) throw error;
      return data as Tag[];
    },
  });

  // Fetch images from library with tag filtering
  const { data: images, isLoading } = useQuery({
    queryKey: ['image-library', userId, selectedTagIds],
    queryFn: async () => {
      // If tags are selected, filter by page tags
      if (selectedTagIds.length > 0) {
        // Get all page IDs that have any of the selected tags
        const { data: pageIds, error: pageError } = await supabase
          .from("page_tags")
          .select("page_id")
          .in("tag_id", selectedTagIds);

        if (pageError) throw pageError;
        
        const uniquePageIds = [...new Set(pageIds?.map(pt => pt.page_id) || [])];
        
        if (uniquePageIds.length === 0) {
          return []; // No pages with selected tags
        }

        // Get images from those pages
        const { data, error } = await supabase
          .from('image_library')
          .select('*')
          .eq('user_id', userId)
          .in('page_id', uniquePageIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      }

      // No filter - get all images
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

      // Save to image library (without page_id when uploading from library page)
      const { error: dbError } = await supabase
        .from('image_library')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          filename: file.name,
          file_size: file.size,
          page_id: null // Images uploaded from library page are not associated with a specific page
        });

      if (dbError) throw dbError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-library'] });
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
      queryClient.invalidateQueries({ queryKey: ['image-library'] });
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

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
        <div className="flex items-center gap-2">
          {tags && tags.length > 0 && (
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {selectedTagIds.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTagIds.length}
                </Badge>
              )}
            </Button>
          )}
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
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {showFilters && tags && tags.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">Filter by page tags:</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                style={{ 
                  backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined,
                  cursor: "pointer"
                }}
                variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                className="transition-all hover:scale-105"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          {selectedTagIds.length > 0 && (
            <Button
              onClick={() => setSelectedTagIds([])}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

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
          <p className="text-muted-foreground mb-4">
            {selectedTagIds.length > 0 
              ? "No images found with the selected tags" 
              : "No images in your library yet"
            }
          </p>
          {selectedTagIds.length > 0 ? (
            <Button
              variant="outline"
              onClick={() => setSelectedTagIds([])}
            >
              Clear filters
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => document.getElementById('library-upload')?.click()}
              disabled={uploading}
            >
              Upload Your First Image
            </Button>
          )}
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