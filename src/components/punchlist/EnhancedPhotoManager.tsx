import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, X, Eye, Download, RotateCcw, Move } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Photo {
  url: string;
  type: 'general' | 'before' | 'after';
  uploaded_at: string;
  description?: string;
}

interface EnhancedPhotoManagerProps {
  itemId: string;
  photos: Photo[];
  beforePhotos: Photo[];
  afterPhotos: Photo[];
  onPhotosUpdate: (photos: Photo[], type: 'general' | 'before' | 'after') => void;
  isCustomerView?: boolean;
}

export function EnhancedPhotoManager({ 
  itemId, 
  photos = [], 
  beforePhotos = [], 
  afterPhotos = [], 
  onPhotosUpdate,
  isCustomerView = false 
}: EnhancedPhotoManagerProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoType, setPhotoType] = useState<'general' | 'before' | 'after'>('general');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPhotos = [...photos, ...beforePhotos, ...afterPhotos];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        // Simulate photo upload - in real implementation, upload to Supabase Storage
        const newPhoto: Photo = {
          url: URL.createObjectURL(file), // This should be the Supabase Storage URL
          type: photoType,
          uploaded_at: new Date().toISOString(),
          description: `${photoType} photo`
        };

        // Update the appropriate photo array
        const currentPhotos = photoType === 'general' ? photos : 
                             photoType === 'before' ? beforePhotos : afterPhotos;
        
        onPhotosUpdate([...currentPhotos, newPhoto], photoType);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = (photoToDelete: Photo) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      const currentPhotos = photoToDelete.type === 'general' ? photos : 
                           photoToDelete.type === 'before' ? beforePhotos : afterPhotos;
      
      const updatedPhotos = currentPhotos.filter(p => p.url !== photoToDelete.url);
      onPhotosUpdate(updatedPhotos, photoToDelete.type);
    }
  };

  const PhotoGrid = ({ photoList, showDelete = true }: { photoList: Photo[], showDelete?: boolean }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {photoList.map((photo, index) => (
        <div key={index} className="relative group">
          <div 
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img 
              src={photo.url} 
              alt={photo.description || `Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          {photo.type !== 'general' && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 text-xs"
            >
              {photo.type}
            </Badge>
          )}
          {showDelete && !isCustomerView && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePhoto(photo);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="absolute bottom-2 left-2 right-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setSelectedPhoto(photo)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const BeforeAfterComparison = () => {
    if (beforePhotos.length === 0 && afterPhotos.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No before/after photos yet
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {beforePhotos.map((beforePhoto, index) => {
          const afterPhoto = afterPhotos[index];
          return (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge variant="outline">Before</Badge>
                </h4>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={beforePhoto.url} 
                    alt="Before"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                    onClick={() => setSelectedPhoto(beforePhoto)}
                  />
                </div>
              </div>
              {afterPhoto && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">After</Badge>
                  </h4>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={afterPhoto.url} 
                      alt="After"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                      onClick={() => setSelectedPhoto(afterPhoto)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Management
            {allPhotos.length > 0 && (
              <Badge variant="secondary">{allPhotos.length}</Badge>
            )}
          </div>
          {!isCustomerView && (
            <div className="flex items-center gap-2">
              <Select value={photoType} onValueChange={(value: 'general' | 'before' | 'after') => setPhotoType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Add Photos'}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({allPhotos.length})</TabsTrigger>
            <TabsTrigger value="general">General ({photos.length})</TabsTrigger>
            <TabsTrigger value="before-after">Before/After</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {allPhotos.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No photos yet
              </div>
            ) : (
              <PhotoGrid photoList={allPhotos} />
            )}
          </TabsContent>
          
          <TabsContent value="general" className="mt-4">
            <PhotoGrid photoList={photos} />
          </TabsContent>
          
          <TabsContent value="before-after" className="mt-4">
            <BeforeAfterComparison />
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            <div className="space-y-4">
              {allPhotos
                .sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime())
                .map((photo, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={photo.url} 
                        alt="Timeline photo"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{photo.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(photo.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{photo.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Photo Viewer Dialog */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    Photo Viewer
                    <Badge variant="outline">{selectedPhoto.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedPhoto(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img 
                  src={selectedPhoto.url} 
                  alt="Full size view"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}