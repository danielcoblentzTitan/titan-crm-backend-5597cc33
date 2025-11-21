// Titan Buildings Standard Color Options
// Based on https://titanbuildings.com/customization/siding-options

export const TITAN_STANDARD_COLORS = [
  { name: "Brown", code: "WXB1009L", hex: "#6B4423", category: "standard" },
  { name: "Tan", code: "WXD0049L", hex: "#D2B48C", category: "standard" },
  { name: "Ash Gray", code: "WXA0092L", hex: "#B2BEB5", category: "standard" },
  { name: "Charcoal", code: "WXA0090L", hex: "#36454F", category: "standard" },
  { name: "Light Stone", code: "WXD0038L", hex: "#D3D3C7", category: "standard" },
  { name: "Hunter Green", code: "WXG0021L", hex: "#355E3B", category: "standard" },
  { name: "Alamo White", code: "WXW0051L", hex: "#F8F8FF", category: "standard" },
  { name: "Rustic Red", code: "WXR0074L", hex: "#B7410E", category: "standard" },
  { name: "Ocean Blue", code: "WXL0028L", hex: "#006994", category: "standard" },
  { name: "Brite White", code: "WXW0050L", hex: "#FFFFFF", category: "standard" },
  { name: "Burgundy", code: "WXR0076L", hex: "#800020", category: "standard" },
  { name: "Taupe", code: "WXD0047L", hex: "#B8B5A1", category: "standard" },
  { name: "Burnished Slate", code: "WXB1007L", hex: "#2F2F2F", category: "standard" },
  { name: "Gallery Blue", code: "WXL0026L", hex: "#4169E1", category: "standard" },
  { name: "Brite Red", code: "WXR0075L", hex: "#DC143C", category: "standard" },
  { name: "Dark Green", code: "WXG0022L", hex: "#013220", category: "standard" },
  { name: "Ivory", code: "WXW0052L", hex: "#FFFFF0", category: "standard" },
  { name: "Matte Black", code: "WXB1008L", hex: "#1C1C1C", category: "standard" },
  { name: "Pewter Gray", code: "WXA0091L", hex: "#96A0A0", category: "standard" },
  { name: "Colony Green", code: "WXG0023L", hex: "#4F7942", category: "standard" },
  { name: "Galvalume", code: "GALVAL", hex: "#C0C0C0", category: "standard" }
];

export const TITAN_PREMIUM_COLORS = [
  { name: "Copper Metallic", code: "COPPER", hex: "#B87333", category: "premium" }
];

export const TITAN_TEXTURED_COLORS = [
  { name: "Textured Charcoal", code: "TXTCHAR", hex: "#36454F", category: "textured" },
  { name: "Textured Black", code: "TXTBLK", hex: "#1C1C1C", category: "textured" },
  { name: "Textured Green", code: "TXTGRN", hex: "#355E3B", category: "textured" },
  { name: "Textured Brown", code: "TXTBRN", hex: "#6B4423", category: "textured" }
];

export const TITAN_WOODGRAIN_COLORS = [
  { name: "Gray Distressed Barnwood", code: "WGDB", hex: "#8B8680", category: "woodgrain" },
  { name: "Realtree Camouflage", code: "WGRT", hex: "#7D6F47", category: "woodgrain" },
  { name: "Chippy White", code: "WGCW", hex: "#F5F5DC", category: "woodgrain" },
  { name: "Gray Rough Sawn Cedar", code: "WGRSC", hex: "#A0A0A0", category: "woodgrain" }
];

// All colors combined for comprehensive selection
export const ALL_TITAN_COLORS = [
  ...TITAN_STANDARD_COLORS,
  ...TITAN_PREMIUM_COLORS,
  ...TITAN_TEXTURED_COLORS,
  ...TITAN_WOODGRAIN_COLORS
];

// Legacy color mapping for backward compatibility
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