import { ImageBasedColorSelector } from './ImageBasedColorSelector';

interface LVPFlooringSelectorProps {
  selectedRoom: string;
  selections: { [key: string]: any };
  onColorSelect: (roomPrefix: string, colorName: string) => void;
  isEditing: boolean;
}

export const LVPFlooringSelector = ({ selectedRoom, selections, onColorSelect, isEditing }: LVPFlooringSelectorProps) => {
  const colors = [
    { name: "Dove Tail Oak", image: "/lovable-uploads/63cbfb52-ce12-4451-bd1a-aa8613716e84.png", roomImage: "/lovable-uploads/260dd908-7b57-437a-b106-b037f2653571.png" },
    { name: "Forged Oak", image: "/lovable-uploads/38d0a6c8-28d3-4cfc-99a9-f81ea7478904.png", roomImage: "/lovable-uploads/dc4fa0ad-9c1e-4713-81d8-754d68003091.png" },
    { name: "Charleston Oak", image: "/lovable-uploads/79b5b1ab-a146-4d70-b081-e986bb1fd2fd.png", roomImage: "/lovable-uploads/4d20d1d5-a760-4880-8478-42ef8d896d0e.png" },
    { name: "Ashen Oak", image: "/lovable-uploads/e875e7dd-e96c-420b-922f-e1ecf43cf189.png", roomImage: "/lovable-uploads/2fd45fd7-a1cc-4bec-88a1-10dd7b6d8e3b.png" },
    { name: "Catskill Pine", image: "/lovable-uploads/c474068b-9e2f-4f35-a6fb-ec4131e98818.png", roomImage: "/lovable-uploads/fcd25987-1b89-4d60-8953-24c238f17026.png" },
    { name: "English Grove Oak", image: "/lovable-uploads/91e4d607-1f3b-4fbe-995d-c3c97781e0bb.png", roomImage: "/lovable-uploads/73a9dbab-46ae-49d5-b957-6f473d600946.png" },
    { name: "Jamestown Hickory", image: "/lovable-uploads/c18c672b-84fb-4bab-8097-48389c642dfe.png", roomImage: "/lovable-uploads/80ea668a-08f6-467b-b833-7151973118b9.png" },
    { name: "Sisal Oak", image: "/lovable-uploads/ad83d1dd-b77d-4d14-881b-84af87361211.png", roomImage: "/lovable-uploads/4a467de8-c2c9-4fac-aa0a-fa14f782b4cf.png" },
    { name: "Penny Oak", image: "/lovable-uploads/1e37a94c-38c4-4adc-8b75-c7e584ff9ec5.png", roomImage: "/lovable-uploads/1d14f0ba-451f-4189-8c4c-78fde6297fd4.png" },
    { name: "Coir Oak", image: "/lovable-uploads/2c55b555-54ea-4cb8-b11a-07d799b57b76.png", roomImage: "/lovable-uploads/383f9226-6064-4711-b00f-78a9aaad20bb.png" }
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