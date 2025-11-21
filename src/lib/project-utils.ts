/**
 * Formats a project code with building type prefix
 * @param code - Raw project code (e.g., "TB-FULFORD-001") or plain name (e.g., "Ra Building")
 * @param buildingType - Building type (Residential, Barndominium, Commercial)
 * @returns Formatted code (e.g., "TB - B - FULFORD - 001")
 */
export function formatProjectCode(code: string | null | undefined, buildingType: string | null | undefined): string {
  if (!code) return '';
  
  // Get building type prefix
  const typePrefix = getBuildingTypePrefix(buildingType);
  
  // Split the code by hyphens
  const parts = code.split('-');
  
  // If code already has building type (4 parts: TB-R-LASTNAME-001), just add spaces
  if (parts.length === 4) {
    return code.replace(/-/g, ' - ');
  }
  
  // If code is in old format (3 parts: TB-LASTNAME-001), insert building type
  if (parts.length === 3 && parts[0] === 'TB') {
    return `TB - ${typePrefix} - ${parts[1]} - ${parts[2]}`;
  }
  
  // For plain names without code structure (legacy projects like "Ra Building")
  // Return as-is since we can't reliably parse them
  return code;
}

/**
 * Gets the building type prefix letter
 * @param buildingType - Building type string
 * @returns Single letter prefix (R/B/C)
 */
export function getBuildingTypePrefix(buildingType: string | null | undefined): string {
  if (!buildingType) return 'B'; // Default to Barndominium
  
  const type = buildingType.toLowerCase();
  
  if (type.includes('residential')) return 'R';
  if (type.includes('commercial')) return 'C';
  if (type.includes('barndo') || type.includes('barn')) return 'B';
  
  return 'B'; // Default to Barndominium
}

/**
 * Generates a new project code with building type
 * @param buildingType - Building type
 * @param lastName - Customer last name
 * @param number - Project number (e.g., 001)
 * @returns Formatted code (e.g., "TB-B-LASTNAME-001")
 */
export function generateProjectCode(
  buildingType: string,
  lastName: string,
  number: string | number
): string {
  const typePrefix = getBuildingTypePrefix(buildingType);
  const paddedNumber = String(number).padStart(3, '0');
  const cleanLastName = lastName.toUpperCase().replace(/\s+/g, '');
  
  return `TB-${typePrefix}-${cleanLastName}-${paddedNumber}`;
}
