import React from "react";
import { format, isSameDay } from "date-fns";

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

interface TimelineHeaderProps {
  workdays: Date[];
  labelWidth: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({ workdays, labelWidth }) => {
  return (
    <div
      className="sticky top-0 z-30 bg-background border-b"
      style={{
        display: "grid",
        gridTemplateColumns: `${labelWidth}px repeat(${workdays.length}, minmax(0, 1fr))`,
      }}
    >
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground sticky left-0 bg-background z-30">
        Project
      </div>
      {workdays.map((d) => {
        const today = isSameDay(d, new Date());
        return (
          <div
            key={d.toISOString()}
            className={
              "px-2 py-2 text-center text-xs font-medium border-l first:border-l-0 " +
              (today ? "bg-primary/5 text-primary" : "text-muted-foreground")
            }
          >
            <div className="leading-none">{format(d, "EEE")}</div>
            <div className="leading-none text-[11px]">{format(d, "MM/dd")}</div>
          </div>
        );
      })}
    </div>
  );
};
