import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { enhancedDocumentService } from "@/services/enhancedDocumentService";

interface DocumentUploadDialogProps {
  entityId: string;
  entityType: 'lead' | 'project' | 'customer';
  onUploadComplete?: () => void;
  triggerButton?: React.ReactNode;
}

export const DocumentUploadDialog = ({ 
  entityId, 
  entityType, 
  onUploadComplete,
  triggerButton 
}: DocumentUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customerFacing, setCustomerFacing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      if (entityType === 'lead') {
        await enhancedDocumentService.uploadLeadDocument(
          entityId,
          selectedFile,
          selectedFile.name,
          customerFacing
        );
      } else if (entityType === 'customer') {
        await enhancedDocumentService.uploadCustomerDocument(
          entityId,
          selectedFile,
          selectedFile.name,
          customerFacing
        );
      } else {
        await enhancedDocumentService.uploadProjectDocument(
          entityId,
          selectedFile,
          selectedFile.name,
          customerFacing
        );
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully"
      });

      setSelectedFile(null);
      setCustomerFacing(false);
      setIsOpen(false);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Upload className="h-4 w-4 mr-2" />
      Upload Document
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Upload Document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="customer-facing"
              checked={customerFacing}
              onCheckedChange={setCustomerFacing}
            />
            <Label htmlFor="customer-facing" className="text-sm">
              Customer can view this document
            </Label>
          </div>
          
          <div className="text-xs text-gray-500">
            {customerFacing ? 
              "This document will be visible to the customer in their portal" : 
              "This document is for Titan team use only"
            }
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};