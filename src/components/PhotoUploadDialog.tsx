import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PhotoEditor } from "./PhotoEditor";
import { enhancedDocumentService } from "@/services/enhancedDocumentService";

interface PhotoUploadDialogProps {
  entityId: string;
  entityType: 'lead' | 'project' | 'customer';
  onUploadComplete?: () => void;
  triggerButton?: React.ReactNode;
  customerInfo?: { firstName: string; lastName: string; };
  forceCustomerFacing?: boolean;
}

export const PhotoUploadDialog = ({ 
  entityId, 
  entityType, 
  onUploadComplete,
  triggerButton,
  customerInfo,
  forceCustomerFacing = false
}: PhotoUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Generate preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Generate default photo name
    const customerName = customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}`.trim() : 'Photo';
    const timestamp = new Date().toLocaleDateString();
    setPhotoName(`${customerName} - ${timestamp}`);
  };

  const handleDirectUpload = async () => {
    if (!selectedFile || !photoName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter a name",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const renamedFile = new File([selectedFile], `${photoName.trim()}.jpg`, { 
        type: selectedFile.type 
      });

      if (entityType === 'lead') {
        await enhancedDocumentService.uploadLeadDocument(
          entityId,
          renamedFile,
          renamedFile.name,
          forceCustomerFacing,
          photoNotes.trim()
        );
      } else if (entityType === 'customer') {
        await enhancedDocumentService.uploadCustomerDocument(
          entityId,
          renamedFile,
          renamedFile.name,
          forceCustomerFacing,
          photoNotes.trim()
        );
      } else {
        await enhancedDocumentService.uploadProjectDocument(
          entityId,
          renamedFile,
          renamedFile.name,
          forceCustomerFacing,
          photoNotes.trim()
        );
      }

      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      });

      handleClose();
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditorSave = async (editedBlob: Blob, fileName: string) => {
    if (!photoName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a name for the photo",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const editedFile = new File([editedBlob], `${photoName.trim()}.jpg`, { 
        type: 'image/jpeg' 
      });

      if (entityType === 'lead') {
        await enhancedDocumentService.uploadLeadDocument(
          entityId,
          editedFile,
          editedFile.name,
          forceCustomerFacing,
          photoNotes.trim()
        );
      } else if (entityType === 'customer') {
        await enhancedDocumentService.uploadCustomerDocument(
          entityId,
          editedFile,
          editedFile.name,
          forceCustomerFacing,
          photoNotes.trim()
        );
      } else {
        await enhancedDocumentService.uploadProjectDocument(
          entityId,
          editedFile,
          editedFile.name,
          forceCustomerFacing,
          photoNotes.trim()
        );
      }

      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      });

      handleClose();
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowEditor(false);
    setSelectedFile(null);
    setPhotoName("");
    setPhotoNotes("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Upload className="h-4 w-4 mr-2" />
      Upload Photo
    </Button>
  );

  return (
    <>
      <Dialog open={isOpen && !showEditor} onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}>
        <DialogTrigger asChild>
          {triggerButton || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Upload Photo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo-file">Select Photo</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click to select a photo from your device
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports JPG, PNG, WebP
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="photo-name">Photo Name</Label>
              <Input
                id="photo-name"
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                placeholder="Enter a name for this photo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-notes">Notes (Optional)</Label>
              <Textarea
                id="photo-notes"
                value={photoNotes}
                onChange={(e) => setPhotoNotes(e.target.value)}
                placeholder="Add any notes about this photo..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              {selectedFile && (
                <>
                  <Button 
                    onClick={() => setShowEditor(true)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Edit First
                  </Button>
                  <Button 
                    onClick={handleDirectUpload} 
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditor && previewUrl && (
        <PhotoEditor
          imageUrl={previewUrl}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
          originalFileName={photoName}
        />
      )}
    </>
  );
};