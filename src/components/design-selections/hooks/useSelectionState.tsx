import { useCallback } from 'react';

interface SelectionData {
  [key: string]: any;
}

interface UseSelectionStateProps {
  selections: SelectionData;
  setSelections: (selections: SelectionData) => void;
  isEditing: boolean;
}

export const useSelectionState = ({ selections, setSelections, isEditing }: UseSelectionStateProps) => {
  const updateSelection = useCallback((key: string, value: any) => {
    if (!isEditing) return;
    
    const newSelections = { ...selections };
    newSelections[key] = value;
    setSelections(newSelections);
  }, [selections, setSelections, isEditing]);

  const updateColorSelection = useCallback((roomPrefix: string, colorName: string) => {
    if (!isEditing) return;
    
    const colorSelectionKey = `${roomPrefix}_flooring_color`;
    const customColorKey = `${roomPrefix}_flooring_custom_color`;
    
    const newSelections = { ...selections };
    newSelections[colorSelectionKey] = colorName.toLowerCase().replace(/\s+/g, '_');
    // Clear custom color when selecting standard color
    newSelections[customColorKey] = '';
    setSelections(newSelections);
  }, [selections, setSelections, isEditing]);

  const updateCustomColor = useCallback((roomPrefix: string, color: string) => {
    if (!isEditing) return;
    
    const colorSelectionKey = `${roomPrefix}_flooring_color`;
    const customColorKey = `${roomPrefix}_flooring_custom_color`;
    
    const newSelections = { ...selections };
    newSelections[customColorKey] = color;
    // Clear standard color when entering custom color
    newSelections[colorSelectionKey] = '';
    setSelections(newSelections);
  }, [selections, setSelections, isEditing]);

  return {
    updateSelection,
    updateColorSelection,
    updateCustomColor
  };
};