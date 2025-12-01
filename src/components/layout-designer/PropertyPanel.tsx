import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';

interface LayoutElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'annotation';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
}

interface PropertyPanelProps {
  selectedElement: LayoutElement | null;
  onUpdateElement: (id: string, updates: Partial<LayoutElement>) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  onUpdateElement,
}) => {
  if (!selectedElement) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select an element to view and edit its properties.
        </CardContent>
      </Card>
    );
  }

  const updateProperty = (key: string, value: any) => {
    onUpdateElement(selectedElement.id, {
      properties: {
        ...selectedElement.properties,
        [key]: value,
      },
    });
  };

  const updateDimension = (key: 'x' | 'y' | 'width' | 'height', value: number) => {
    onUpdateElement(selectedElement.id, { [key]: value });
  };

  const renderElementSpecificProperties = () => {
    switch (selectedElement.type) {
      case 'wall':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Thickness (inches)</Label>
              <Input
                type="number"
                value={selectedElement.properties.thickness || 6}
                onChange={(e) => updateProperty('thickness', Number(e.target.value))}
                min="2"
                max="12"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Material</Label>
              <Select
                value={selectedElement.properties.material || 'standard'}
                onValueChange={(value) => updateProperty('material', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Frame</SelectItem>
                  <SelectItem value="steel">Steel Frame</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="block">Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'door':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Door Type</Label>
              <Select
                value={selectedElement.properties.type || 'swing'}
                onValueChange={(value) => updateProperty('type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swing">Swing Door</SelectItem>
                  <SelectItem value="sliding">Sliding Door</SelectItem>
                  <SelectItem value="french">French Door</SelectItem>
                  <SelectItem value="overhead">Overhead Door</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Direction</Label>
              <Select
                value={selectedElement.properties.direction || 'right'}
                onValueChange={(value) => updateProperty('direction', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="inward">Inward</SelectItem>
                  <SelectItem value="outward">Outward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'window':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Window Type</Label>
              <Select
                value={selectedElement.properties.type || 'standard'}
                onValueChange={(value) => updateProperty('type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="casement">Casement</SelectItem>
                  <SelectItem value="double-hung">Double Hung</SelectItem>
                  <SelectItem value="sliding">Sliding</SelectItem>
                  <SelectItem value="picture">Picture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Frame Material</Label>
              <Select
                value={selectedElement.properties.frame || 'wood'}
                onValueChange={(value) => updateProperty('frame', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="vinyl">Vinyl</SelectItem>
                  <SelectItem value="aluminum">Aluminum</SelectItem>
                  <SelectItem value="fiberglass">Fiberglass</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'room':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Room Label</Label>
              <Input
                value={selectedElement.properties.label || ''}
                onChange={(e) => updateProperty('label', e.target.value)}
                placeholder="e.g., Living Room"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Purpose</Label>
              <Select
                value={selectedElement.properties.purpose || 'general'}
                onValueChange={(value) => updateProperty('purpose', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'annotation':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Text</Label>
              <Textarea
                value={selectedElement.properties.text || ''}
                onChange={(e) => updateProperty('text', e.target.value)}
                placeholder="Enter note text..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Element Type</Label>
            <p className="text-sm text-muted-foreground capitalize">
              {selectedElement.type}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X Position</Label>
              <Input
                type="number"
                value={selectedElement.x}
                onChange={(e) => updateDimension('x', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Y Position</Label>
              <Input
                type="number"
                value={selectedElement.y}
                onChange={(e) => updateDimension('y', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={selectedElement.width}
                onChange={(e) => updateDimension('width', Number(e.target.value))}
                min="10"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={selectedElement.height}
                onChange={(e) => updateDimension('height', Number(e.target.value))}
                min="10"
                className="mt-1"
              />
            </div>
          </div>

          {renderElementSpecificProperties()}
        </CardContent>
      </Card>
    </div>
  );
};