import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer, 
  Square, 
  DoorOpen, 
  Minus,
  Home,
  Ruler,
  Copy,
  RotateCw,
  Trash2
} from 'lucide-react';

interface EnhancedToolPaletteProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  onClear: () => void;
  selectedElement: any;
}

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer },
  { id: 'wall', label: 'Wall', icon: Minus },
  { id: 'door', label: 'Door', icon: DoorOpen },
  { id: 'window', label: 'Window', icon: Square },
  { id: 'room', label: 'Room', icon: Home },
  { id: 'dimension', label: 'Dimension', icon: Ruler },
];

export const EnhancedToolPalette: React.FC<EnhancedToolPaletteProps> = ({
  selectedTool,
  onToolSelect,
  gridSize,
  onGridSizeChange,
  onClear,
  selectedElement
}) => {
  return (
    <div className="w-64 bg-card border border-border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Drawing Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onToolSelect(tool.id)}
                className="flex flex-col gap-1 h-16"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{tool.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <Label htmlFor="grid-size" className="text-sm font-medium">
          Grid Size: {gridSize}px
        </Label>
        <Input
          id="grid-size"
          type="range"
          min="10"
          max="50"
          step="5"
          value={gridSize}
          onChange={(e) => onGridSizeChange(Number(e.target.value))}
          className="mt-2"
        />
      </div>

      <Separator />

      {selectedElement && (
        <div>
          <h4 className="text-sm font-medium mb-2">Element Actions</h4>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate 90°
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-2">Canvas Actions</h4>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClear}
          className="w-full justify-start text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <Separator />

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Wall:</strong> Click to start, click again to end</p>
        <p><strong>Door/Window:</strong> Click to place</p>
        <p><strong>Room:</strong> Click to create rectangular space</p>
        <p><strong>Select:</strong> Click and drag to move elements</p>
      </div>
    </div>
  );
};