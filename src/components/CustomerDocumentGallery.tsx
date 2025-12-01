import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Eye, Image, Calendar, ZoomIn, X, ChevronLeft, ChevronRight, ImageIcon, Camera, Upload } from "lucide-react";
import SocialImageShare from "./SocialImageShare";
import { enhancedDocumentService, ProjectDocument } from "@/services/enhancedDocumentService";
import { format } from "date-fns";
import { setCoverPhotoFromGallery } from "./CoverPhotoManager";
import { CameraCaptureDialog } from "./CameraCaptureDialog";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
import useEmblaCarousel from 'embla-carousel-react';

interface CustomerDocumentGalleryProps {
  projectId: string;
}

export const CustomerDocumentGallery = ({ projectId }: CustomerDocumentGalleryProps) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start' });

  // Cache for image URLs to prevent refetching
  const imageUrlCache = useState<Map<string, string>>(() => new Map())[0];

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await enhancedDocumentService.getCustomerFacingProjectDocuments(projectId);
      setDocuments(docs);
      
      // Don't load image URLs immediately - use lazy loading instead
      setImageUrls({});
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lazy load image URL when needed
  const loadImageUrl = async (doc: ProjectDocument) => {
    // Check cache first
    if (imageUrlCache.has(doc.id)) {
      const cachedUrl = imageUrlCache.get(doc.id)!;
      setImageUrls(prev => ({ ...prev, [doc.id]: cachedUrl }));
      return cachedUrl;
    }

    // Check if already loading
    if (loadingImages.has(doc.id)) {
      return;
    }

    try {
      setLoadingImages(prev => new Set(prev).add(doc.id));
      const url = await enhancedDocumentService.getPublicUrl(doc.file_path);
      
      // Cache the URL
      imageUrlCache.set(doc.id, url);
      
      setImageUrls(prev => ({ ...prev, [doc.id]: url }));
      return url;
    } catch (error) {
      console.error(`Error loading image URL for ${doc.file_name}:`, error);
      // Set a placeholder or error state
      setImageUrls(prev => ({ ...prev, [doc.id]: '' }));
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    }
  };

  // Separate documents and images
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const isImage = (fileName: string) => {
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const imageDocuments = documents.filter(doc => isImage(doc.file_name));
  const textDocuments = documents.filter(doc => !isImage(doc.file_name));

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < imageDocuments.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (selectedImageIndex === null) return;
    
    if (direction === 'right' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    } else if (direction === 'left' && selectedImageIndex < imageDocuments.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, imageDocuments.length]);

  const addSwipeHandlers = useCallback((element: HTMLElement) => {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      endX = e.touches[0].clientX;
      endY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 50;

      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          handleSwipe('right');
        } else {
          handleSwipe('left');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleSwipe]);

  const downloadDocument = async (document: ProjectDocument) => {
    try {
      const fileData = await enhancedDocumentService.downloadDocument(document.file_path);
      const url = window.URL.createObjectURL(fileData);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
          <TabsTrigger value="photos" className="text-xs sm:text-sm px-2 sm:px-3">
            Photos ({imageDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 sm:px-3">
            Documents ({textDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* Photo Gallery Tab */}
        <TabsContent value="photos" className="mt-4 sm:mt-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 sm:p-4 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <Image className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="truncate">Project Photo Gallery</span>
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                    Visual progress updates and project photos from your construction team
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-start sm:self-center">
                  <PhotoUploadDialog
                    entityId={projectId}
                    entityType="project"
                    onUploadComplete={loadDocuments}
                    forceCustomerFacing={true}
                    triggerButton={
                      <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 sm:px-3 text-xs sm:text-sm">
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Upload</span>
                      </Button>
                    }
                  />
                  <CameraCaptureDialog
                    entityId={projectId}
                    entityType="project"
                    onUploadComplete={loadDocuments}
                    forceCustomerFacing={true}
                    triggerButton={
                      <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 sm:px-3 text-xs sm:text-sm">
                        <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Camera</span>
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {imageDocuments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Image className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No Photos Yet</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Photos will appear here as your construction team uploads progress images.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Carousel View */}
                  <div className="block sm:hidden">
                    <div className="overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                        {imageDocuments.map((doc, index) => (
                          <div
                            key={doc.id}
                            className="flex-none w-[72vw] mr-3 relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => handleImageClick(index)}
                          >
                            {imageUrls[doc.id] ? (
                              <img
                                src={imageUrls[doc.id]}
                                alt={doc.file_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : loadingImages.has(doc.id) ? (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                            ) : (
                              <img
                                src=""
                                alt={doc.file_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onLoad={() => loadImageUrl(doc)}
                                onError={() => loadImageUrl(doc)}
                                style={{ opacity: 0 }}
                                onLoadStart={() => loadImageUrl(doc)}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                              <div className="p-2 w-full">
                                <p className="text-white text-xs font-medium truncate">
                                  {doc.file_name}
                                </p>
                                <p className="text-white/80 text-xs">
                                  {format(new Date(doc.uploaded_at), 'MMM d')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-center mt-3">
                      <p className="text-xs text-muted-foreground">
                        Swipe to see more photos
                      </p>
                    </div>
                  </div>

                  {/* Desktop Grid View */}
                  <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {imageDocuments.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
                        onClick={() => handleImageClick(index)}
                      >
                        {imageUrls[doc.id] ? (
                          <img
                            src={imageUrls[doc.id]}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : loadingImages.has(doc.id) ? (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <img
                            src=""
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onLoad={() => loadImageUrl(doc)}
                            onError={() => loadImageUrl(doc)}
                            style={{ opacity: 0 }}
                            onLoadStart={() => loadImageUrl(doc)}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                          <ZoomIn className="h-4 w-4 sm:h-6 sm:w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs font-medium truncate">
                            {doc.file_name}
                          </p>
                          <p className="text-white/80 text-xs hidden sm:block">
                            {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Project Documents
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Important project documents, contracts, and reports
              </p>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {textDocuments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No Documents Yet</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Project documents will appear here when shared by your team.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {textDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-medium truncate">{doc.file_name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                            </span>
                            <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                          {doc.notes && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{doc.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                          className="text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">DL</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Preview Modal */}
      {selectedImageIndex !== null && (
        <Dialog open={true} onOpenChange={() => setSelectedImageIndex(null)}>
          <DialogContent className="w-screen max-w-none h-[100svh] sm:max-w-4xl sm:h-[90vh] p-0 bg-black/95 overflow-hidden rounded-none sm:rounded-lg overscroll-contain touch-pan-y">
            <div 
              className="relative w-full h-full"
              ref={(el) => {
                if (el) {
                  const cleanup = addSwipeHandlers(el);
                  return cleanup;
                }
              }}
            >
              
              {selectedImageIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 hidden sm:flex"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              
              {selectedImageIndex < imageDocuments.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 hidden sm:flex"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Mobile swipe indicator */}
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10 sm:hidden top-[calc(env(safe-area-inset-top)+1rem)]">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                  Swipe to navigate • {selectedImageIndex + 1} of {imageDocuments.length}
                </div>
              </div>

              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                  <img
                    src={imageUrls[imageDocuments[selectedImageIndex].id] || ''}
                    alt={imageDocuments[selectedImageIndex].file_name}
                    className="w-auto h-auto max-w-full max-h-full object-contain select-none"
                    draggable={false}
                  />
                </div>
                
                <div className="bg-black/80 p-3 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm truncate">
                        {imageDocuments[selectedImageIndex].file_name}
                      </h3>
                      <p className="text-xs text-white/80 mb-1">
                        Uploaded on {format(new Date(imageDocuments[selectedImageIndex].uploaded_at), 'MMM d, yyyy')}
                      </p>
                      {imageDocuments[selectedImageIndex].notes && (
                        <p className="text-xs text-white/90 mb-2 line-clamp-2">
                          {imageDocuments[selectedImageIndex].notes}
                        </p>
                      )}
                      <span className="text-xs text-white/60">
                        {selectedImageIndex + 1} of {imageDocuments.length}
                      </span>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCoverPhotoFromGallery(projectId, imageUrls[imageDocuments[selectedImageIndex].id] || '')}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Cover</span>
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        <SocialImageShare 
                          imageUrl={imageUrls[imageDocuments[selectedImageIndex].id] || ''}
                          title={`Construction Progress - ${imageDocuments[selectedImageIndex].file_name}`}
                          description="Check out this amazing construction progress photo!"
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(imageDocuments[selectedImageIndex])}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="text-xs">Save</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};