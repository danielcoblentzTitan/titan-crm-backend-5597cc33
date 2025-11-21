import { ImageBasedColorSelector } from './ImageBasedColorSelector';

interface HardwoodFlooringSelectorProps {
  selectedRoom: string;
  selections: { [key: string]: any };
  onColorSelect: (roomPrefix: string, colorName: string) => void;
  isEditing: boolean;
}

export const HardwoodFlooringSelector = ({ selectedRoom, selections, onColorSelect, isEditing }: HardwoodFlooringSelectorProps) => {
  const colors = [
    { name: "Wheat", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/wheat-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/wheat-room.png" },
    { name: "Linen", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/linen-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/linen-room.png" },
    { name: "Ochre", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/ochre-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/ochre-room.png" },
    { name: "Feather", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/feather-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/feather-room.png" },
    { name: "Amber", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/amber-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/hardwood/amber-room.png" }
  ];

  return (
    <ImageBasedColorSelector
      colors={colors}
      selectedRoom={selectedRoom}
      selections={selections}
      onColorSelect={onColorSelect}
      isEditing={isEditing}
    />
  );
};