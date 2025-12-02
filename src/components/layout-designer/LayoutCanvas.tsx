import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useLayoutElements } from './hooks/useLayoutElements';

interface LayoutElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'annotation';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
}

interface LayoutCanvasProps {
  elements: LayoutElement[];
  selectedTool: string;
  selectedElement: LayoutElement | null;
  gridSize: number;
  onAddElement: (element: Omit<LayoutElement, 'id'>) => void;
  onUpdateElement: (id: string, updates: Partial<LayoutElement>) => void;
  onSelectElement: (element: LayoutElement | null) => void;
  onDeleteElement: (id: string) => void;
}

export const LayoutCanvas = forwardRef<HTMLCanvasElement, LayoutCanvasProps>(({
  elements,
  selectedTool,
  selectedElement,
  gridSize,
  onAddElement,
  onUpdateElement,
  onSelectElement,
  onDeleteElement,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  const [dragElement, setDragElement] = React.useState<LayoutElement | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  useImperativeHandle(ref, () => canvasRef.current!, []);

  const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize;

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: LayoutElement, isSelected: boolean = false) => {
    ctx.save();

    switch (element.type) {
      case 'wall':
        ctx.fillStyle = isSelected ? '#3b82f6' : '#6b7280';
        ctx.fillRect(element.x, element.y, element.width, element.height);
        break;
      
      case 'door':
        ctx.fillStyle = isSelected ? '#10b981' : '#8b5cf6';
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        break;
      
      case 'window':
        ctx.fillStyle = isSelected ? '#06b6d4' : '#0ea5e9';
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(element.x + 2, element.y + 2, element.width - 4, element.height - 4);
        break;
      
      case 'room':
        ctx.strokeStyle = isSelected ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        ctx.setLineDash([]);
        
        if (element.properties.label) {
          ctx.fillStyle = '#374151';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            element.properties.label,
            element.x + element.width / 2,
            element.y + element.height / 2
          );
        }
        break;
      
      case 'annotation':
        if (element.properties.text) {
          ctx.fillStyle = isSelected ? '#dc2626' : '#374151';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(element.properties.text, element.x, element.y);
        }
        break;
    }

    // Draw selection outline
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
      ctx.setLineDash([]);
    }

    ctx.restore();
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw elements
    elements.forEach(element => {
      const isSelected = selectedElement?.id === element.id;
      drawElement(ctx, element, isSelected);
    });
  };

  useEffect(() => {
    render();
  }, [elements, selectedElement, gridSize]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findElementAt = (x: number, y: number): LayoutElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      ) {
        return element;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const snappedX = snapToGrid(pos.x);
    const snappedY = snapToGrid(pos.y);

    if (selectedTool === 'select') {
      const element = findElementAt(pos.x, pos.y);
      if (element) {
        onSelectElement(element);
        setDragElement(element);
        setDragOffset({
          x: pos.x - element.x,
          y: pos.y - element.y,
        });
      } else {
        onSelectElement(null);
      }
    } else {
      setIsDrawing(true);
      setStartPos({ x: snappedX, y: snappedY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (dragElement) {
      const newX = snapToGrid(pos.x - dragOffset.x);
      const newY = snapToGrid(pos.y - dragOffset.y);
      
      onUpdateElement(dragElement.id, { x: newX, y: newY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDrawing) {
      const pos = getMousePos(e);
      const snappedX = snapToGrid(pos.x);
      const snappedY = snapToGrid(pos.y);

      const width = Math.abs(snappedX - startPos.x);
      const height = Math.abs(snappedY - startPos.y);
      
      if (width > gridSize && height > gridSize) {
        const x = Math.min(startPos.x, snappedX);
        const y = Math.min(startPos.y, snappedY);

        const defaultProperties = {
          wall: { thickness: 6 },
          door: { type: 'swing', direction: 'right' },
          window: { type: 'standard', frame: 'wood' },
          room: { label: 'Room' },
          annotation: { text: 'Note' },
        };

        onAddElement({
          type: selectedTool as any,
          x,
          y,
          width,
          height,
          properties: defaultProperties[selectedTool as keyof typeof defaultProperties] || {},
        });
      }
    }

    setIsDrawing(false);
    setDragElement(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedElement) {
      onDeleteElement(selectedElement.id);
      onSelectElement(null);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border cursor-crosshair focus:outline-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    />
  );
});

LayoutCanvas.displayName = 'LayoutCanvas';