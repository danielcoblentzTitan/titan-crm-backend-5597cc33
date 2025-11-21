import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ColorOption {
  name: string;
  image: string;
  roomImage?: string;
}

interface ImageBasedColorSelectorProps {
  colors: ColorOption[];
  selectedRoom: string;
  selections: { [key: string]: any };
  onColorSelect: (roomPrefix: string, colorName: string) => void;
  isEditing: boolean;
}

export const ImageBasedColorSelector = ({ 
  colors, 
  selectedRoom, 
  selections, 
  onColorSelect,
  isEditing 
}: ImageBasedColorSelectorProps) => {
  const colorSelectionKey = `${selectedRoom}_flooring_color`;

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
      {colors.map((color, index) => {
        const isColorSelected = selections[colorSelectionKey] === color.name.toLowerCase().replace(/\s+/g, '_');
        
        return (
          <div 
            key={index}
            className={`relative cursor-pointer group ${isColorSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => {
              if (isEditing) {
                onColorSelect(selectedRoom, color.name);
              }
            }}
          >
            <div className={`border-2 rounded-lg overflow-hidden transition-all hover:scale-105 ${
              isColorSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
            }`}>
              <div className="aspect-square">
                <img
                  src={color.image}
                  alt={color.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Room view icon - only show if roomImage exists */}
              {color.roomImage && (
                <div className="absolute top-2 right-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div 
                        className="bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-center">{color.name} - Room View</h3>
                        <div className="flex justify-center">
                          <img
                            src={color.roomImage}
                            alt={`${color.name} room view`}
                            className="max-w-full max-h-[70vh] object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            
            <p className="text-xs text-center mt-2 font-medium">
              {color.name}
            </p>
          </div>
        );
      })}
    </div>
  );
};