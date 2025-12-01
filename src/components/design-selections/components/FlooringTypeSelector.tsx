import { LVPFlooringSelector } from './LVPFlooringSelector';
import { HardwoodFlooringSelector } from './HardwoodFlooringSelector';
import { TileFlooringSelector } from './TileFlooringSelector';
import { CarpetFlooringSelector } from './CarpetFlooringSelector';
import { HexBasedColorSelector } from './HexBasedColorSelector';

interface FlooringTypeSelectorProps {
  flooringType: string;
  selectedRoom: string;
  selections: { [key: string]: any };
  onColorSelect: (roomPrefix: string, colorName: string) => void;
  isEditing: boolean;
}

export const FlooringTypeSelector = ({ 
  flooringType, 
  selectedRoom, 
  selections, 
  onColorSelect, 
  isEditing 
}: FlooringTypeSelectorProps) => {
  switch (flooringType) {
    case 'luxury_vinyl':
      return (
        <LVPFlooringSelector
          selectedRoom={selectedRoom}
          selections={selections}
          onColorSelect={onColorSelect}
          isEditing={isEditing}
        />
      );
    
    case 'laminate':
      return (
        <HexBasedColorSelector
          colors={[
            { name: "Natural Oak", hex: "#D2B48C" },
            { name: "Rustic Pine", hex: "#DEB887" },
            { name: "Cherry Wood", hex: "#D2691E" },
            { name: "Walnut", hex: "#8B4513" },
            { name: "Maple", hex: "#F5DEB3" },
            { name: "Mahogany", hex: "#C04000" },
            { name: "Ash Gray", hex: "#B2BEB5" },
            { name: "Bamboo", hex: "#E3DAC9" },
            { name: "Hickory", hex: "#C19A6B" },
            { name: "Espresso", hex: "#6F4E37" }
          ]}
          selectedRoom={selectedRoom}
          selections={selections}
          onColorSelect={onColorSelect}
          isEditing={isEditing}
        />
      );
    
    case 'hardwood':
      return (
        <HardwoodFlooringSelector
          selectedRoom={selectedRoom}
          selections={selections}
          onColorSelect={onColorSelect}
          isEditing={isEditing}
        />
      );
    
    case 'tile':
      return (
        <TileFlooringSelector
          selectedRoom={selectedRoom}
          selections={selections}
          onColorSelect={onColorSelect}
          isEditing={isEditing}
        />
      );
    
    case 'carpet':
      return (
        <CarpetFlooringSelector
          selectedRoom={selectedRoom}
          selections={selections}
          onColorSelect={onColorSelect}
          isEditing={isEditing}
        />
      );
    
    case 'polished_concrete':
      return (
        <HexBasedColorSelector
          colors={[
            { name: "Natural Gray", hex: "#8C8C8C" },
            { name: "Charcoal", hex: "#36454F" },
            { name: "Light Gray", hex: "#D3D3D3" },
            { name: "White", hex: "#F8F8FF" },
            { name: "Warm Gray", hex: "#A0A0A0" }
          ]}
          selectedRoom={selectedRoom}
          selections={selections}
          onColorSelect={onColorSelect}
          isEditing={isEditing}
        />
      );
    
    default:
      return <div className="text-center text-gray-500">Please select a flooring type</div>;
  }
};