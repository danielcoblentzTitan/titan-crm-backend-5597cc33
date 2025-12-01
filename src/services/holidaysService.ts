import { supabase } from "@/integrations/supabase/client";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function memorialDay(year: number): string {
  const d = new Date(year, 4, 31); // May 31
  // last Monday in May
  d.setDate(31 - ((d.getDay() + 6) % 7));
  return toISO(d);
}

function laborDay(year: number): string {
  const d = new Date(year, 8, 1); // Sept 1
  // first Monday in September
  d.setDate(1 + ((8 - d.getDay()) % 7));
  return toISO(d);
}

function thanksgiving(year: number): string {
  const d = new Date(year, 10, 1); // Nov 1
  // fourth Thursday in November
  d.setDate(1 + ((4 - d.getDay() + 7) % 7) + 21);
  return toISO(d);
}

export async function seedDefaultHolidays(years: number[]) {
  try {
    // Fetch existing
    const { data: existing, error: selErr } = await supabase
      .from("holidays")
      .select("holiday_date");
    if (selErr) {
      console.error("seedDefaultHolidays select error", selErr);
      return;
    }
    const existingSet = new Set<string>((existing || []).map((r: any) => r.holiday_date as string));

    const toAdd: { holiday_date: string; name: string }[] = [];

    for (const year of years) {
      const add = (dateIso: string, name: string) => {
        if (!existingSet.has(dateIso)) toAdd.push({ holiday_date: dateIso, name });
      };
      add(`${year}-01-01`, "New Year's Day");
      add(memorialDay(year), "Memorial Day");
      add(`${year}-07-04`, "Independence Day");
      add(laborDay(year), "Labor Day");
      const tg = thanksgiving(year);
      add(tg, "Thanksgiving");
      // Day after Thanksgiving
      const dayAfterTg = new Date(tg);
      dayAfterTg.setDate(dayAfterTg.getDate() + 1);
      add(toISO(dayAfterTg), "Black Friday");
      add(`${year}-12-24`, "Christmas Eve");
      add(`${year}-12-25`, "Christmas Day");
      add(`${year}-12-26`, "Day after Christmas");
    }

    if (toAdd.length > 0) {
      const { error: insErr } = await supabase.from("holidays").insert(toAdd);
      if (insErr) console.error("seedDefaultHolidays insert error", insErr);
    }
  } catch (e) {
    console.error("seedDefaultHolidays runtime error", e);
  }
}
