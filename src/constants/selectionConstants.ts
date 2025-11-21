export const REQUIRED_SELECTIONS = [
  // Exterior selections
  'siding_color', 'trim_color', 'roof_color', 'wainscoting_color', 'wainscoting_corner_color',
  'metal_type', 'siding_type', 'roof_type',
  
  // Garage selections
  'garage_door_style', 'garage_door_color', 'garage_door_panel',
  
  // Entry selections
  'entry_door_style', 'entry_door_color', 
  
  // Interior selections
  'interior_door_style', 'interior_door_color', 'interior_trim_style', 'interior_trim_color',
  'living_room_flooring', 'kitchen_flooring', 'dining_room_flooring', 
  'master_bedroom_flooring', 'bedroom_2_flooring', 'bedroom_3_flooring',
  'hallway_flooring', 'office_flooring', 'bathroom_flooring', 'mudroom_flooring',
  
  // Kitchen selections
  'kitchen_cabinet_style', 'kitchen_cabinet_color', 'kitchen_countertop',
  
  // Bathroom selections
  'master_bath_vanity_style', 'master_bath_vanity_color', 'master_bath_tub_shower',
  'guest_bath_vanity_style', 'guest_bath_vanity_color', 'guest_bath_tub_shower',
  'powder_room_vanity_style', 'powder_room_vanity_color',
  
  // Mudroom selections
  'mudroom_storage_style', 'mudroom_storage_color'
];

export const TAB_NAVIGATION = [
  "exterior", "garage", "entry", "interior", "kitchen", "bathrooms", "mudroom"
];

export const COLOR_HEX_MAP: { [key: string]: string } = {
  "Brown": "#6B4423",
  "Tan": "#D2B48C", 
  "Ash Gray": "#B2BEB5",
  "Charcoal": "#36454F",
  "Light Stone": "#D3D3C7",
  "Hunter Green": "#355E3B",
  "Alamo White": "#F8F8FF",
  "Rustic Red": "#B7410E",
  "Ocean Blue": "#006994",
  "Brite White": "#FFFFFF",
  "Burgundy": "#800020",
  "Taupe": "#B8B5A1",
  "Burnished Slate": "#2F2F2F",
  "Gallery Blue": "#4169E1",
  "Brite Red": "#DC143C",
  "Dark Green": "#013220",
  "Copper Metallic": "#B87333",
  "Ivory": "#FFFFF0",
  "Matte Black": "#1C1C1C",
  "Pewter Gray": "#96A0A0",
  "Colony Green": "#4F7942",
  "Galvalume": "#C0C0C0"
};