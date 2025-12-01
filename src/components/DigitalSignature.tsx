import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 
import { PenTool, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DigitalSignatureProps {
  documentId: string;
  documentType: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureComplete?: () => void;
}

const DigitalSignature = ({ 
  documentId, 
  documentType, 
  isOpen, 
  onOpenChange,
  onSignatureComplete 
}: DigitalSignatureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const saveSignature = async () => {
    console.log('saveSignature called');
    console.log('Form data:', { hasSignature, signerName, signerEmail, documentId, documentType });
    
    if (!hasSignature || !signerName || !signerEmail) {
      console.log('Validation failed:', { hasSignature, signerName, signerEmail });
      toast({
        title: "Error",
        description: "Please provide your name, email, and signature.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas not found');
        throw new Error("Canvas not found");
      }

      // Convert canvas to base64
      const signatureData = canvas.toDataURL('image/png');
      console.log('Signature data length:', signatureData.length);
      
      // Get client info
      const userAgent = navigator.userAgent;
      console.log('User agent:', userAgent);
      
      const insertData = {
        document_id: documentId,
        document_type: documentType,
        signer_name: signerName,
        signer_email: signerEmail,
        signature_data: signatureData,
        user_agent: userAgent
      };
      
      console.log('Attempting to insert:', insertData);
      
      // Save to database
      const { data, error } = await supabase
        .from('digital_signatures')
        .insert([insertData])
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Signature saved successfully:', data);

      toast({
        title: "Success",
        description: "Document signed successfully!",
      });

      onOpenChange(false);
      if (onSignatureComplete) {
        onSignatureComplete();
      }
      
      // Reset form
      setSignerName("");
      setSignerEmail("");
      clearSignature();
      
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: "Error",
        description: `Failed to save signature: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PenTool className="h-5 w-5 mr-2" />
            Digital Signature Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signer_name">Full Name *</Label>
              <Input
                id="signer_name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="signer_email">Email Address *</Label>
              <Input
                id="signer_email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <Label>Signature *</Label>
            <Card className="mt-2">
              <CardContent className="p-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border border-gray-300 rounded cursor-crosshair w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const x = touch.clientX - rect.left;
                      const y = touch.clientY - rect.top;
                      startDrawing({ clientX: touch.clientX, clientY: touch.clientY } as any);
                    }
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    draw({ clientX: touch.clientX, clientY: touch.clientY } as any);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    stopDrawing();
                  }}
                />
                <div className="flex justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Sign above using your mouse or touch device
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              By signing this document, you acknowledge that you have read, understood, 
              and agree to the terms and conditions outlined in this {documentType}.
              Your signature will be legally binding.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveSignature}
              disabled={!hasSignature || !signerName || !signerEmail || saving}
              className="bg-[#003562] hover:bg-[#003562]/90"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Sign Document
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalSignature;