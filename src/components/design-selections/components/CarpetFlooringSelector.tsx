import { ImageBasedColorSelector } from './ImageBasedColorSelector';

interface CarpetFlooringSelectorProps {
  selectedRoom: string;
  selections: { [key: string]: any };
  onColorSelect: (roomPrefix: string, colorName: string) => void;
  isEditing: boolean;
}

export const CarpetFlooringSelector = ({ selectedRoom, selections, onColorSelect, isEditing }: CarpetFlooringSelectorProps) => {
  const colors = [
    { name: "Ash Gray", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/ash-gray-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/ash-gray-room.png" },
    { name: "Gaucho Brown", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/gaucho-brown-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/gaucho-brown-room.png" },
    { name: "Heartwarmer Mist", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/heartwarmer-mist-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/heartwarmer-mist-room.png" },
    { name: "Heirloom Gray", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/heirloom-gray-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/heirloom-gray-room.png" },
    { name: "Smoke Embers Gray", image: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/smoke-embers-gray-sample.png", roomImage: "https://rviwdobaeyhnwzkinefj.supabase.co/storage/v1/object/public/design-options/carpet/smoke-embers-gray-room.png" }
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