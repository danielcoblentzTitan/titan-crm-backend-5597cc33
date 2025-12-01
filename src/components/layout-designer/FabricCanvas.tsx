import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Rect, Line, Circle, Path, Group, FabricObject } from 'fabric';
import { toast } from 'sonner';
import { Module } from './data/ModuleLibrary';

interface ArchitecturalElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'module' | 'fixture' | 'dimension';
  properties: Record<string, any>;
}

interface FabricCanvasProps {
  selectedTool: string;
  selectedElement: ArchitecturalElement | null;
  onElementSelect: (element: ArchitecturalElement | null) => void;
  onElementUpdate: (id: string, updates: Partial<ArchitecturalElement>) => void;
  elements: ArchitecturalElement[];
  gridSize: number;
  selectedModule?: Module | null;
  selectedVariant?: string | null;
}

export interface FabricCanvasRef {
  exportAsImage: () => string | null;
  clear: () => void;
}

export const EnhancedFabricCanvas = forwardRef<FabricCanvasRef, FabricCanvasProps>(
  ({ selectedTool, selectedElement, onElementSelect, onElementUpdate, elements, gridSize, selectedModule, selectedVariant }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [isDrawingWall, setIsDrawingWall] = useState(false);
    const [wallStartPoint, setWallStartPoint] = useState<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
      exportAsImage: () => {
        if (!fabricCanvas) return null;
        return fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
      },
      clear: () => {
        if (!fabricCanvas) return;
        fabricCanvas.clear();
        drawGrid();
      }
    }));

    const snapToGrid = (value: number) => {
      return Math.round(value / gridSize) * gridSize;
    };

    const drawGrid = () => {
      if (!fabricCanvas) return;
      
      // Remove existing grid
      const gridObjects = fabricCanvas.getObjects().filter(obj => (obj as any).data?.name === 'grid');
      gridObjects.forEach(obj => fabricCanvas.remove(obj));

      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();

      // Draw vertical grid lines
      for (let x = 0; x <= canvasWidth; x += gridSize) {
        const line = new Line([x, 0, x, canvasHeight], {
          stroke: '#e5e7eb',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          data: { name: 'grid' }
        });
        fabricCanvas.add(line);
      }

      // Draw horizontal grid lines
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        const line = new Line([0, y, canvasWidth, y], {
          stroke: '#e5e7eb',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          data: { name: 'grid' }
        });
        fabricCanvas.add(line);
      }

      fabricCanvas.renderAll();
    };

    const createWall = (x1: number, y1: number, x2: number, y2: number) => {
      const wall = new Line([x1, y1, x2, y2], {
        stroke: '#000000',
        strokeWidth: 8,
        strokeLineCap: 'round',
        selectable: true,
        data: { name: 'wall' }
      });

      fabricCanvas?.add(wall);
      return wall;
    };

    const createDoor = (x: number, y: number, angle: number = 0) => {
      const doorWidth = 80;
      const doorThickness = 6;
      
      // Door frame
      const doorFrame = new Rect({
        left: x,
        top: y,
        width: doorWidth,
        height: doorThickness,
        fill: '#000000',
        selectable: true,
        data: { name: 'door' }
      });

      // Door swing arc
      const swingPath = `M ${x + doorWidth} ${y + doorThickness/2} A ${doorWidth} ${doorWidth} 0 0 1 ${x + doorWidth/2} ${y - doorWidth + doorThickness/2}`;
      const doorSwing = new Path(swingPath, {
        stroke: '#9ca3af',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        fill: '',
        selectable: false,
        data: { name: 'door-swing' }
      });

      // Group door elements
      const doorGroup = new Group([doorFrame, doorSwing], {
        left: x,
        top: y,
        angle: angle,
        selectable: true
      });
      (doorGroup as any).data = { name: 'door-group' };

      fabricCanvas?.add(doorGroup);
      return doorGroup;
    };

    const createWindow = (x: number, y: number) => {
      const windowWidth = 60;
      const windowHeight = 6;
      
      // Window frame
      const windowFrame = new Rect({
        left: x,
        top: y,
        width: windowWidth,
        height: windowHeight,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 3,
        selectable: true,
        data: { name: 'window' }
      });

      // Window panes (cross pattern)
      const verticalPane = new Line([x + windowWidth/2, y, x + windowWidth/2, y + windowHeight], {
        stroke: '#000000',
        strokeWidth: 1,
        selectable: false
      });

      const windowGroup = new Group([windowFrame, verticalPane], {
        left: x,
        top: y,
        selectable: true
      });
      (windowGroup as any).data = { name: 'window-group' };

      fabricCanvas?.add(windowGroup);
      return windowGroup;
    };

    const createRoom = (x: number, y: number, width: number, height: number) => {
      const room = new Rect({
        left: x,
        top: y,
        width: width,
        height: height,
        fill: 'rgba(59, 130, 246, 0.1)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [10, 5],
        selectable: true,
        data: { name: 'room' }
      });

      fabricCanvas?.add(room);
      return room;
    };

    // Function to place a module on canvas
    const placeModule = (module: Module, x: number, y: number) => {
      if (!fabricCanvas) return;

      const moduleGroup = new Group([], {
        left: x,
        top: y,
        selectable: true
      });
      
      // Add custom data to the group
      (moduleGroup as any).data = {
        id: `module_${Date.now()}`,
        name: module.name,
        type: 'module',
        moduleId: module.id
      };

      // Add module walls
      module.walls.forEach(wall => {
        const wallLine = new Line([
          wall.start.x, wall.start.y,
          wall.end.x, wall.end.y
        ], {
          stroke: '#000000',
          strokeWidth: wall.thickness,
          selectable: false
        });
        moduleGroup.add(wallLine);
      });

      // Add module fixtures
      const activeVariant = selectedVariant ? 
        module.variants.find(v => v.id === selectedVariant) : null;
      const fixtures = activeVariant ? activeVariant.fixtures : module.fixtures;

      fixtures.forEach(fixture => {
        const fixtureElement = createModuleFixture(fixture);
        if (fixtureElement) {
          moduleGroup.add(fixtureElement);
        }
      });

      fabricCanvas.add(moduleGroup);
      fabricCanvas.renderAll();
      toast.success(`${module.name} placed successfully`);
    };

    // Function to place an individual fixture
    const placeFixture = (fixture: any, x: number, y: number) => {
      if (!fabricCanvas) return;

      const fixtureRect = new Rect({
        left: x,
        top: y,
        width: fixture.width,
        height: fixture.height,
        fill: 'rgba(59, 130, 246, 0.1)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: true,
        data: {
          id: `fixture_${Date.now()}`,
          name: fixture.name,
          type: 'fixture',
          symbol: fixture.id
        }
      });

      fabricCanvas.add(fixtureRect);
      fabricCanvas.renderAll();
      toast.success(`${fixture.name} placed successfully`);
    };

    // Function to create fixture elements within modules
    const createModuleFixture = (fixture: any) => {
      return new Rect({
        left: fixture.position.x,
        top: fixture.position.y,
        width: fixture.dimensions.width,
        height: fixture.dimensions.height,
        fill: 'rgba(34, 197, 94, 0.1)',
        stroke: '#22c55e',
        strokeWidth: 1,
        selectable: false,
        data: {
          name: fixture.type,
          symbol: fixture.symbol
        }
      });
    };

    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      });

      setFabricCanvas(canvas);
      drawGrid();

      // Handle object selection
      canvas.on('selection:created', (e) => {
        const selectedObj = e.selected?.[0] as FabricObject & { data?: any };
        if (selectedObj && selectedObj.data?.name !== 'grid') {
          const elementType = selectedObj.data?.name?.includes('door') ? 'door' : 
                              selectedObj.data?.name?.includes('window') ? 'window' :
                              selectedObj.data?.name?.includes('wall') ? 'wall' : 
                              selectedObj.data?.name?.includes('module') ? 'module' :
                              selectedObj.data?.name?.includes('fixture') ? 'fixture' : 'room';
          
          onElementSelect({
            id: selectedObj.data?.name || 'unknown',
            type: elementType as any,
            properties: selectedObj.data || {}
          });
        }
      });

      canvas.on('selection:cleared', () => {
        onElementSelect(null);
      });

      // Handle canvas clicks for tool placement
      canvas.on('mouse:down', (e) => {
        if (!e.pointer) return;
        
        const x = snapToGrid(e.pointer.x);
        const y = snapToGrid(e.pointer.y);

        switch (selectedTool) {
          case 'wall':
            if (!isDrawingWall) {
              setWallStartPoint({ x, y });
              setIsDrawingWall(true);
              toast('Click to place the end of the wall');
            } else {
              if (wallStartPoint) {
                createWall(wallStartPoint.x, wallStartPoint.y, x, y);
                setIsDrawingWall(false);
                setWallStartPoint(null);
                toast('Wall created');
              }
            }
            break;
          case 'door':
            createDoor(x, y);
            toast('Door placed');
            break;
          case 'window':
            createWindow(x, y);
            toast('Window placed');
            break;
          case 'room':
            createRoom(x, y, 200, 150);
            toast('Room created');
            break;
          case 'place-module':
            if (selectedModule) {
              placeModule(selectedModule, x, y);
            }
            break;
          case 'place-fixture':
            // Handle individual fixture placement from selected fixture
            break;
        }
      });

      return () => {
        canvas.dispose();
      };
    }, []);

    useEffect(() => {
      if (fabricCanvas) {
        drawGrid();
      }
    }, [gridSize, fabricCanvas]);

    return (
      <div className="border border-border rounded-lg overflow-hidden shadow-lg">
        <canvas 
          ref={canvasRef} 
          className="block"
          style={{ cursor: isDrawingWall || selectedTool.includes('place') ? 'crosshair' : 'default' }}
        />
        {(isDrawingWall || selectedTool.includes('place')) && (
          <div className="absolute bottom-4 left-4 bg-background border border-border rounded-md p-2 text-sm">
            {isDrawingWall ? 'Drawing wall... Click to place end point' : 
             selectedTool === 'place-module' ? `Placing ${selectedModule?.name || 'module'}... Click to place` :
             'Click to place item'}
          </div>
        )}
      </div>
    );
  }
);

EnhancedFabricCanvas.displayName = 'EnhancedFabricCanvas';