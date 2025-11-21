/**
 * Formats a phone number for consistent display
 * Accepts various formats and returns a standardized display format
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different lengths
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 10) {
    // International format - just add spaces for readability
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
  }
  
  // Return original if format is unclear
  return phone;
};

/**
 * Creates a tel: link for mobile devices
 */
export const getPhoneLink = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters except + for international
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
};