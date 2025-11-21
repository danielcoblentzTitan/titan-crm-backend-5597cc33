import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, EyeOff, Search, Trash2, Play } from "lucide-react";
import { enhancedDocumentService, LeadDocument, ProjectDocument, CustomerDocument } from "@/services/enhancedDocumentService";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { CameraCaptureDialog } from "./CameraCaptureDialog";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DocumentListProps {
  entityId: string;
  entityType: 'lead' | 'project' | 'customer';
  customerView?: boolean;
}

export const DocumentList = ({ entityId, entityType, customerView = false }: DocumentListProps) => {
  const [documents, setDocuments] = useState<(LeadDocument | ProjectDocument | CustomerDocument)[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState<LeadDocument | ProjectDocument | CustomerDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [entityId, entityType, customerView]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      let docs;
      
      if (entityType === 'lead') {
        docs = await enhancedDocumentService.getLeadDocuments(entityId);
      } else if (entityType === 'customer') {
        if (customerView) {
          docs = await enhancedDocumentService.getCustomerFacingCustomerDocuments(entityId);
        } else {
          docs = await enhancedDocumentService.getCustomerDocuments(entityId);
        }
      } else if (customerView) {
        docs = await enhancedDocumentService.getCustomerFacingProjectDocuments(entityId);
      } else {
        docs = await enhancedDocumentService.getProjectDocuments(entityId);
      }
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: LeadDocument | ProjectDocument | CustomerDocument) => {
    try {
      const fileData = await enhancedDocumentService.downloadDocument(doc.file_path);
      
      // Create download link
      const url = URL.createObjectURL(fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handlePreview = (doc: LeadDocument | ProjectDocument | CustomerDocument) => {
    setPreviewDocument(doc);
    setPreviewOpen(true);
  };

  const handleDelete = async (doc: LeadDocument | ProjectDocument | CustomerDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (entityType === 'lead') {
        await enhancedDocumentService.deleteLeadDocument(doc.id);
      } else if (entityType === 'customer') {
        await enhancedDocumentService.deleteCustomerDocument(doc.id);
      } else {
        await enhancedDocumentService.deleteProjectDocument(doc.id);
      }

      toast({
        title: "Document Deleted",
        description: `${doc.file_name} has been deleted successfully.`
      });

      // Reload documents
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
    if (!confirm(`Are you sure you want to delete ${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete all selected documents
      await Promise.all(selectedDocs.map(doc => {
        if (entityType === 'lead') {
          return enhancedDocumentService.deleteLeadDocument(doc.id);
        } else if (entityType === 'customer') {
          return enhancedDocumentService.deleteCustomerDocument(doc.id);
        } else {
          return enhancedDocumentService.deleteProjectDocument(doc.id);
        }
      }));

      toast({
        title: "Documents Deleted",
        description: `${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} deleted successfully.`
      });

      // Clear selection and reload documents
      setSelectedDocuments(new Set());
      setSelectMode(false);
      loadDocuments();
    } catch (error) {
      console.error('Error deleting documents:', error);
      toast({
        title: "Error",
        description: "Failed to delete some documents. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedDocuments(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)));
    }
  };

  const toggleSelectDocument = (docId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div>Loading documents...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex-mobile items-start justify-between gap-2">
          <CardTitle className="flex items-center text-sm sm:text-base">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Documents
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
            {!customerView && documents.length > 0 && (
              <div className="flex gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectMode}
                  className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </Button>
                {selectMode && selectedDocuments.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    Delete ({selectedDocuments.size})
                  </Button>
                )}
              </div>
            )}
            {!customerView && (
              <DocumentUploadDialog
                entityId={entityId}
                entityType={entityType}
                onUploadComplete={loadDocuments}
              />
            )}
            {customerView && (
              <CameraCaptureDialog
                entityId={entityId}
                entityType={entityType}
                onUploadComplete={loadDocuments}
                customerInfo={{ firstName: "Test", lastName: "Customer" }}
                forceCustomerFacing={true}
              />
            )}
          </div>
        </div>
        {selectMode && documents.length > 0 && (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="select-all"
              checked={selectedDocuments.size === documents.length}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="select-all" className="text-xs sm:text-sm">
              Select All ({documents.length})
            </Label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-gray-500 text-center py-4 text-xs sm:text-sm">No documents uploaded yet</p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-2 sm:p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  {selectMode && (
                    <Checkbox
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={() => toggleSelectDocument(doc.id)}
                      className="mt-1 flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1 sm:gap-2 mb-1">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="font-medium text-xs sm:text-sm leading-tight">{doc.file_name}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <Badge variant={doc.customer_facing ? "default" : "secondary"} className="text-xs h-4 sm:h-5">
                        {doc.customer_facing ? (
                          <>
                            <Eye className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">Customer</span>
                            <span className="sm:hidden">Cust</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">Internal</span>
                            <span className="sm:hidden">Int</span>
                          </>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>

                    {doc.notes && doc.notes.trim() && (
                      <div className="text-xs text-muted-foreground italic mb-1 sm:mb-2">
                        "{doc.notes}"
                      </div>
                    )}

                    {doc.voice_note && doc.voice_note.trim() && (
                      <div className="mb-1 sm:mb-2">
                        <audio controls className="h-6 w-full max-w-32 sm:max-w-48" preload="metadata">
                          <source src={doc.voice_note} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                    >
                      <Search className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                    >
                      <Download className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                    {!customerView && !selectMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc)}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <DocumentPreviewModal
          document={previewDocument}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
        />
      </CardContent>
    </Card>
  );
};