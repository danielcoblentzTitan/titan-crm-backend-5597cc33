import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileImage, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  elements: any[];
  canvasRef: React.RefObject<any>;
  customerName: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  elements,
  canvasRef,
  customerName,
}) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [projectTitle, setProjectTitle] = useState(`Building Layout - ${customerName}`);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const exportAsImage = () => {
    if (!canvasRef.current) return;

    try {
      // Create a high-resolution version for export
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.download = `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Export successful",
        description: "Layout exported as PNG image.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export layout as image.",
        variant: "destructive",
      });
    }
  };

  const exportAsPDF = async () => {
    try {
      // For a more complete implementation, you would use jsPDF here
      // For now, we'll just export as image
      exportAsImage();
      
      toast({
        title: "PDF export",
        description: "PDF export feature coming soon. Exported as PNG instead.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export layout as PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (exportFormat === 'png') {
      exportAsImage();
    } else {
      exportAsPDF();
    }
    onClose();
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Building Layout - ${customerName}`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease find the building layout for ${customerName} attached.\n\n` +
      `Project: ${projectTitle}\n` +
      `${additionalNotes ? `Notes: ${additionalNotes}\n` : ''}` +
      `\nBest regards`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
    
    toast({
      title: "Email client opened",
      description: "Please attach the exported layout file to your email.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Layout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="projectTitle">Project Title</Label>
            <Input
              id="projectTitle"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Export Format</Label>
            <div className="flex gap-2 mt-2">
              <Card 
                className={`flex-1 cursor-pointer transition-colors ${
                  exportFormat === 'png' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setExportFormat('png')}
              >
                <CardContent className="p-3 text-center">
                  <FileImage className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-medium">PNG Image</p>
                  <p className="text-xs text-muted-foreground">High quality image</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`flex-1 cursor-pointer transition-colors ${
                  exportFormat === 'pdf' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setExportFormat('pdf')}
              >
                <CardContent className="p-3 text-center">
                  <FileImage className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-medium">PDF Document</p>
                  <p className="text-xs text-muted-foreground">Professional format</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <Label htmlFor="additionalNotes">Additional Notes (optional)</Label>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any special instructions or notes for the drafter..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleExport}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {exportFormat.toUpperCase()}
            </Button>
            
            <Button 
              variant="outline"
              onClick={shareByEmail}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Tip: Export as PNG for quick sharing, or PDF for professional documentation.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};