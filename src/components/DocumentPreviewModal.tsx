import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { enhancedDocumentService, LeadDocument, ProjectDocument, CustomerDocument } from "@/services/enhancedDocumentService";

interface DocumentPreviewModalProps {
  document: LeadDocument | ProjectDocument | CustomerDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: LeadDocument | ProjectDocument | CustomerDocument) => void;
}

export const DocumentPreviewModal = ({ document, isOpen, onClose, onDownload }: DocumentPreviewModalProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load preview when document changes and modal is open
  useEffect(() => {
    if (isOpen && document && !previewUrl && !loading) {
      loadPreview(document);
    }
  }, [isOpen, document]);

  // Clean up URL when document changes or modal closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [document]);

  const loadPreview = async (doc: LeadDocument | ProjectDocument | CustomerDocument) => {
    setLoading(true);
    setError(null);
    
    try {
      const fileData = await enhancedDocumentService.downloadDocument(doc.file_path);
      const url = URL.createObjectURL(fileData);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error loading preview:', error);
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Clean up URL when closing
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setError(null);
      onClose();
    }
  };

  const isPreviewableType = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'].includes(ext || '');
  };

  const getPreviewContent = () => {
    if (!document || !previewUrl) return null;

    const fileExt = document.file_name.toLowerCase().split('.').pop();
    
    if (fileExt === 'pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={`Preview of ${document.file_name}`}
        />
      );
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) {
      return (
        <img
          src={previewUrl}
          alt={`Preview of ${document.file_name}`}
          className="max-w-full max-h-full object-contain"
        />
      );
    }
    
    if (fileExt === 'txt') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0 bg-white"
          title={`Preview of ${document.file_name}`}
        />
      );
    }
    
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p>Preview not available for this file type</p>
          <p className="text-sm mt-2">File: {document.file_name}</p>
        </div>
      </div>
    );
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center">
                <span>Preview: {document.file_name}</span>
              </DialogTitle>
              {document.notes && document.notes.trim() && (
                <p className="text-sm text-gray-600 mt-1 italic">
                  "{document.notes}"
                </p>
              )}
              {document.voice_note && document.voice_note.trim() && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Voice Note:</p>
                  <audio controls className="h-8" preload="metadata">
                    <source src={document.voice_note} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(document)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 mt-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading preview...</div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onDownload(document)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Instead
                </Button>
              </div>
            </div>
          )}
          
          {!loading && !error && !isPreviewableType(document.file_name) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p>Preview not supported for this file type</p>
                <p className="text-sm mt-2">File: {document.file_name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onDownload(document)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}
          
          {!loading && !error && isPreviewableType(document.file_name) && getPreviewContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};