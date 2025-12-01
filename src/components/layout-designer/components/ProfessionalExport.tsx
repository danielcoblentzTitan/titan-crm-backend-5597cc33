import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Download, FileText, Image, Code, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ProfessionalExportProps {
  isOpen: boolean;
  onClose: () => void;
  elements: any[];
  canvasRef: React.RefObject<any>;
  projectName?: string;
}

interface SymbolLegendItem {
  symbol: string;
  name: string;
  description: string;
  category: string;
}

export const ProfessionalExport: React.FC<ProfessionalExportProps> = ({
  isOpen,
  onClose,
  elements,
  canvasRef,
  projectName = "Untitled Project"
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'svg'>('png');
  const [title, setTitle] = useState(projectName);
  const [scale, setScale] = useState<string>('1/4');
  const [notes, setNotes] = useState('');
  const [includeLegend, setIncludeLegend] = useState(true);
  const [includeGrid, setIncludeGrid] = useState(false);
  const [includeTitleBlock, setIncludeTitleBlock] = useState(true);
  const [paperSize, setPaperSize] = useState<string>('letter');

  // Generate symbol legend from current elements
  const generateSymbolLegend = (): SymbolLegendItem[] => {
    const usedSymbols = new Map<string, SymbolLegendItem>();
    
    elements.forEach(element => {
      if (element.data?.symbol && !usedSymbols.has(element.data.symbol)) {
        usedSymbols.set(element.data.symbol, {
          symbol: element.data.symbol,
          name: element.data.name || element.type,
          description: getSymbolDescription(element.data.symbol),
          category: getSymbolCategory(element.data.symbol)
        });
      }
    });

    return Array.from(usedSymbols.values()).sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  };

  const getSymbolDescription = (symbol: string): string => {
    const descriptions: Record<string, string> = {
      'bathroom_toilet': 'Water closet',
      'bathroom_sink': 'Lavatory sink',
      'bathroom_bathtub': 'Standard bathtub',
      'bathroom_shower': 'Shower stall',
      'bathroom_vanity': 'Vanity cabinet',
      'kitchen_refrigerator': 'Refrigerator',
      'kitchen_stove': 'Range/cooktop',
      'kitchen_dishwasher': 'Dishwasher',
      'kitchen_kitchenSink': 'Kitchen sink',
      'bedroom_bed': 'Bed',
      'bedroom_dresser': 'Dresser/chest',
      'bedroom_closet': 'Closet space',
      'doors_singleDoor': 'Single door',
      'doors_doubleDoor': 'Double door',
      'doors_slidingDoor': 'Sliding door',
      'windows_singleWindow': 'Single window',
      'windows_doubleWindow': 'Double window'
    };
    return descriptions[symbol] || 'Architectural element';
  };

  const getSymbolCategory = (symbol: string): string => {
    if (symbol.startsWith('bathroom_')) return 'Bathroom';
    if (symbol.startsWith('kitchen_')) return 'Kitchen';
    if (symbol.startsWith('bedroom_')) return 'Bedroom';
    if (symbol.startsWith('doors_')) return 'Doors';
    if (symbol.startsWith('windows_')) return 'Windows';
    return 'General';
  };

  const exportAsImage = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not available for export');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png', 1.0);
      
      // Create enhanced image with title block and legend
      const enhancedCanvas = document.createElement('canvas');
      const ctx = enhancedCanvas.getContext('2d');
      if (!ctx) return;

      const originalImg = document.createElement('img');
      originalImg.onload = () => {
        const padding = 60;
        const titleBlockHeight = includeTitleBlock ? 100 : 0;
        const legendWidth = includeLegend ? 300 : 0;
        
        enhancedCanvas.width = originalImg.width + legendWidth + (padding * 2);
        enhancedCanvas.height = originalImg.height + titleBlockHeight + (padding * 2);
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);
        
        // Title block
        if (includeTitleBlock) {
          drawTitleBlock(ctx, padding, padding, originalImg.width + legendWidth, titleBlockHeight);
        }
        
        // Main drawing
        ctx.drawImage(originalImg, padding, padding + titleBlockHeight);
        
        // Legend
        if (includeLegend) {
          drawLegend(ctx, originalImg.width + padding + 20, padding + titleBlockHeight);
        }
        
        // Download
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        link.href = enhancedCanvas.toDataURL('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('PNG exported successfully!');
      };
      originalImg.src = dataURL;
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export image');
    }
  };

  const drawTitleBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(title, x + 20, y + 30);
    
    // Details
    ctx.font = '14px Arial';
    const currentDate = new Date().toLocaleDateString();
    ctx.fillText(`Date: ${currentDate}`, x + 20, y + 55);
    ctx.fillText(`Scale: ${scale}" = 1'-0"`, x + 200, y + 55);
    
    if (notes) {
      ctx.font = '12px Arial';
      ctx.fillText(`Notes: ${notes}`, x + 20, y + 75);
    }
  };

  const drawLegend = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const symbolLegend = generateSymbolLegend();
    
    // Legend border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 280, Math.max(200, symbolLegend.length * 25 + 60));
    
    // Legend title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('SYMBOL LEGEND', x + 10, y + 25);
    
    // Legend items
    ctx.font = '12px Arial';
    let currentY = y + 50;
    let currentCategory = '';
    
    symbolLegend.forEach((item) => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        ctx.font = 'bold 12px Arial';
        ctx.fillText(currentCategory, x + 10, currentY);
        currentY += 20;
        ctx.font = '12px Arial';
      }
      
      // Symbol name and description
      ctx.fillText(`• ${item.name}`, x + 20, currentY);
      if (item.description !== item.name) {
        ctx.fillStyle = '#666666';
        ctx.fillText(`- ${item.description}`, x + 150, currentY);
        ctx.fillStyle = '#000000';
      }
      currentY += 18;
    });
  };

  const exportAsPDF = async () => {
    try {
      // For now, export as high-quality PNG with title block
      await exportAsImage();
      toast.success('Exported as PNG (PDF support coming soon)');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportAsSVG = async () => {
    try {
      // Basic SVG export functionality
      toast.success('SVG export coming soon - exported as PNG instead');
      await exportAsImage();
    } catch (error) {
      console.error('SVG export error:', error);
      toast.error('Failed to export SVG');
    }
  };

  const handleExport = async () => {
    switch (exportFormat) {
      case 'png':
        await exportAsImage();
        break;
      case 'pdf':
        await exportAsPDF();
        break;
      case 'svg':
        await exportAsSVG();
        break;
    }
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Building Layout: ${title}`);
    const body = encodeURIComponent(
      `I've created a building layout design using the Layout Designer.\n\n` +
      `Project: ${title}\n` +
      `Scale: ${scale}" = 1'-0"\n` +
      `${notes ? `Notes: ${notes}\n` : ''}` +
      `\nPlease find the layout file attached.\n\n` +
      `Created with Building Layout Designer`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const symbolLegend = generateSymbolLegend();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Professional Export</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project-title">Project Title</Label>
                  <Input
                    id="project-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter project title"
                  />
                </div>

                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          PNG Image
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF Document
                        </div>
                      </SelectItem>
                      <SelectItem value="svg">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          SVG Vector
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scale">Drawing Scale</Label>
                    <Select value={scale} onValueChange={setScale}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1/8">1/8" = 1'-0"</SelectItem>
                        <SelectItem value="1/4">1/4" = 1'-0"</SelectItem>
                        <SelectItem value="1/2">1/2" = 1'-0"</SelectItem>
                        <SelectItem value="1">1" = 1'-0"</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paper-size">Paper Size</Label>
                    <Select value={paperSize} onValueChange={setPaperSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="letter">Letter (8.5x11)</SelectItem>
                        <SelectItem value="legal">Legal (8.5x14)</SelectItem>
                        <SelectItem value="tabloid">Tabloid (11x17)</SelectItem>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="a3">A3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Project Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add project notes or specifications"
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-title-block">Include Title Block</Label>
                    <Switch
                      id="include-title-block"
                      checked={includeTitleBlock}
                      onCheckedChange={setIncludeTitleBlock}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-legend">Include Symbol Legend</Label>
                    <Switch
                      id="include-legend"
                      checked={includeLegend}
                      onCheckedChange={setIncludeLegend}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-grid">Show Grid Lines</Label>
                    <Switch
                      id="include-grid"
                      checked={includeGrid}
                      onCheckedChange={setIncludeGrid}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleExport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </Button>
              <Button variant="outline" onClick={shareByEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Preview and Legend */}
          <div className="space-y-4">
            {includeLegend && symbolLegend.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Symbol Legend Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(
                      symbolLegend.reduce((acc, item) => {
                        if (!acc[item.category]) acc[item.category] = [];
                        acc[item.category].push(item);
                        return acc;
                      }, {} as Record<string, SymbolLegendItem[]>)
                    ).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm mb-1">{category}</h4>
                        <div className="space-y-1 ml-2">
                          {items.map((item) => (
                            <div key={item.symbol} className="flex items-center justify-between">
                              <span className="text-sm">{item.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {item.description}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded p-8">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {title || 'Untitled Project'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scale: {scale}" = 1'-0"
                    </p>
                    {includeTitleBlock && (
                      <Badge variant="secondary" className="mt-2 mr-1">
                        Title Block
                      </Badge>
                    )}
                    {includeLegend && (
                      <Badge variant="secondary" className="mt-2 mr-1">
                        Legend
                      </Badge>
                    )}
                    {includeGrid && (
                      <Badge variant="secondary" className="mt-2">
                        Grid
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};