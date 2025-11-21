import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentData {
  projectId: string;
  totalPaid: number;
  totalBudget: number;
  remainingBalance: number;
  paymentProgress: number; // 0-100
}

export interface ConstructionMetrics {
  progressPercent: number; // 0-100
  durationDays: number;
  elapsedDays: number;
}

const PAYMENT_SCHEDULE = [
  0.20, // Draw 1
  0.20, // Draw 2
  0.15, // Draw 3
  0.15, // Draw 4
  0.15, // Draw 5
  0.10, // Draw 6
  0.05, // Draw 7
];

const normalizePhase = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('framing')) return 'Framing';
  if (n.includes('pre construction')) return 'Pre Construction';
  if (n.includes('planning') || n.includes('permit')) return 'Planning & Permits';
  if (n.includes('insulation')) return 'Insulation';
  if (n.includes('drywall')) return 'Drywall';
  if (n.includes('final')) return 'Final';
  if (n.includes('rough')) return 'Rough-ins';
  return name;
};

const calculatePaymentMetricsFallback = (project: Project): PaymentData => {
  const budget = project.budget || 0;
  if (budget <= 0) {
    return {
      projectId: project.id,
      totalPaid: 0,
      totalBudget: 0,
      remainingBalance: 0,
      paymentProgress: 0,
    };
  }

  let totalPaid = 0;
  PAYMENT_SCHEDULE.forEach((pct, index) => {
    const isFirst = index === 0;
    const milestone = (index / (PAYMENT_SCHEDULE.length - 1)) * 100;
    const paid = isFirst ? true : (project.progress || 0) >= milestone;
    if (paid) totalPaid += budget * pct;
  });

  const remainingBalance = Math.max(0, budget - totalPaid);
  const paymentProgress = Math.min(100, Math.max(0, (totalPaid / budget) * 100));

  return {
    projectId: project.id,
    totalPaid,
    totalBudget: budget,
    remainingBalance,
    paymentProgress,
  };
};

export const calculateConstructionMetrics = (project: Project): ConstructionMetrics => {
  const start = new Date(project.start_date.split('T')[0] + 'T12:00:00Z');
  const end = new Date(project.estimated_completion.split('T')[0] + 'T12:00:00Z');
  const now = new Date();
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const elapsedMs = Math.min(Math.max(0, now.getTime() - start.getTime()), totalMs);
  const durationDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

  // Prefer explicit project.progress if present; otherwise fallback to time-based estimate
  const progressPercent = typeof project.progress === 'number' && project.progress >= 0
    ? Math.min(100, Math.max(0, project.progress))
    : Math.round((elapsedMs / totalMs) * 100);

  return { progressPercent, durationDays, elapsedDays };
};

export const useProjectMetrics = (projects: Project[]) => {
  const [paymentsById, setPaymentsById] = useState<Record<string, PaymentData>>({});
  const [constructionById, setConstructionById] = useState<Record<string, ConstructionMetrics>>({});
  const [phasesById, setPhasesById] = useState<Record<string, string>>({});

  // Compute construction metrics locally (time-based or project.progress)
  useEffect(() => {
    const map: Record<string, ConstructionMetrics> = {};
    for (const p of projects) {
      map[p.id] = calculateConstructionMetrics(p);
    }
    setConstructionById(map);
  }, [projects]);

  // Fetch paid invoices once for all project IDs to compute payments
  useEffect(() => {
    const run = async () => {
      const ids = projects.map(p => p.id).filter(Boolean);
      if (ids.length === 0) {
        setPaymentsById({});
        return;
      }

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('project_id,total,status')
          .in('project_id', ids);

        if (error) {
          console.error('Error fetching invoices for metrics:', error);
          // Fallback to schedule-based estimate
          const fallback: Record<string, PaymentData> = {};
          for (const p of projects) fallback[p.id] = calculatePaymentMetricsFallback(p);
          setPaymentsById(fallback);
          return;
        }

        const byProject: Record<string, PaymentData> = {};
        for (const p of projects) {
          const budget = p.budget || 0;
          const invoices = (data || []).filter(inv => inv.project_id === p.id);
          const totalPaid = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + (inv.total || 0), 0);
          const remainingBalance = Math.max(0, budget - totalPaid);
          const paymentProgress = budget > 0 ? Math.min(100, (totalPaid / budget) * 100) : 0;
          byProject[p.id] = {
            projectId: p.id,
            totalPaid,
            totalBudget: budget,
            remainingBalance,
            paymentProgress,
          };
        }

        setPaymentsById(byProject);
      } catch (e) {
        console.error('Unexpected error computing payment metrics:', e);
        const fallback: Record<string, PaymentData> = {};
        for (const p of projects) fallback[p.id] = calculatePaymentMetricsFallback(p);
        setPaymentsById(fallback);
      }
    };

    run();
  }, [projects]);

  // Fetch schedules and compute current phase based on today's date
  useEffect(() => {
    const run = async () => {
      const ids = projects.map(p => p.id).filter(Boolean);
      if (ids.length === 0) {
        setPhasesById({});
        return;
      }
      try {
        const { data, error } = await supabase
          .from('project_schedules')
          .select('project_id,schedule_data')
          .in('project_id', ids);

        if (error) {
          console.error('Error fetching schedules for phases:', error);
          const fallback: Record<string, string> = {};
          for (const p of projects) if (p.phase) fallback[p.id] = p.phase;
          setPhasesById(fallback);
          return;
        }

        const today = new Date();
        const phaseMap: Record<string, string> = {};
        const constructionMap: Record<string, ConstructionMetrics> = {};
        for (const p of projects) {
          const row = (data || []).find((r: any) => r.project_id === p.id);
          const schedule = row?.schedule_data as Array<any> | undefined;
          let phase: string | undefined;
          let scheduleProgress: number | undefined;

          if (Array.isArray(schedule)) {
            const items = schedule
              .filter((it: any) => it.startDate && it.endDate)
              .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            const currentIndex = items.findIndex((item: any) => {
              const start = new Date(item.startDate + 'T12:00:00Z');
              const end = new Date(item.endDate + 'T12:00:00Z');
              return start <= today && today <= end;
            });

            if (currentIndex >= 0) {
              const current = items[currentIndex];
              const start = new Date(current.startDate + 'T12:00:00Z');
              const end = new Date(current.endDate + 'T12:00:00Z');
              const durMs = Math.max(1, end.getTime() - start.getTime());
              const elapsedMs = Math.min(Math.max(0, today.getTime() - start.getTime()), durMs);
              const withinPhase = elapsedMs / durMs; // 0..1
              const denom = Math.max(1, items.length);
              scheduleProgress = Math.min(100, Math.max(0, ((currentIndex + withinPhase) / denom) * 100));
              if (current?.name) phase = normalizePhase(current.name);
            } else if (items.length > 0) {
              // Before first or after last
              if (today < new Date(items[0].startDate + 'T12:00:00Z')) {
                scheduleProgress = 0;
                phase = normalizePhase(items[0].name || 'Planning & Permits');
              } else {
                scheduleProgress = 100;
                phase = normalizePhase(items[items.length - 1].name || 'Final');
              }
            }
          }

          phaseMap[p.id] = phase || p.phase || 'Planning & Permits';

          const base = calculateConstructionMetrics(p);
          constructionMap[p.id] = {
            ...base,
            progressPercent: scheduleProgress !== undefined ? Math.round(scheduleProgress) : base.progressPercent,
          };
        }
        setPhasesById(phaseMap);
        setConstructionById(constructionMap);
      } catch (e) {
        console.error('Unexpected error computing phases:', e);
        const fallback: Record<string, string> = {};
        for (const p of projects) if (p.phase) fallback[p.id] = p.phase;
        setPhasesById(fallback);
      }
    };
    run();
  }, [projects]);

  // Also expose memoized objects for stability
  const paymentsMemo = useMemo(() => paymentsById, [paymentsById]);
  const constructionMemo = useMemo(() => constructionById, [constructionById]);
  const phasesMemo = useMemo(() => phasesById, [phasesById]);

  return { paymentsById: paymentsMemo, constructionById: constructionMemo, phasesById: phasesMemo };
};
