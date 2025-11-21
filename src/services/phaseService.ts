
import { supabase } from "@/integrations/supabase/client";
import { getDay, addDays } from "date-fns";

type TemplateItem = {
  id: string;
  name: string;
  default_duration_days: number;
  default_color: string | null;
  predecessor_item_id: string | null;
  lag_days: number;
  sort_order: number;
};

type PhaseInsert = {
  project_id: string;
  template_item_id: string | null;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number;
  publish_to_customer: boolean;
  internal_notes?: string | null;
  customer_notes?: string | null;
  color?: string | null;
};

const isWeekend = (date: Date) => {
  const d = getDay(date); // 0 Sun, 6 Sat
  return d === 0 || d === 6;
};

const toISO = (d: Date) => d.toISOString().slice(0, 10); // yyyy-mm-dd

async function fetchHolidays(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("holidays")
    .select("holiday_date");
  if (error) {
    console.error("fetchHolidays error:", error);
    return new Set();
  }
  return new Set((data || []).map((h) => h.holiday_date as unknown as string));
}

function isNonWorkDay(date: Date, holidaySet: Set<string>) {
  return isWeekend(date) || holidaySet.has(toISO(date));
}

function addWorkdaysSkipping(date: Date, workdays: number, holidaySet: Set<string>): Date {
  // Adds N workdays to a date, skipping weekends/holidays
  let d = new Date(date);
  let added = 0;
  while (added < workdays) {
    if (!isNonWorkDay(d, holidaySet)) {
      added++;
    }
    if (added < workdays) {
      d = addDays(d, 1);
    }
  }
  return d;
}

function addLagSkipping(startAfter: Date, lagDays: number, holidaySet: Set<string>): Date {
  // Move forward lagDays non-workdays from the day after startAfter
  let d = addDays(startAfter, 1);
  let moved = 0;
  while (moved < lagDays) {
    if (!isNonWorkDay(d, holidaySet)) {
      moved++;
    }
    if (moved < lagDays) {
      d = addDays(d, 1);
    }
  }
  // Ensure final start is on a workday
  while (isNonWorkDay(d, holidaySet)) {
    d = addDays(d, 1);
  }
  return d;
}

async function fetchTemplateWithItems(templateName = "Barndominium") {
  const { data: template, error: tErr } = await supabase
    .from("phase_templates")
    .select("id, name")
    .eq("name", templateName)
    .eq("is_active", true)
    .maybeSingle();

  if (tErr) throw tErr;
  if (!template) throw new Error(`Template not found: ${templateName}`);

  const { data: items, error: iErr } = await supabase
    .from("phase_template_items")
    .select("id, name, default_duration_days, default_color, predecessor_item_id, lag_days, sort_order")
    .eq("template_id", template.id)
    .order("sort_order", { ascending: true });

  if (iErr) throw iErr;

  return { templateId: template.id as string, items: (items || []) as TemplateItem[] };
}

export async function createPhasesFromTemplate(params: {
  projectId: string;
  projectStartDate: string;
  templateName?: string;
  publishToCustomer?: boolean;
}): Promise<{ created: number; dependencies: number }> {
  const { projectId, projectStartDate, templateName = "Barndominium", publishToCustomer = false } = params;

  // 1) Load template + items and holidays
  const [{ templateId, items }, holidaySet] = await Promise.all([
    fetchTemplateWithItems(templateName),
    fetchHolidays(),
  ]);

  if (!items.length) {
    return { created: 0, dependencies: 0 };
  }

  // 2) Build schedule in memory with FS dependencies + lag and skipping non-work days
  let currentDate = new Date(projectStartDate);
  // Ensure start date is a workday
  while (isNonWorkDay(currentDate, holidaySet)) {
    currentDate = addDays(currentDate, 1);
  }

  // We will compute per item: start_date and end_date
  const scheduled: Array<{
    item: TemplateItem;
    start: Date;
    end: Date;
    duration: number;
  }> = [];

  for (const item of items) {
    // If there is a predecessor, start after predecessor end plus lag; else use currentDate
    if (item.predecessor_item_id) {
      const predecessor = scheduled.find((s) => s.item.id === item.predecessor_item_id);
      if (predecessor) {
        // Start = predecessor.end + lagDays (skipping non-workdays)
        currentDate = addLagSkipping(predecessor.end, item.lag_days || 0, holidaySet);
      }
    }
    // Make sure start is a workday
    while (isNonWorkDay(currentDate, holidaySet)) {
      currentDate = addDays(currentDate, 1);
    }

    const duration = Math.max(0, item.default_duration_days || 0);
    const start = new Date(currentDate);
    const end = duration > 0 ? addWorkdaysSkipping(start, duration, holidaySet) : new Date(start);

    scheduled.push({
      item,
      start,
      end,
      duration,
    });

    // Next candidate date is day after this end
    currentDate = addDays(end, 1);
    while (isNonWorkDay(currentDate, holidaySet)) {
      currentDate = addDays(currentDate, 1);
    }
  }

  // 3) Insert phases
  const phaseRows: PhaseInsert[] = scheduled.map((s) => ({
    project_id: projectId,
    template_item_id: s.item.id,
    name: s.item.name,
    status: "Planned",
    start_date: toISO(s.start),
    end_date: toISO(s.end),
    duration_days: s.duration,
    publish_to_customer: publishToCustomer,
    color: s.item.default_color || null,
  }));

  const { data: insertedPhases, error: insertErr } = await supabase
    .from("project_phases")
    .insert(phaseRows)
    .select("id, name, template_item_id, project_id");
  if (insertErr) throw insertErr;

  // 4) Insert dependencies (mirror template predecessor graph)
  const byTemplateId = new Map<string, string>(); // template_item_id -> inserted phase id
  for (const row of insertedPhases || []) {
    if (row.template_item_id) {
      byTemplateId.set(row.template_item_id as string, row.id as string);
    }
  }

  const depsToInsert = items
    .filter((it) => it.predecessor_item_id)
    .map((it) => {
      const predPhaseId = byTemplateId.get(it.predecessor_item_id as string);
      const succPhaseId = byTemplateId.get(it.id);
      if (!predPhaseId || !succPhaseId) return null;
      return {
        project_id: projectId,
        predecessor_phase_id: predPhaseId,
        successor_phase_id: succPhaseId,
        type: "FS" as const,
        lag_days: it.lag_days || 0,
      };
    })
    .filter(Boolean) as Array<{
      project_id: string;
      predecessor_phase_id: string;
      successor_phase_id: string;
      type: "FS";
      lag_days: number;
    }>;

  let depsInserted = 0;
  if (depsToInsert.length > 0) {
    const { error: depErr, count } = await supabase
      .from("phase_dependencies")
      .insert(depsToInsert, { count: "exact" });
    if (depErr) throw depErr;
    depsInserted = count || depsToInsert.length;
  }

  return { created: insertedPhases?.length || 0, dependencies: depsInserted };
}
