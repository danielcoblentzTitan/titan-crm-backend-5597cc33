import { ImageBasedColorSelector } from './ImageBasedColorSelector';

interface TileFlooringSelectorProps {
  selectedRoom: string;
  selections: { [key: string]: any };
  onColorSelect: (roomPrefix: string, colorName: string) => void;
  isEditing: boolean;
}

export const TileFlooringSelector = ({ selectedRoom, selections, onColorSelect, isEditing }: TileFlooringSelectorProps) => {
  const colors = [
    { name: "Alamosa Beige", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/alamosa-beige-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/alamosa-beige-room.png" },
    { name: "Alamosa Gray", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/alamosa-gray-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/alamosa-gray-room.png" },
    { name: "Colorado Gray", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/colorado-gray-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/colorado-gray-room.png" },
    { name: "Bianco Carrara", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/bianco-carrara-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/bianco-carrara-room.png" },
    { name: "Harbor Gray", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/harbor-gray-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/tile/harbor-gray-room.png" }
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