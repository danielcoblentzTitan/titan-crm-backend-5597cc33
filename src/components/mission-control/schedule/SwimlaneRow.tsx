import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseISO, compareAsc, isBefore, isAfter } from "date-fns";

type PhaseLike = {
  id: string;
  name: string;
  start_date: string; // yyyy-MM-dd
  end_date: string; // yyyy-MM-dd
  color: string;
};

type ProjectLike = {
  id: string;
  name: string;
  phases: PhaseLike[];
};

interface SwimlaneRowProps {
  project: ProjectLike;
  workdays: Date[];
  expanded: boolean;
  onToggle: () => void;
  labelWidth: number;
  density: "compact" | "comfortable";
}

export const SwimlaneRow: React.FC<SwimlaneRowProps> = ({
  project,
  workdays,
  expanded,
  onToggle,
  labelWidth,
  density,
}) => {
  const barHeight = density === "compact" ? 18 : 24;
  const trackGap = 6;
  const trackCount = expanded ? 2 : 1;

  const firstDay = workdays[0];
  const lastDay = workdays[workdays.length - 1];

  const phasesSorted = useMemo(() => {
    return [...project.phases].sort((a, b) =>
      compareAsc(parseISO(a.start_date), parseISO(b.start_date))
    );
  }, [project.phases]);

  const projectWindow = useMemo((): { minStart: Date; maxEnd: Date } | null => {
    if (phasesSorted.length === 0) return null;
    const starts = phasesSorted.map((p) => parseISO(p.start_date));
    const ends = phasesSorted.map((p) => parseISO(p.end_date));
    const minStart = starts.reduce((min, d) => (isBefore(d, min) ? d : min), starts[0]);
    const maxEnd = ends.reduce((max, d) => (isAfter(d, max) ? d : max), ends[0]);
    return { minStart, maxEnd };
  }, [phasesSorted]);

  const idxOfOrNext = (date: Date) => {
    let i = workdays.findIndex((d) => d >= date);
    if (i === -1) i = workdays.length - 1;
    if (i < 0) i = 0;
    return i;
  };
  const idxOfOrPrev = (date: Date) => {
    let i = workdays.findIndex((d) => d > date);
    if (i === -1) return workdays.length - 1;
    return Math.max(0, i - 1);
  };

  // Collapsed aggregate bar
  const agg = useMemo(() => {
    if (!projectWindow) return null;
    const start = projectWindow.minStart < firstDay ? firstDay : projectWindow.minStart;
    const end = projectWindow.maxEnd > lastDay ? lastDay : projectWindow.maxEnd;
    if (end < firstDay || start > lastDay) return null;
    const startIdx = idxOfOrNext(start);
    const endIdx = idxOfOrPrev(end);
    const span = Math.max(1, endIdx - startIdx + 1);
    return { startIdx, span };
  }, [projectWindow, firstDay, lastDay]);

  // Expanded phase bars (limit to 2 tracks)
  const phaseBars = useMemo(() => {
    const bars = phasesSorted
      .map((ph) => {
        const s = parseISO(ph.start_date);
        const e = parseISO(ph.end_date);
        const start = s < firstDay ? firstDay : s;
        const end = e > lastDay ? lastDay : e;
        if (end < firstDay || start > lastDay) return null;
        const startIdx = idxOfOrNext(start);
        const endIdx = idxOfOrPrev(end);
        const span = Math.max(1, endIdx - startIdx + 1);
        return { phase: ph, startIdx, span };
      })
      .filter(Boolean) as { phase: PhaseLike; startIdx: number; span: number }[];

    // Assign tracks 0/1 for simplicity
    return bars.map((b, i) => ({ ...b, track: i % 2 }));
  }, [phasesSorted, firstDay, lastDay]);

  const overflowCount = Math.max(0, phaseBars.length - trackCount * 2);

  // Row layout: label + timeline grid
  return (
    <div
      className="relative"
      style={{
        display: "grid",
        gridTemplateColumns: `${labelWidth}px repeat(${workdays.length}, minmax(0, 1fr))`,
      }}
    >
      {/* Sticky label */}
      <div className="sticky left-0 z-20 bg-background flex items-center gap-2 border-b px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </Button>
        <div className="text-sm font-medium truncate" title={project.name}>
          {project.name}
        </div>
      </div>

      {/* Timeline cells (grid lines) */}
      {workdays.map((d, idx) => (
        <div key={idx} className="border-b border-l first:border-l-0" />
      ))}

      {/* Bars layer */}
      <div
        className="col-start-2 col-end-[-1] row-start-1 row-end-2 relative"
        style={{ gridColumn: `2 / span ${workdays.length}` }}
      >
        {/* Container for bars */}
        <div className="absolute inset-0">
          {/* Collapsed aggregate bar */}
          {!expanded && agg && (
            <div
              className="absolute rounded-md text-xs font-medium flex items-center px-2 bg-primary/20 text-foreground/80"
              style={{
                top: `${(barHeight + trackGap) / 2 - barHeight / 2}px`,
                height: `${barHeight}px`,
                left: `${(agg.startIdx / workdays.length) * 100}%`,
                width: `${(agg.span / workdays.length) * 100}%`,
              }}
              title={`${project.name}`}
            >
              <span className="truncate">{project.name}</span>
            </div>
          )}

          {/* Expanded phase bars (max 2 tracks) */}
          {expanded &&
            phaseBars.slice(0, trackCount * 2).map((b) => (
              <div
                key={b.phase.id}
                className="absolute rounded-sm text-[11px] font-medium flex items-center px-1 text-white"
                style={{
                  top: `${b.track * (barHeight + trackGap) + 4}px`,
                  height: `${barHeight}px`,
                  left: `${(b.startIdx / workdays.length) * 100}%`,
                  width: `${(b.span / workdays.length) * 100}%`,
                  backgroundColor: b.phase.color,
                }}
                title={`${project.name} - ${b.phase.name}`}
              >
                <span className="truncate">{b.phase.name}</span>
              </div>
            ))}

          {expanded && overflowCount > 0 && (
            <div className="absolute right-1 bottom-1 text-[11px] text-muted-foreground">+{overflowCount} more</div>
          )}
        </div>

        {/* Spacer for row height */}
        <div style={{ height: `${trackCount * (barHeight + trackGap) + 8}px` }} />
      </div>
    </div>
  );
};
