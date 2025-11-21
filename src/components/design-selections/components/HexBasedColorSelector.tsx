interface ColorOption {
  name: string;
  hex: string;
}

interface HexBasedColorSelectorProps {
  colors: ColorOption[];
  selectedRoom: string;
  selections: { [key: string]: any };
  onColorSelect: (roomPrefix: string, colorName: string) => void;
  isEditing: boolean;
}

export const HexBasedColorSelector = ({ 
  colors, 
  selectedRoom, 
  selections, 
  onColorSelect,
  isEditing 
}: HexBasedColorSelectorProps) => {
  const colorSelectionKey = `${selectedRoom}_flooring_color`;

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
      {colors.map((color, index) => {
        const isColorSelected = selections[colorSelectionKey] === color.name.toLowerCase().replace(/\s+/g, '_');
        
        return (
          <div 
            key={index}
            className={`cursor-pointer group ${isColorSelected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
            onClick={() => {
              if (isEditing) {
                onColorSelect(selectedRoom, color.name);
              }
            }}
          >
            <div className={`border-2 rounded-lg p-2 transition-all hover:scale-105 ${
              isColorSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
            }`}>
              <div 
                className="w-full h-16 rounded-md border border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              <p className="text-xs text-center mt-2 font-medium">
                {color.name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};