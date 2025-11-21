import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ruler, Move, RotateCw, Copy, Trash2, Layers, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedToolPaletteProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  selectedElement: any;
  onElementUpdate: (id: string, updates: any) => void;
  onClear: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  showDimensions: boolean;
  onToggleDimensions: (show: boolean) => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: (snap: boolean) => void;
  units: 'inches' | 'feet' | 'meters';
  onUnitsChange: (units: 'inches' | 'feet' | 'meters') => void;
}

export const AdvancedToolPalette: React.FC<AdvancedToolPaletteProps> = ({
  selectedTool,
  onToolSelect,
  gridSize,
  onGridSizeChange,
  selectedElement,
  onElementUpdate,
  onClear,
  onDuplicate,
  onDelete,
  showDimensions,
  onToggleDimensions,
  snapToGrid,
  onToggleSnapToGrid,
  units,
  onUnitsChange
}) => {
  const [selectedLayer, setSelectedLayer] = useState('default');
  const [elementOpacity, setElementOpacity] = useState(100);

  const tools = [
    { id: 'select', label: 'Select', icon: Move },
    { id: 'wall', label: 'Wall', icon: Layers },
    { id: 'door', label: 'Door', icon: Layers },
    { id: 'window', label: 'Window', icon: Layers },
    { id: 'room', label: 'Room', icon: Layers },
    { id: 'dimension', label: 'Dimension', icon: Ruler },
  ];

  const layers = [
    { id: 'default', name: 'Default', visible: true },
    { id: 'walls', name: 'Walls', visible: true },
    { id: 'fixtures', name: 'Fixtures', visible: true },
    { id: 'dimensions', name: 'Dimensions', visible: showDimensions },
    { id: 'annotations', name: 'Annotations', visible: true }
  ];

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
    if (toolId === 'dimension') {
      onToggleDimensions(true);
      toast.success('Dimension tool activated - Click two points to measure');
    }
  };

  const handleElementTransform = (property: string, value: any) => {
    if (selectedElement) {
      onElementUpdate(selectedElement.id, { [property]: value });
    }
  };

  const formatGridSize = (size: number) => {
    const inches = size / 12;
    return `${inches.toFixed(1)}"`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Advanced Tools</h2>
      </div>

      {/* Drawing Tools */}
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Drawing Tools</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToolSelect(tool.id)}
                  className="flex flex-col gap-1 h-auto py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Grid & Snap Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Grid & Snap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Grid Size: {formatGridSize(gridSize)}</Label>
              <Slider
                value={[gridSize]}
                onValueChange={(value) => onGridSizeChange(value[0])}
                min={6}
                max={60}
                step={6}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs">Snap to Grid</Label>
              <Switch
                checked={snapToGrid}
                onCheckedChange={onToggleSnapToGrid}
              />
            </div>

            <div>
              <Label className="text-xs">Units</Label>
              <Select value={units} onValueChange={onUnitsChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inches">Inches (")</SelectItem>
                  <SelectItem value="feet">Feet (')</SelectItem>
                  <SelectItem value="meters">Meters (m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Display</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Dimensions</Label>
              <Switch
                checked={showDimensions}
                onCheckedChange={onToggleDimensions}
              />
            </div>

            <div>
              <Label className="text-xs">Layers</Label>
              <div className="mt-1 space-y-1">
                {layers.map((layer) => (
                  <div key={layer.id} className="flex items-center justify-between">
                    <span className="text-xs">{layer.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        // Toggle layer visibility logic here
                        toast.success(`${layer.name} layer ${layer.visible ? 'hidden' : 'shown'}`);
                      }}
                    >
                      {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Element Properties */}
        {selectedElement && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Selected: {selectedElement.type}
                <Badge variant="outline" className="ml-2 text-xs">
                  {selectedElement.id}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X Position</Label>
                  <Input
                    type="number"
                    value={selectedElement.properties.left || 0}
                    onChange={(e) => handleElementTransform('left', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Position</Label>
                  <Input
                    type="number"
                    value={selectedElement.properties.top || 0}
                    onChange={(e) => handleElementTransform('top', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={selectedElement.properties.width || 0}
                    onChange={(e) => handleElementTransform('width', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={selectedElement.properties.height || 0}
                    onChange={(e) => handleElementTransform('height', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div>
                <Label className="text-xs">Rotation: {elementOpacity}°</Label>
                <Slider
                  value={[selectedElement.properties.angle || 0]}
                  onValueChange={(value) => handleElementTransform('angle', value[0])}
                  min={0}
                  max={360}
                  step={15}
                  className="mt-1"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDuplicate}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span className="text-xs">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleElementTransform('angle', (selectedElement.properties.angle || 0) + 90)}
                  className="flex items-center gap-1"
                >
                  <RotateCw className="h-3 w-3" />
                  <span className="text-xs">Rotate</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Canvas Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Canvas Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={onClear}
              className="w-full"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <div className="mt-auto p-4 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Pro Tips:</strong></p>
          <p>• Hold Shift while drawing for straight lines</p>
          <p>• Double-click to finish wall drawing</p>
          <p>• Use dimension tool to measure distances</p>
          <p>• Ctrl+D to duplicate selected elements</p>
        </div>
      </div>
    </div>
  );
};