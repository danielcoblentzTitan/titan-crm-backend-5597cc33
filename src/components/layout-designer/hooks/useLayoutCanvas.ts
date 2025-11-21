import { useState, useRef, useCallback } from 'react';

interface LayoutElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'annotation';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
}

export const useLayoutCanvas = () => {
  const [elements, setElements] = useState<LayoutElement[]>([]);
  const [gridSize, setGridSize] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addElement = useCallback((elementData: Omit<LayoutElement, 'id'>) => {
    const newElement: LayoutElement = {
      ...elementData,
      id: generateId(),
    };
    setElements(prev => [...prev, newElement]);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<LayoutElement>) => {
    setElements(prev => prev.map(element => 
      element.id === id 
        ? { ...element, ...updates }
        : element
    ));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(element => element.id !== id));
  }, []);

  const clearCanvas = useCallback(() => {
    setElements([]);
  }, []);

  const loadElements = useCallback((newElements: LayoutElement[]) => {
    setElements(newElements);
  }, []);

  return {
    elements,
    addElement,
    updateElement,
    deleteElement,
    clearCanvas,
    loadElements,
    canvasRef,
    gridSize,
    setGridSize,
  };
};