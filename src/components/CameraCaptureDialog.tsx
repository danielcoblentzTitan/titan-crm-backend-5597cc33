import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Camera, X, RotateCcw, Check, Mic, Square, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { enhancedDocumentService } from "@/services/enhancedDocumentService";

interface CameraCaptureDialogProps {
  entityId: string;
  entityType: 'lead' | 'project' | 'customer';
  onUploadComplete?: () => void;
  triggerButton?: React.ReactNode;
  customerInfo?: { firstName: string; lastName: string; };
  forceCustomerFacing?: boolean;
}

export const CameraCaptureDialog = ({ 
  entityId, 
  entityType, 
  onUploadComplete,
  triggerButton,
  customerInfo,
  forceCustomerFacing = false
}: CameraCaptureDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [customerFacing, setCustomerFacing] = useState(forceCustomerFacing);
  const [photoName, setPhotoName] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{id: string, name: string, timestamp: string, notes: string, voiceNote?: string}>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(3);
  const [supportsOpticalZoom, setSupportsOpticalZoom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 22050
        } 
      });
      
      // Use webm format for better compatibility
      const options = { 
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // Fallback to other formats if webm not supported
      let recorder;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      } else {
        recorder = new MediaRecorder(stream);
      }
      
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          let result = reader.result as string;
          // Fix the MIME type in the data URL to match the actual format
          if (result.startsWith('data:audio/wav') && mimeType !== 'audio/wav') {
            result = result.replace('data:audio/wav', `data:${mimeType}`);
          }
          console.log('Voice note recorded, size:', blob.size, 'type:', mimeType, 'dataURL starts with:', result.substring(0, 50));
          setVoiceNote(result);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        toast({
          title: "Recording Error",
          description: "Failed to record voice note",
          variant: "destructive"
        });
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Voice note recording started"
      });
    } catch (error) {
      console.error('Voice recording error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Voice Recording Error",
        description: `Unable to access microphone: ${errorMessage}. Please check your microphone permissions.`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access.",
          variant: "destructive"
        });
        return;
      }

      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Check for optical zoom support
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.zoom) {
        setSupportsOpticalZoom(true);
        setMaxZoom(capabilities.zoom.max || 3);
      } else {
        setSupportsOpticalZoom(false);
        setMaxZoom(3); // Digital zoom max
      }
      
    } catch (error: any) {
      let userMessage = "Unable to access camera. ";
      
      if (error.name === 'NotAllowedError') {
        userMessage = "Camera access denied. Please allow camera permissions and try again.";
      } else if (error.name === 'NotFoundError') {
        userMessage = "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        userMessage = "Camera not supported on this device.";
      } else if (error.name === 'NotReadableError') {
        userMessage = "Camera is already in use by another application.";
      }
      
      toast({
        title: "Camera Error",
        description: userMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    } else if (isCameraActive && streamRef.current && !videoRef.current) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      }, 200);
    }
  }, [isCameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setZoomLevel(1);
  }, []);

  const handleZoom = useCallback(async (newZoomLevel: number) => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    setZoomLevel(newZoomLevel);
    
    if (supportsOpticalZoom) {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ zoom: newZoomLevel } as any]
        });
      } catch (error) {
        console.error('Error applying optical zoom:', error);
        // Fall back to digital zoom if optical zoom fails
      }
    }
    
    // Apply digital zoom via CSS transform
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${newZoomLevel})`;
    }
  }, [supportsOpticalZoom]);

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 0.5, maxZoom);
    handleZoom(newZoom);
  }, [zoomLevel, maxZoom, handleZoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 0.5, 1);
    handleZoom(newZoom);
  }, [zoomLevel, handleZoom]);

  const capturePhoto = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      
      // Get existing documents to determine next number
      let existingDocs = [];
      try {
        if (entityType === 'project') {
          existingDocs = await enhancedDocumentService.getProjectDocuments(entityId);
        } else if (entityType === 'customer') {
          existingDocs = await enhancedDocumentService.getCustomerDocuments(entityId);
        } else {
          existingDocs = await enhancedDocumentService.getLeadDocuments(entityId);
        }
      } catch (error) {
        console.error('Error fetching existing documents:', error);
      }

      // Count photos with the customer name pattern
      const customerName = customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}`.trim() : 'Photo';
      const customerNamePattern = new RegExp(`^${customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} - \\d+\\.jpg$`);
      const existingPhotos = existingDocs.filter(doc => customerNamePattern.test(doc.file_name));
      const nextNumber = existingPhotos.length + 1;
      
      setPhotoName(`${customerName} - ${nextNumber}`);
      
      stopCamera();
    }
  }, [stopCamera, entityType, entityId, customerInfo]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setPhotoName("");
    startCamera();
  }, [startCamera]);

  const handleUpload = async () => {
    if (!capturedImage || !photoName.trim()) {
      toast({
        title: "Error",
        description: "Please capture a photo and enter a name.",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting upload process...', { entityType, entityId, customerFacing });
    setUploading(true);
    try {
      // Convert data URL to blob
      console.log('Converting captured image to blob...');
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      console.log('Blob created:', { size: blob.size, type: blob.type });
      
      // Create short filename
      const fileName = `${photoName.trim()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      console.log('Calling upload service...', { entityType, fileName, fileSize: file.size });
      
      if (entityType === 'lead') {
        console.log('Uploading lead document...');
        await enhancedDocumentService.uploadLeadDocument(
          entityId,
          file,
          fileName,
          customerFacing,
          photoNotes.trim(),
          voiceNote || ''
        );
        console.log('Lead document uploaded successfully');
      } else if (entityType === 'customer') {
        console.log('Uploading customer document...');
        await enhancedDocumentService.uploadCustomerDocument(
          entityId,
          file,
          fileName,
          customerFacing,
          photoNotes.trim(),
          voiceNote || ''
        );
        console.log('Customer document uploaded successfully');
      } else {
        console.log('Uploading project document...');
        await enhancedDocumentService.uploadProjectDocument(
          entityId,
          file,
          fileName,
          customerFacing,
          photoNotes.trim(),
          voiceNote || ''
        );
        console.log('Project document uploaded successfully');
      }

      // Add to uploaded photos list with notes and voice note
      const now = new Date();
      const newPhoto = {
        id: Date.now().toString(),
        name: photoName.trim(),
        timestamp: now.toLocaleString(),
        notes: photoNotes.trim() || 'No notes',
        voiceNote: voiceNote || undefined
      };
      setUploadedPhotos(prev => [...prev, newPhoto]);

      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      });

      // Reset for next photo and restart camera
      setCapturedImage(null);
      setPhotoName("");
      setPhotoNotes("");
      setVoiceNote(null);
      
      // Automatically restart camera for next photo
      setTimeout(() => {
        startCamera();
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = "Failed to upload photo";
      if (error instanceof Error) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setPhotoName("");
    setPhotoNotes("");
    setVoiceNote(null);
    setCustomerFacing(forceCustomerFacing);
    setUploadedPhotos([]);
    setIsOpen(false);
    
    if (uploadedPhotos.length > 0) {
      onUploadComplete?.();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Camera className="h-4 w-4 mr-2" />
      Take Photo
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('Dialog state changed:', open);
      if (!open) {
        handleClose();
      } else {
        setIsOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 rounded-none p-0 overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b">
            <DialogTitle className="flex items-center text-base sm:text-lg">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Capture Photo
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4">
              {!isCameraActive && !capturedImage && (
                <div className="flex items-center justify-center h-full min-h-[50vh]">
                  <div className="text-center">
                    <Button 
                      onClick={startCamera} 
                      size="lg" 
                      className="w-full sm:w-auto mb-4"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Click to access your camera
                    </p>
                  </div>
                </div>
              )}

              {isCameraActive && (
                <div className="relative h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transformOrigin: 'center center' }}
                    onLoadedMetadata={() => {
                      console.log('Video loaded successfully');
                    }}
                    onError={(e) => {
                      console.error('Video error:', e);
                    }}
                  />
                
                  {/* Zoom Controls */}
                  <div className="absolute top-4 left-4 flex flex-col space-y-2">
                    <Button
                      onClick={zoomIn}
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0 bg-black/50 border-white/20 hover:bg-black/70"
                      disabled={zoomLevel >= maxZoom}
                    >
                      <ZoomIn className="h-4 w-4 text-white" />
                    </Button>
                    <div className="bg-black/50 text-white text-xs px-2 py-1 rounded text-center min-w-10">
                      {zoomLevel.toFixed(1)}x
                    </div>
                    <Button
                      onClick={zoomOut}
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0 bg-black/50 border-white/20 hover:bg-black/70"
                      disabled={zoomLevel <= 1}
                    >
                      <ZoomOut className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  
                  {/* Capture Button */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={capturePhoto}
                      className="rounded-full h-16 w-16 p-0 touch-target bg-white hover:bg-white/90 shadow-lg"
                    >
                    </Button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ height: '250px' }}>
                    <img
                      src={capturedImage}
                      alt="Captured photo"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      onClick={retakePhoto}
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 touch-target bg-black/50 border-white/20 hover:bg-black/70 text-white"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Retake</span>
                    </Button>
                  </div>

                  <div className="form-mobile space-y-4">
                    <div>
                      <Label htmlFor="photo-name" className="text-sm font-medium">Photo Name</Label>
                      <Input
                        id="photo-name"
                        value={photoName}
                        onChange={(e) => setPhotoName(e.target.value)}
                        placeholder="Enter photo name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="photo-notes" className="text-sm font-medium">Notes (optional)</Label>
                      <Input
                        id="photo-notes"
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        placeholder="Add notes about this photo..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Voice Note (optional)</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {!isRecording ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={startVoiceRecording}
                            className="flex items-center space-x-2"
                          >
                            <Mic className="h-4 w-4" />
                            <span>Record Voice Note</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={stopVoiceRecording}
                            className="flex items-center space-x-2"
                          >
                            <Square className="h-4 w-4" />
                            <span>Stop Recording</span>
                          </Button>
                        )}
                        {voiceNote && (
                          <div className="flex items-center space-x-2">
                            <audio controls className="h-8">
                              <source src={voiceNote} />
                            </audio>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setVoiceNote(null)}
                              className="text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {forceCustomerFacing ? (
                      <div className="text-sm text-muted-foreground">
                        This photo will be visible to your builder in the customer portal
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="customer-facing"
                            checked={customerFacing}
                            onCheckedChange={setCustomerFacing}
                          />
                          <Label htmlFor="customer-facing" className="text-sm">
                            Customer can view this photo
                          </Label>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customerFacing ? 
                            "This photo will be visible to the customer in their portal" : 
                            "This photo is for internal use only"
                          }
                        </div>
                      </>
                    )}

                    <div className="button-group-mobile pt-2">
                      <Button variant="outline" onClick={retakePhoto} className="touch-target">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake Photo
                      </Button>
                      <Button 
                        onClick={handleUpload} 
                        disabled={!photoName.trim() || uploading}
                        className="touch-target"
                      >
                        {uploading ? (
                          <>
                            <div className="mr-2">⏳</div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Save & Take Another
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Photos List */}
              {uploadedPhotos.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center justify-between">
                    <span>Photos This Session ({uploadedPhotos.length})</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClose}
                      className="text-xs"
                    >
                      Done & Close
                    </Button>
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uploadedPhotos.map((photo) => (
                      <div key={photo.id} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                         <div className="min-w-0 flex-1">
                           <p className="font-medium truncate">{photo.name}</p>
                           <p className="text-xs text-muted-foreground">{photo.timestamp}</p>
                           <p className="text-xs text-muted-foreground">{photo.notes}</p>
                           {photo.voiceNote && (
                             <audio controls className="h-6 mt-1 max-w-32">
                               <source src={photo.voiceNote} />
                             </audio>
                           )}
                         </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id));
                            toast({
                              title: "Photo removed from session",
                              description: "Note: Already uploaded photos remain in storage"
                            });
                          }}
                          className="text-destructive hover:text-destructive ml-2"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
};