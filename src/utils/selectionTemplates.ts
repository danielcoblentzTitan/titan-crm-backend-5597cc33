import { Database } from "@/integrations/supabase/types";

type SelectionItem = Database["public"]["Tables"]["selection_items"]["Insert"];

interface TemplateItem {
  label: string;
  description?: string;
  category: string;
  trade: string;
  unit?: string;
  material_type?: string;
}

const kitchenTemplates: TemplateItem[] = [
  { label: "Base Cabinets", category: "Cabinets", trade: "Cabinets & Countertops", unit: "linear ft", material_type: "Wood" },
  { label: "Upper Cabinets", category: "Cabinets", trade: "Cabinets & Countertops", unit: "linear ft", material_type: "Wood" },
  { label: "Island Cabinets", category: "Cabinets", trade: "Cabinets & Countertops", unit: "each", material_type: "Wood" },
  { label: "Countertops", category: "Countertops", trade: "Cabinets & Countertops", unit: "sq ft", material_type: "Granite" },
  { label: "Backsplash", category: "Backsplash", trade: "Tile", unit: "sq ft", material_type: "Tile" },
  { label: "Kitchen Sink", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Kitchen Faucet", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Pendant Lights", category: "Lighting", trade: "Electrical", unit: "each" },
  { label: "Recessed Lights", category: "Lighting", trade: "Electrical", unit: "each" },
  { label: "Flooring", category: "Flooring", trade: "Flooring", unit: "sq ft" },
  { label: "Paint - Walls", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Paint - Ceiling", category: "Paint", trade: "Paint", unit: "gallon" },
];

const bathroomTemplates: TemplateItem[] = [
  { label: "Vanity Cabinet", category: "Cabinets", trade: "Cabinets & Countertops", unit: "each" },
  { label: "Vanity Countertop", category: "Countertops", trade: "Cabinets & Countertops", unit: "sq ft" },
  { label: "Vanity Faucet", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Shower Valve", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Shower Head", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Shower Niche", category: "Shower", trade: "Tile", unit: "each" },
  { label: "Shower Floor Tile", category: "Tile", trade: "Tile", unit: "sq ft" },
  { label: "Shower Wall Tile", category: "Tile", trade: "Tile", unit: "sq ft" },
  { label: "Floor Tile", category: "Flooring", trade: "Flooring", unit: "sq ft" },
  { label: "Toilet", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Vanity Lights", category: "Lighting", trade: "Electrical", unit: "each" },
  { label: "Exhaust Fan", category: "HVAC", trade: "HVAC", unit: "each" },
  { label: "Paint - Walls", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Paint - Ceiling", category: "Paint", trade: "Paint", unit: "gallon" },
];

const bedroomTemplates: TemplateItem[] = [
  { label: "Flooring", category: "Flooring", trade: "Flooring", unit: "sq ft" },
  { label: "Paint - Walls", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Paint - Ceiling", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Recessed Lights", category: "Lighting", trade: "Electrical", unit: "each" },
  { label: "Ceiling Fan", category: "Lighting", trade: "Electrical", unit: "each" },
  { label: "Outlets", category: "Electrical", trade: "Electrical", unit: "each" },
  { label: "Light Switches", category: "Electrical", trade: "Electrical", unit: "each" },
];

const livingRoomTemplates: TemplateItem[] = [
  { label: "Flooring", category: "Flooring", trade: "Flooring", unit: "sq ft" },
  { label: "Paint - Walls", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Paint - Ceiling", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Recessed Lights", category: "Lighting", trade: "Electrical", unit: "each" },
  { label: "Outlets", category: "Electrical", trade: "Electrical", unit: "each" },
  { label: "Light Switches", category: "Electrical", trade: "Electrical", unit: "each" },
  { label: "Crown Molding", category: "Trim", trade: "Trim", unit: "linear ft" },
  { label: "Baseboards", category: "Trim", trade: "Trim", unit: "linear ft" },
];

const laundryTemplates: TemplateItem[] = [
  { label: "Upper Cabinets", category: "Cabinets", trade: "Cabinets & Countertops", unit: "linear ft" },
  { label: "Countertop", category: "Countertops", trade: "Cabinets & Countertops", unit: "sq ft" },
  { label: "Utility Sink", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Utility Faucet", category: "Plumbing Fixtures", trade: "Plumbing", unit: "each" },
  { label: "Flooring", category: "Flooring", trade: "Flooring", unit: "sq ft" },
  { label: "Paint - Walls", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Recessed Lights", category: "Lighting", trade: "Electrical", unit: "each" },
];

const garageTemplates: TemplateItem[] = [
  { label: "Garage Door", category: "Doors", trade: "Windows & Doors", unit: "each" },
  { label: "Garage Door Opener", category: "Garage", trade: "Garage", unit: "each" },
  { label: "Exterior Lights", category: "Lighting", trade: "Electrical", unit: "each" },
  { label: "Outlets", category: "Electrical", trade: "Electrical", unit: "each" },
  { label: "Light Switches", category: "Electrical", trade: "Electrical", unit: "each" },
];

const mudroomTemplates: TemplateItem[] = [
  { label: "Bench Storage", category: "Cabinets", trade: "Cabinets & Countertops", unit: "each" },
  { label: "Coat Hooks", category: "Hardware", trade: "Trim", unit: "each" },
  { label: "Flooring", category: "Flooring", trade: "Flooring", unit: "sq ft" },
  { label: "Paint - Walls", category: "Paint", trade: "Paint", unit: "gallon" },
  { label: "Recessed Lights", category: "Lighting", trade: "Electrical", unit: "each" },
];

const roomTypeTemplates: Record<string, TemplateItem[]> = {
  "Kitchen": kitchenTemplates,
  "Bathroom": bathroomTemplates,
  "Bedroom": bedroomTemplates,
  "Living": livingRoomTemplates,
  "Laundry": laundryTemplates,
  "Garage": garageTemplates,
  "Mudroom": mudroomTemplates,
};

export const getTemplateForRoomType = (roomType: string | null): TemplateItem[] => {
  if (!roomType) return [];
  
  // Match partial room types
  for (const [key, templates] of Object.entries(roomTypeTemplates)) {
    if (roomType.toLowerCase().includes(key.toLowerCase())) {
      return templates;
    }
  }
  
  return [];
};

export const createSelectionItemsFromTemplate = (
  projectId: string,
  roomId: string,
  roomType: string | null,
  categoryMap: Record<string, string>
): Partial<SelectionItem>[] => {
  const templates = getTemplateForRoomType(roomType);
  
  return templates.map(template => ({
    project_id: projectId,
    room_id: roomId,
    category_id: categoryMap[template.category] || Object.values(categoryMap)[0],
    label: template.label,
    description: template.description,
    trade: template.trade,
    unit: template.unit,
    material_type: template.material_type,
    is_standard_option: true,
    is_upgrade: false,
  }));
};
