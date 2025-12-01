import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import fulfordBuilding from "@/assets/projects/fulford-building.png";

interface CoverPhotoManagerProps {
  projectId: string;
  currentCoverPhoto?: string;
  onCoverPhotoUpdate?: (url: string) => void;
  isCustomerView?: boolean;
}

export const CoverPhotoManager = ({ 
  projectId, 
  currentCoverPhoto, 
  onCoverPhotoUpdate,
  isCustomerView = true 
}: CoverPhotoManagerProps) => {
  const [coverPhoto, setCoverPhoto] = useState(currentCoverPhoto || fulfordBuilding);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-photo-${projectId}-${Date.now()}.${fileExt}`;
      const filePath = `projects/${projectId}/cover-photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-gallery')
        .getPublicUrl(filePath);

      const newCoverPhotoUrl = urlData.publicUrl;

      // Update project cover photo in database
      const { error: updateError } = await supabase
        .from('projects')
        .update({ cover_photo_url: newCoverPhotoUrl } as any)
        .eq('id', projectId);

      if (updateError) throw updateError;

      setCoverPhoto(newCoverPhotoUrl);
      onCoverPhotoUpdate?.(newCoverPhotoUrl);
      setIsDialogOpen(false);
      toast.success("Cover photo updated successfully!");
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast.error("Failed to update cover photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetAsCoverPhoto = async (imageUrl: string) => {
    try {
      // Update project cover photo in database
      const { error } = await supabase
        .from('projects')
        .update({ cover_photo_url: imageUrl } as any)
        .eq('id', projectId);

      if (error) throw error;

      setCoverPhoto(imageUrl);
      onCoverPhotoUpdate?.(imageUrl);
      toast.success("Cover photo updated!");
    } catch (error) {
      console.error('Error setting cover photo:', error);
      toast.error("Failed to update cover photo");
    }
  };

  return (
    <div className="relative">
      <Card className="overflow-hidden">
        <div className="relative h-48 sm:h-64 md:h-80 group">
          <img 
            src={coverPhoto} 
            alt="Project Cover Photo" 
            className="w-full h-full object-cover transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Upload/Change Button */}
          {isCustomerView && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 hover:bg-white text-gray-900 backdrop-blur-sm"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Cover Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Cover Photo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Upload a new image to personalize your project cover photo.
                    </p>
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Choose New Photo"}
                    </Button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Export function to be used by photo gallery
export const setCoverPhotoFromGallery = async (projectId: string, imageUrl: string) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ cover_photo_url: imageUrl } as any)
      .eq('id', projectId);

    if (error) throw error;
    toast.success("Cover photo updated!");
    return true;
  } catch (error) {
    console.error('Error setting cover photo:', error);
    toast.error("Failed to update cover photo");
    return false;
  }
};