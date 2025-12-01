import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MousePointer, 
  Square, 
  DoorOpen, 
  RectangleHorizontal, 
  Home, 
  Type,
  Grid3X3
} from 'lucide-react';

interface ToolPaletteProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  selectedTool,
  onToolSelect,
  gridSize,
  onGridSizeChange,
}) => {
  const tools = [
    { id: 'select', name: 'Select', icon: MousePointer },
    { id: 'wall', name: 'Wall', icon: Square },
    { id: 'door', name: 'Door', icon: DoorOpen },
    { id: 'window', name: 'Window', icon: RectangleHorizontal },
    { id: 'room', name: 'Room', icon: Home },
    { id: 'annotation', name: 'Note', icon: Type },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                className={`w-full justify-start ${
                  selectedTool === tool.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => onToolSelect(tool.id)}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {tool.name}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Grid Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="gridSize" className="text-xs">Grid Size (px)</Label>
            <Input
              id="gridSize"
              type="number"
              value={gridSize}
              onChange={(e) => onGridSizeChange(Number(e.target.value))}
              min="10"
              max="50"
              step="5"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p><strong>Select:</strong> Click to select and move elements</p>
          <p><strong>Draw:</strong> Click and drag to create shapes</p>
          <p><strong>Delete:</strong> Select element and press Delete key</p>
          <p><strong>Grid:</strong> Elements snap to grid for alignment</p>
        </CardContent>
      </Card>
    </div>
  );
};