import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Rect } from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Crop, Download, X, Square, Maximize2 } from "lucide-react";
import { toast } from "sonner";

interface PhotoEditorProps {
  imageUrl: string;
  onSave: (editedImageBlob: Blob, fileName: string) => void;
  onCancel: () => void;
  originalFileName?: string;
}

export const PhotoEditor = ({ 
  imageUrl, 
  onSave, 
  onCancel, 
  originalFileName = "edited-photo.jpg" 
}: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [scale, setScale] = useState([1]);
  const [rotation, setRotation] = useState(0);

  // Standard gallery dimensions
  const GALLERY_WIDTH = 300;
  const GALLERY_HEIGHT = 300;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: "#f8f9fa",
    });

    setFabricCanvas(canvas);

    // Load the image
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = 500;
      const canvasHeight = 500;
      const imageAspect = img.width! / img.height!;
      const canvasAspect = canvasWidth / canvasHeight;
      
      let scaleX, scaleY;
      if (imageAspect > canvasAspect) {
        scaleX = scaleY = canvasWidth / img.width!;
      } else {
        scaleX = scaleY = canvasHeight / img.height!;
      }

      img.set({
        left: 50,
        top: 50,
        scaleX,
        scaleY,
        selectable: true,
        evented: true
      });

      canvas.add(img);
      canvas.centerObject(img);
      canvas.renderAll();
      setOriginalImage(img);
    }).catch((error) => {
      console.error('Error loading image:', error);
      toast.error('Failed to load image for editing');
    });

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  const handleRotate = useCallback(() => {
    if (!fabricCanvas || !originalImage) return;
    
    const newRotation = rotation + 90;
    setRotation(newRotation);
    originalImage.set({ angle: newRotation });
    fabricCanvas.renderAll();
  }, [fabricCanvas, originalImage, rotation]);

  const handleScale = useCallback((newScale: number[]) => {
    if (!fabricCanvas || !originalImage) return;
    
    setScale(newScale);
    const scaleValue = newScale[0];
    originalImage.set({ 
      scaleX: originalImage.scaleX! * scaleValue / scale[0],
      scaleY: originalImage.scaleY! * scaleValue / scale[0]
    });
    fabricCanvas.renderAll();
  }, [fabricCanvas, originalImage, scale]);

  const startCropping = useCallback(() => {
    if (!fabricCanvas) return;

    setIsCropping(true);
    
    // Create crop rectangle
    const cropRectangle = new Rect({
      left: 150,
      top: 150,
      width: 300,
      height: 300,
      fill: 'transparent',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      cornerColor: '#007bff',
      cornerSize: 10,
      transparentCorners: false
    });

    fabricCanvas.add(cropRectangle);
    fabricCanvas.setActiveObject(cropRectangle);
    setCropRect(cropRectangle);
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const cancelCrop = useCallback(() => {
    if (!fabricCanvas || !cropRect) return;
    
    fabricCanvas.remove(cropRect);
    setCropRect(null);
    setIsCropping(false);
    fabricCanvas.renderAll();
  }, [fabricCanvas, cropRect]);

  const applyCrop = useCallback(() => {
    if (!fabricCanvas || !originalImage || !cropRect) return;

    // Get crop dimensions
    const cropLeft = cropRect.left!;
    const cropTop = cropRect.top!;
    const cropWidth = cropRect.width! * cropRect.scaleX!;
    const cropHeight = cropRect.height! * cropRect.scaleY!;

    // Create a new canvas for cropping
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Get the original image element
    const imgElement = (originalImage as any)._originalElement || (originalImage as any)._element;
    
    if (imgElement) {
      // Calculate the source coordinates on the original image
      const imgScaleX = originalImage.scaleX!;
      const imgScaleY = originalImage.scaleY!;
      const imgLeft = originalImage.left!;
      const imgTop = originalImage.top!;
      
      const sourceX = (cropLeft - imgLeft) / imgScaleX;
      const sourceY = (cropTop - imgTop) / imgScaleY;
      const sourceWidth = cropWidth / imgScaleX;
      const sourceHeight = cropHeight / imgScaleY;

      tempCtx.drawImage(
        imgElement,
        Math.max(0, sourceX), 
        Math.max(0, sourceY),
        sourceWidth, 
        sourceHeight,
        0, 
        0, 
        cropWidth, 
        cropHeight
      );

      // Convert to blob and save
      tempCanvas.toBlob((blob) => {
        if (blob) {
          onSave(blob, originalFileName);
        }
      }, 'image/jpeg', 0.9);
    }
  }, [fabricCanvas, originalImage, cropRect, onSave, originalFileName]);

  const fitToGallery = useCallback(() => {
    if (!fabricCanvas) return;

    // Create new canvas for the standardized output
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = GALLERY_WIDTH;
    outputCanvas.height = GALLERY_HEIGHT;
    
    // Export current canvas as image
    const dataURL = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1,
      left: 50,
      top: 50,
      width: 500,
      height: 500
    });

    const img = new Image();
    img.onload = () => {
      const ctx = outputCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, GALLERY_WIDTH, GALLERY_HEIGHT);
      
      // Calculate scaling to fit within gallery dimensions while maintaining aspect ratio
      const scale = Math.min(GALLERY_WIDTH / img.width, GALLERY_HEIGHT / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (GALLERY_WIDTH - scaledWidth) / 2;
      const y = (GALLERY_HEIGHT - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      outputCanvas.toBlob((blob) => {
        if (blob) {
          onSave(blob, originalFileName);
        }
      }, 'image/jpeg', 0.9);
    };
    img.src = dataURL;
  }, [fabricCanvas, onSave, originalFileName]);

  const handleSaveAsIs = useCallback(() => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1
    });

    // Convert dataURL to blob
    fetch(dataURL)
      .then(res => res.blob())
      .then(blob => onSave(blob, originalFileName));
  }, [fabricCanvas, onSave, originalFileName]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Photo</h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <canvas ref={canvasRef} className="w-full" />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scale</label>
                <Slider
                  value={scale}
                  onValueChange={handleScale}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">{scale[0].toFixed(1)}x</span>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleRotate}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Rotate 90°
                </Button>
              </div>

              <div className="space-y-2">
                {!isCropping ? (
                  <Button
                    onClick={startCropping}
                    variant="outline"
                    className="w-full"
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    Crop Image
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={applyCrop}
                      className="w-full"
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Apply Crop
                    </Button>
                    <Button
                      onClick={cancelCrop}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel Crop
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <Button
                  onClick={fitToGallery}
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Fit to Gallery (300x300)
                </Button>
                
                <Button
                  onClick={handleSaveAsIs}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Save As Is
                </Button>

                <Button
                  onClick={onCancel}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>• Use scale to resize the image</p>
                <p>• Rotate to change orientation</p>
                <p>• Crop to select specific area</p>
                <p>• "Fit to Gallery" creates square thumbnails</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};