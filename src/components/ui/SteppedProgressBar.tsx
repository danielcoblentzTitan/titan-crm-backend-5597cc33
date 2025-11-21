import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  name: string;
  shortName?: string;
  status: 'completed' | 'current' | 'upcoming';
  progress: number;
}

interface SteppedProgressBarProps {
  currentPhase: string;
  currentProgress: number;
  variant?: 'default' | 'compact';
  showLabels?: boolean;
}

// Map phase progress to milestone groups
const getMilestoneStatus = (currentProgress: number): Milestone[] => {
  const milestones = [
    { name: "Pre-Construction", shortName: "Pre-Con", minProgress: 0, maxProgress: 9 },
    { name: "Framing & Structure", shortName: "Framing", minProgress: 10, maxProgress: 24 },
    { name: "Rough-In Systems", shortName: "Rough-In", minProgress: 25, maxProgress: 49 },
    { name: "Drywall & Paint", shortName: "Drywall", minProgress: 50, maxProgress: 69 },
    { name: "Finishes", shortName: "Finishes", minProgress: 70, maxProgress: 89 },
    { name: "Final Systems", shortName: "Finals", minProgress: 90, maxProgress: 97 },
    { name: "Completion", shortName: "Complete", minProgress: 98, maxProgress: 100 },
  ];

  return milestones.map((milestone) => {
    let status: 'completed' | 'current' | 'upcoming';
    
    if (currentProgress > milestone.maxProgress) {
      status = 'completed';
    } else if (currentProgress >= milestone.minProgress && currentProgress <= milestone.maxProgress) {
      status = 'current';
    } else {
      status = 'upcoming';
    }

    return {
      name: milestone.name,
      shortName: milestone.shortName,
      status,
      progress: milestone.minProgress,
    };
  });
};

export const SteppedProgressBar = ({ 
  currentPhase, 
  currentProgress, 
  variant = 'default',
  showLabels = true 
}: SteppedProgressBarProps) => {
  const milestones = getMilestoneStatus(currentProgress);
  const isCompact = variant === 'compact';

  return (
    <div className="w-full">
      {/* Desktop/Tablet: Horizontal Arrow Chain */}
      <div className="hidden sm:flex items-center gap-0">
        {milestones.map((milestone, index) => (
          <div
            key={milestone.name}
            className="relative flex-1 group"
          >
            {/* Arrow Shape Container */}
            <div
              className={cn(
                "relative h-10 flex items-center justify-center transition-all duration-300",
                "clip-arrow",
                milestone.status === 'completed' && "bg-green-500 text-white",
                milestone.status === 'current' && "bg-primary text-white z-10 scale-105",
                milestone.status === 'upcoming' && "bg-muted text-muted-foreground",
                index === 0 && "rounded-l-md clip-arrow-first",
                index === milestones.length - 1 && "rounded-r-md clip-arrow-last"
              )}
              style={{
                clipPath: index === 0 
                  ? "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)"
                  : index === milestones.length - 1
                  ? "polygon(16px 0, 100% 0, 100% 100%, 16px 100%, 0 50%)"
                  : "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)"
              }}
            >
              {/* Content */}
              <div className="flex items-center gap-1.5 px-3 z-10">
                {milestone.status === 'completed' && (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
                {showLabels && (
                  <span className={cn(
                    "text-xs font-medium truncate",
                    isCompact && "hidden md:inline"
                  )}>
                    {isCompact ? milestone.shortName : milestone.name}
                  </span>
                )}
              </div>
            </div>

            {/* Tooltip on hover for compact mode */}
            {isCompact && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                {milestone.name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Vertical Stack */}
      <div className="flex sm:hidden flex-col gap-2">
        {milestones.map((milestone, index) => (
          <div key={milestone.name} className="flex items-center gap-3">
            {/* Dot/Check indicator */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                milestone.status === 'completed' && "bg-green-500 text-white",
                milestone.status === 'current' && "bg-primary text-white ring-4 ring-primary/20",
                milestone.status === 'upcoming' && "bg-muted text-muted-foreground"
              )}
            >
              {milestone.status === 'completed' ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Label */}
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                milestone.status === 'current' && "text-primary font-semibold",
                milestone.status === 'upcoming' && "text-muted-foreground"
              )}>
                {milestone.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
