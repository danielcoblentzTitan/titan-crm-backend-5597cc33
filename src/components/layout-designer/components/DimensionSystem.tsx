import React, { useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Line, Text, Group } from 'fabric';

interface DimensionLine {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  value: number; // in inches
  orientation: 'horizontal' | 'vertical';
  offset: number; // distance from measured object
}

interface DimensionSystemProps {
  canvas: FabricCanvas | null;
  isEnabled: boolean;
  units: 'inches' | 'feet' | 'meters';
}

export const useDimensionSystem = ({
  canvas,
  isEnabled,
  units
}) => {
  const [dimensions, setDimensions] = useState<DimensionLine[]>([]);
  const [isDimensioning, setIsDimensioning] = useState(false);

  // Convert pixels to real-world units (assuming 1 inch = 12 pixels)
  const pixelsToUnits = useCallback((pixels: number) => {
    const inches = pixels / 12;
    switch (units) {
      case 'feet':
        return inches / 12;
      case 'meters':
        return inches * 0.0254;
      default:
        return inches;
    }
  }, [units]);

  // Format dimension value for display
  const formatDimension = useCallback((value: number) => {
    switch (units) {
      case 'feet':
        const feet = Math.floor(value);
        const inches = Math.round((value - feet) * 12);
        return inches > 0 ? `${feet}'-${inches}"` : `${feet}'`;
      case 'meters':
        return `${value.toFixed(2)}m`;
      default:
        return `${Math.round(value)}"`;
    }
  }, [units]);

  // Create dimension line on canvas
  const createDimensionLine = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (!canvas) return;

    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const realDistance = pixelsToUnits(distance);
    const orientation = Math.abs(end.x - start.x) > Math.abs(end.y - start.y) ? 'horizontal' : 'vertical';
    
    // Calculate offset for dimension line
    const offset = 30;
    let lineStart, lineEnd, textPos;

    if (orientation === 'horizontal') {
      const y = Math.min(start.y, end.y) - offset;
      lineStart = { x: start.x, y };
      lineEnd = { x: end.x, y };
      textPos = { x: (start.x + end.x) / 2, y: y - 10 };
    } else {
      const x = Math.min(start.x, end.x) - offset;
      lineStart = { x, y: start.y };
      lineEnd = { x, y: end.y };
      textPos = { x: x - 20, y: (start.y + end.y) / 2 };
    }

    // Create dimension line
    const dimensionLine = new Line([lineStart.x, lineStart.y, lineEnd.x, lineEnd.y], {
      stroke: '#ff6b35',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      strokeDashArray: [5, 5]
    });

    // Create extension lines
    const extension1 = new Line([start.x, start.y, lineStart.x, lineStart.y], {
      stroke: '#ff6b35',
      strokeWidth: 1,
      selectable: false,
      evented: false
    });

    const extension2 = new Line([end.x, end.y, lineEnd.x, lineEnd.y], {
      stroke: '#ff6b35',
      strokeWidth: 1,
      selectable: false,
      evented: false
    });

    // Create dimension text
    const dimensionText = new Text(formatDimension(realDistance), {
      left: textPos.x,
      top: textPos.y,
      fontSize: 12,
      fill: '#ff6b35',
      fontFamily: 'Arial',
      textAlign: 'center',
      selectable: false,
      evented: false
    });

    // Group all dimension elements
    const dimensionGroup = new Group([dimensionLine, extension1, extension2, dimensionText], {
      selectable: false,
      evented: false
    });

    (dimensionGroup as any).data = { type: 'dimension', id: `dim_${Date.now()}` };

    canvas.add(dimensionGroup);
    canvas.renderAll();

    // Store dimension data
    const newDimension: DimensionLine = {
      id: `dim_${Date.now()}`,
      start,
      end,
      value: realDistance,
      orientation,
      offset
    };

    setDimensions(prev => [...prev, newDimension]);
  }, [canvas, pixelsToUnits, formatDimension]);

  // Clear all dimensions
  const clearDimensions = useCallback(() => {
    if (!canvas) return;

    const dimensionObjects = canvas.getObjects().filter(obj => (obj as any).data?.type === 'dimension');
    dimensionObjects.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    setDimensions([]);
  }, [canvas]);

  // Auto-dimension selected object
  const autoDimension = useCallback((object: any) => {
    if (!canvas || !object) return;

    const bounds = object.getBoundingRect();
    
    // Create horizontal dimension
    createDimensionLine(
      { x: bounds.left, y: bounds.top + bounds.height },
      { x: bounds.left + bounds.width, y: bounds.top + bounds.height }
    );

    // Create vertical dimension  
    createDimensionLine(
      { x: bounds.left, y: bounds.top },
      { x: bounds.left, y: bounds.top + bounds.height }
    );
  }, [canvas, createDimensionLine]);

  return {
    createDimensionLine,
    clearDimensions,
    autoDimension,
    dimensions,
    isDimensioning,
    setIsDimensioning,
    formatDimension,
    pixelsToUnits
  };
};