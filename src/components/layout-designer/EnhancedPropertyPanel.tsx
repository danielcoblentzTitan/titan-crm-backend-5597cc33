import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

interface ArchitecturalElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'dimension';
  properties: Record<string, any>;
}

interface EnhancedPropertyPanelProps {
  selectedElement: ArchitecturalElement | null;
  onUpdateElement: (id: string, updates: Partial<ArchitecturalElement>) => void;
}

export const EnhancedPropertyPanel: React.FC<EnhancedPropertyPanelProps> = ({
  selectedElement,
  onUpdateElement
}) => {
  const updateProperty = (key: string, value: any) => {
    if (!selectedElement) return;
    
    onUpdateElement(selectedElement.id, {
      properties: {
        ...selectedElement.properties,
        [key]: value
      }
    });
  };

  if (!selectedElement) {
    return (
      <div className="w-64 bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Properties</h3>
        <p className="text-sm text-muted-foreground">
          Select an element to view and edit its properties.
        </p>
      </div>
    );
  }

  const renderWallProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="wall-thickness">Wall Thickness</Label>
        <Select 
          value={selectedElement.properties.thickness || "6"}
          onValueChange={(value) => updateProperty('thickness', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 inches</SelectItem>
            <SelectItem value="6">6 inches</SelectItem>
            <SelectItem value="8">8 inches</SelectItem>
            <SelectItem value="12">12 inches</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="wall-type">Wall Type</Label>
        <Select 
          value={selectedElement.properties.type || "interior"}
          onValueChange={(value) => updateProperty('type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="interior">Interior Wall</SelectItem>
            <SelectItem value="exterior">Exterior Wall</SelectItem>
            <SelectItem value="load-bearing">Load Bearing</SelectItem>
            <SelectItem value="partition">Partition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="structural"
          checked={selectedElement.properties.structural || false}
          onCheckedChange={(checked) => updateProperty('structural', checked)}
        />
        <Label htmlFor="structural">Structural Element</Label>
      </div>
    </div>
  );

  const renderDoorProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="door-width">Door Width</Label>
        <Select 
          value={selectedElement.properties.width || "32"}
          onValueChange={(value) => updateProperty('width', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24">24 inches</SelectItem>
            <SelectItem value="28">28 inches</SelectItem>
            <SelectItem value="30">30 inches</SelectItem>
            <SelectItem value="32">32 inches</SelectItem>
            <SelectItem value="36">36 inches</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="door-type">Door Type</Label>
        <Select 
          value={selectedElement.properties.doorType || "single"}
          onValueChange={(value) => updateProperty('doorType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Door</SelectItem>
            <SelectItem value="double">Double Door</SelectItem>
            <SelectItem value="sliding">Sliding Door</SelectItem>
            <SelectItem value="bifold">Bi-fold Door</SelectItem>
            <SelectItem value="pocket">Pocket Door</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="swing-direction">Swing Direction</Label>
        <Select 
          value={selectedElement.properties.swingDirection || "right"}
          onValueChange={(value) => updateProperty('swingDirection', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="pull">Pull</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="show-swing"
          checked={selectedElement.properties.showSwing !== false}
          onCheckedChange={(checked) => updateProperty('showSwing', checked)}
        />
        <Label htmlFor="show-swing">Show Door Swing</Label>
      </div>
    </div>
  );

  const renderWindowProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="window-width">Window Width</Label>
        <Input
          id="window-width"
          type="number"
          value={selectedElement.properties.width || 48}
          onChange={(e) => updateProperty('width', parseInt(e.target.value))}
        />
      </div>

      <div>
        <Label htmlFor="window-height">Window Height</Label>
        <Input
          id="window-height"
          type="number"
          value={selectedElement.properties.height || 36}
          onChange={(e) => updateProperty('height', parseInt(e.target.value))}
        />
      </div>

      <div>
        <Label htmlFor="window-type">Window Type</Label>
        <Select 
          value={selectedElement.properties.windowType || "casement"}
          onValueChange={(value) => updateProperty('windowType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="casement">Casement</SelectItem>
            <SelectItem value="double-hung">Double Hung</SelectItem>
            <SelectItem value="sliding">Sliding</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="awning">Awning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sill-height">Sill Height</Label>
        <Input
          id="sill-height"
          type="number"
          value={selectedElement.properties.sillHeight || 30}
          onChange={(e) => updateProperty('sillHeight', parseInt(e.target.value))}
        />
      </div>
    </div>
  );

  const renderRoomProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="room-name">Room Name</Label>
        <Input
          id="room-name"
          value={selectedElement.properties.name || ''}
          onChange={(e) => updateProperty('name', e.target.value)}
          placeholder="Living Room, Kitchen, etc."
        />
      </div>

      <div>
        <Label htmlFor="room-type">Room Type</Label>
        <Select 
          value={selectedElement.properties.roomType || "living"}
          onValueChange={(value) => updateProperty('roomType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="living">Living Room</SelectItem>
            <SelectItem value="bedroom">Bedroom</SelectItem>
            <SelectItem value="kitchen">Kitchen</SelectItem>
            <SelectItem value="bathroom">Bathroom</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="dining">Dining Room</SelectItem>
            <SelectItem value="utility">Utility Room</SelectItem>
            <SelectItem value="garage">Garage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Area Calculation</Label>
        <p className="text-sm text-muted-foreground">
          {selectedElement.properties.area || 'Auto-calculated'} sq ft
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="show-label"
          checked={selectedElement.properties.showLabel !== false}
          onCheckedChange={(checked) => updateProperty('showLabel', checked)}
        />
        <Label htmlFor="show-label">Show Room Label</Label>
      </div>
    </div>
  );

  const renderElementSpecificProperties = () => {
    switch (selectedElement.type) {
      case 'wall':
        return renderWallProperties();
      case 'door':
        return renderDoorProperties();
      case 'window':
        return renderWindowProperties();
      case 'room':
        return renderRoomProperties();
      default:
        return null;
    }
  };

  return (
    <div className="w-64 bg-card border border-border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Properties</h3>
        <p className="text-sm text-muted-foreground capitalize">
          {selectedElement.type} Element
        </p>
      </div>

      <Separator />

      <div>
        <Label htmlFor="element-id">Element ID</Label>
        <Input
          id="element-id"
          value={selectedElement.id}
          readOnly
          className="text-xs bg-muted"
        />
      </div>

      <Separator />

      {renderElementSpecificProperties()}

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-2">Layer & Visibility</h4>
        <div className="space-y-2">
          <div>
            <Label htmlFor="layer">Layer</Label>
            <Select 
              value={selectedElement.properties.layer || "default"}
              onValueChange={(value) => updateProperty('layer', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="walls">Walls</SelectItem>
                <SelectItem value="doors-windows">Doors & Windows</SelectItem>
                <SelectItem value="dimensions">Dimensions</SelectItem>
                <SelectItem value="annotations">Annotations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="visible"
              checked={selectedElement.properties.visible !== false}
              onCheckedChange={(checked) => updateProperty('visible', checked)}
            />
            <Label htmlFor="visible">Visible</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="locked"
              checked={selectedElement.properties.locked || false}
              onCheckedChange={(checked) => updateProperty('locked', checked)}
            />
            <Label htmlFor="locked">Locked</Label>
          </div>
        </div>
      </div>
    </div>
  );
};