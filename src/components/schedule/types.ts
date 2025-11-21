import { getDay } from "date-fns";

export interface TradeTask {
  name: string;
  workdays: number;
  startDate?: Date;
  endDate?: Date;
  color: string;
}

export interface ScheduledTradeTask extends TradeTask {
  startDate: Date;
  endDate: Date;
}

// Custom weekend detection function that correctly identifies Saturday and Sunday
export const isWeekendDay = (date: Date): boolean => {
  const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6; // Only Sunday and Saturday
};

// Holiday detection function for US holidays that affect construction schedules
export const isHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = January)
  const day = date.getDate();
  
  // New Year's Day - January 1
  if (month === 0 && day === 1) return true;
  
  // Memorial Day - Last Monday in May
  const lastMondayMay = new Date(year, 4, 31);
  lastMondayMay.setDate(31 - (lastMondayMay.getDay() + 6) % 7);
  if (month === 4 && day === lastMondayMay.getDate()) return true;
  
  // Independence Day - July 4
  if (month === 6 && day === 4) return true;
  
  // Labor Day - First Monday in September
  const firstMondaySept = new Date(year, 8, 1);
  firstMondaySept.setDate(1 + (8 - firstMondaySept.getDay()) % 7);
  if (month === 8 && day === firstMondaySept.getDate()) return true;
  
  // Thanksgiving - Fourth Thursday in November
  const fourthThursdayNov = new Date(year, 10, 1);
  fourthThursdayNov.setDate(1 + (4 - fourthThursdayNov.getDay() + 7) % 7 + 21);
  if (month === 10 && day === fourthThursdayNov.getDate()) return true;
  
  // Day after Thanksgiving - Friday after fourth Thursday
  const dayAfterThanksgiving = new Date(fourthThursdayNov);
  dayAfterThanksgiving.setDate(dayAfterThanksgiving.getDate() + 1);
  if (month === 10 && day === dayAfterThanksgiving.getDate()) return true;
  
  // Christmas Eve - December 24
  if (month === 11 && day === 24) return true;
  
  // Christmas Day - December 25
  if (month === 11 && day === 25) return true;
  
  // Day after Christmas - December 26
  if (month === 11 && day === 26) return true;
  
  return false;
};

// Get holiday name for display
export const getHolidayName = (date: Date): string | null => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = January)
  const day = date.getDate();
  
  // New Year's Day - January 1
  if (month === 0 && day === 1) return "New Year's Day";
  
  // Memorial Day - Last Monday in May
  const lastMondayMay = new Date(year, 4, 31);
  lastMondayMay.setDate(31 - (lastMondayMay.getDay() + 6) % 7);
  if (month === 4 && day === lastMondayMay.getDate()) return "Memorial Day";
  
  // Independence Day - July 4
  if (month === 6 && day === 4) return "Independence Day";
  
  // Labor Day - First Monday in September
  const firstMondaySept = new Date(year, 8, 1);
  firstMondaySept.setDate(1 + (8 - firstMondaySept.getDay()) % 7);
  if (month === 8 && day === firstMondaySept.getDate()) return "Labor Day";
  
  // Thanksgiving - Fourth Thursday in November
  const fourthThursdayNov = new Date(year, 10, 1);
  fourthThursdayNov.setDate(1 + (4 - fourthThursdayNov.getDay() + 7) % 7 + 21);
  if (month === 10 && day === fourthThursdayNov.getDate()) return "Thanksgiving";
  
  // Day after Thanksgiving - Friday after fourth Thursday
  const dayAfterThanksgiving = new Date(fourthThursdayNov);
  dayAfterThanksgiving.setDate(dayAfterThanksgiving.getDate() + 1);
  if (month === 10 && day === dayAfterThanksgiving.getDate()) return "Black Friday";
  
  // Christmas Eve - December 24
  if (month === 11 && day === 24) return "Christmas Eve";
  
  // Christmas Day - December 25
  if (month === 11 && day === 25) return "Christmas Day";
  
  // Day after Christmas - December 26
  if (month === 11 && day === 26) return "Boxing Day";
  
  return null;
};

// Combined function to check if a day should be skipped for work
export const isNonWorkDay = (date: Date): boolean => {
  return isWeekendDay(date) || isHoliday(date);
};