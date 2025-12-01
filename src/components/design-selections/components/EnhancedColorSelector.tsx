import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ColorOption {
  name: string;
  code: string;
  hex: string;
  category?: string;
}

interface EnhancedColorSelectorProps {
  colors: ColorOption[];
  selectedValue: string;
  onColorSelect: (colorValue: string) => void;
  isEditing: boolean;
  componentId: string;
}

export const EnhancedColorSelector = ({ 
  colors, 
  selectedValue, 
  onColorSelect, 
  isEditing,
  componentId 
}: EnhancedColorSelectorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const handleColorSelect = (color: ColorOption) => {
    console.log('EnhancedColorSelector - handleColorSelect called:', { color, isEditing });
    if (!isEditing) return;
    try {
      const colorValue = `${color.name} (${color.code})`;
      console.log('EnhancedColorSelector - calling onColorSelect with:', colorValue);
      onColorSelect(colorValue);
    } catch (error) {
      console.error('EnhancedColorSelector - Error in handleColorSelect:', error);
    }
  };

  const openModal = (colorIndex: number) => {
    console.log('EnhancedColorSelector - openModal called:', { colorIndex, colorsLength: colors.length });
    if (colorIndex >= 0 && colorIndex < colors.length) {
      setSelectedColorIndex(colorIndex);
      setIsModalOpen(true);
    } else {
      console.error('EnhancedColorSelector - Invalid colorIndex:', colorIndex);
    }
  };

  const navigateColor = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedColorIndex(prev => prev === 0 ? colors.length - 1 : prev - 1);
    } else {
      setSelectedColorIndex(prev => prev === colors.length - 1 ? 0 : prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      navigateColor('prev');
    } else if (e.key === 'ArrowRight') {
      navigateColor('next');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (colors[selectedColorIndex]) {
        handleColorSelect(colors[selectedColorIndex]);
        setIsModalOpen(false);
      }
    }
  };

  const getTooltipMessage = (colorName: string, category?: string) => {
    if (colorName === "Copper Metallic") return "This color will be an increase in price";
    if (colorName === "Galvalume") return "This color only has a 20-year warranty";
    if (category === "textured") return "Upgraded product. Price will be provided if selection has been made";
    return null;
  };

  const currentColor = colors[selectedColorIndex];

  if (!colors || colors.length === 0) {
    console.error('EnhancedColorSelector - No colors provided');
    return <div>No colors available</div>;
  }

  return (
    <>
      {/* Compact Circular Color Grid */}
      <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
        {colors.map((color, colorIndex) => {
          try {
            console.log('EnhancedColorSelector - rendering color:', { color, colorIndex, selectedValue, componentId });
            
            if (!color || !color.name || !color.code || !color.hex) {
              console.error('EnhancedColorSelector - Invalid color object:', color);
              return null;
            }
            
            const isSelected = selectedValue === `${color.name} (${color.code})`;
            const tooltipMessage = getTooltipMessage(color.name, color.category);
          
            const colorSwatch = (
              <div 
                className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                onClick={() => {
                  console.log('EnhancedColorSelector - color swatch clicked:', { color, colorIndex });
                  handleColorSelect(color);
                }}
              >
                {/* Circular Color Swatch */}
                <div className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ease-in-out hover:scale-110 ${
                  isSelected ? 'border-primary shadow-lg' : 'border-gray-300 hover:border-gray-500'
                } transform-gpu will-change-transform`} style={{ backfaceVisibility: 'hidden' }}>
                  <div 
                    className="w-full h-full rounded-full relative overflow-hidden transform-gpu"
                    style={{ 
                      backgroundColor: color.hex,
                      backfaceVisibility: 'hidden',
                      transform: 'translateZ(0)'
                    }}
                  >
                    {/* White border for light colors */}
                    {(color.hex === '#FFFFFF' || color.hex === '#F8F8FF' || color.hex === '#FFFFF0') && (
                      <div className="absolute inset-0 border border-gray-400 rounded-full" />
                    )}
                    
                    {/* Eye icon for modal view - smaller and more subtle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        console.log('EnhancedColorSelector - eye button clicked:', { colorIndex });
                        e.stopPropagation();
                        openModal(colorIndex);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100 rounded-full"
                    >
                      <Eye size={10} className="text-white drop-shadow-lg" />
                    </button>
                  </div>
                </div>

                {/* Premium color indicator */}
                {color.category === "premium" && (
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                )}

                {/* Textured color indicator */}
                {color.category === "textured" && (
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">T</span>
                  </div>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}

                {/* Hidden input for form submission */}
                <input 
                  type="hidden" 
                  name={`${componentId}_color`} 
                  value={isSelected ? `${color.name} (${color.code})` : ''}
                />
              </div>
            );

            // Wrap with tooltip for color name on hover
            const tooltipContent = tooltipMessage ? 
              `${color.name} - ${tooltipMessage}` : 
              `${color.name} (${color.code})`;

            return (
              <TooltipProvider key={`color-${colorIndex}-${color.name}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      {colorSwatch}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltipContent}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          } catch (error) {
            console.error('EnhancedColorSelector - Error rendering color:', error, color);
            return null;
          }
        }).filter(Boolean)}
      </div>

      {/* Enhanced Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="max-w-2xl w-full max-h-[80vh] flex flex-col"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Color Selection - {currentColor?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {/* Large Color Display */}
            <div className="relative">
              <div 
                className="w-80 h-60 rounded-lg border-4 border-gray-200 shadow-lg"
                style={{ backgroundColor: currentColor?.hex }}
              />
              {currentColor?.hex === '#FFFFFF' && (
                <div className="absolute inset-0 border border-gray-300 rounded-lg" />
              )}
            </div>

            {/* Color Information */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">{currentColor?.name}</h3>
              <p className="text-lg text-gray-600">Code: {currentColor?.code}</p>
              <p className="text-sm text-gray-500">Hex: {currentColor?.hex}</p>
              {currentColor?.category && (
                <p className="text-sm text-gray-500">Category: {currentColor.category}</p>
              )}
              {currentColor?.category === "premium" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                  <p className="text-sm font-medium text-orange-800">Premium Color</p>
                  <p className="text-xs text-orange-600">This color will add additional cost to your project</p>
                </div>
              )}
              {currentColor?.category === "textured" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <p className="text-sm font-medium text-blue-800">Textured Finish</p>
                  <p className="text-xs text-blue-600">Upgraded product. Price will be provided if selection has been made</p>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateColor('prev')}
                className="flex items-center space-x-2"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </Button>
              
              <span className="text-sm text-gray-500">
                {selectedColorIndex + 1} of {colors.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateColor('next')}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  if (currentColor) {
                    handleColorSelect(currentColor);
                    setIsModalOpen(false);
                  }
                }}
                disabled={!isEditing || !currentColor}
                className="px-6"
              >
                Select This Color
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
          
          {/* Keyboard Hints */}
          <div className="text-xs text-gray-500 text-center space-x-4">
            <span>← → Navigate</span>
            <span>Enter/Space Select</span>
            <span>Esc Close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};