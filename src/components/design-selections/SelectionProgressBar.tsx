import { Badge } from "@/components/ui/badge";
import { REQUIRED_SELECTIONS } from "@/constants/selectionConstants";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionProgressBarProps {
  selections: { [key: string]: any };
}

export const SelectionProgressBar = ({ selections }: SelectionProgressBarProps) => {
  // Count completed required selections with special handling for either/or cases
  const completedSelections = REQUIRED_SELECTIONS.filter(field => {
    // Special case: kitchen cabinet color can be either standard color OR custom color
    if (field === 'kitchen_cabinet_color') {
      const standardColor = selections['kitchen_cabinet_color'];
      const customColor = selections['kitchen_cabinet_custom_color'];
      return (standardColor && standardColor !== "") || (customColor && customColor !== "");
    }
    
    const value = selections[field];
    return value && value !== "" && value !== null && value !== undefined;
  });
  
  const totalRequired = REQUIRED_SELECTIONS.length;
  const completedCount = completedSelections.length;
  const progressPercentage = totalRequired > 0 ? (completedCount / totalRequired) * 100 : 0;
  
  // Design selection steps
  const selectionSteps = [
    { name: "Exterior Selections", count: 8, status: 'completed' as const },
    { name: "Interior Selections", count: 6, status: 'current' as const },
    { name: "Kitchen & Bath", count: 5, status: 'upcoming' as const },
    { name: "Finishes", count: 4, status: 'upcoming' as const },
  ];

  // Calculate step status based on completed selections
  const getStepStatus = (stepIndex: number) => {
    const stepSize = totalRequired / selectionSteps.length;
    const completedSteps = Math.floor(completedCount / stepSize);
    
    if (stepIndex < completedSteps) return 'completed';
    if (stepIndex === completedSteps) return 'current';
    return 'upcoming';
  };

  const stepsWithStatus = selectionSteps.map((step, index) => ({
    ...step,
    status: getStepStatus(index)
  }));
  
  return (
    <div className="w-full bg-card p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold">Selection Progress</h3>
          <Badge 
            variant={progressPercentage === 100 ? "default" : "secondary"}
            className={progressPercentage === 100 ? "bg-green-100 text-green-800" : ""}
          >
            {completedCount} of {totalRequired} required
          </Badge>
        </div>
      </div>
      
      {/* Stepped Progress for Design Selections */}
      <div className="hidden sm:flex items-center gap-0">
        {stepsWithStatus.map((step, index) => (
          <div key={step.name} className="relative flex-1 group">
            <div
              className={cn(
                "relative h-10 flex items-center justify-center transition-all duration-300",
                step.status === 'completed' && "bg-green-500 text-white",
                step.status === 'current' && "bg-primary text-white z-10 scale-105",
                step.status === 'upcoming' && "bg-muted text-muted-foreground",
                index === 0 && "rounded-l-md",
                index === stepsWithStatus.length - 1 && "rounded-r-md"
              )}
              style={{
                clipPath: index === 0 
                  ? "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)"
                  : index === stepsWithStatus.length - 1
                  ? "polygon(16px 0, 100% 0, 100% 100%, 16px 100%, 0 50%)"
                  : "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)"
              }}
            >
              <div className="flex items-center gap-1.5 px-3 z-10">
                {step.status === 'completed' && <Check className="h-4 w-4 flex-shrink-0" />}
                <span className="text-xs font-medium truncate">{step.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Simple vertical list */}
      <div className="flex sm:hidden flex-col gap-2">
        {stepsWithStatus.map((step, index) => (
          <div key={step.name} className="flex items-center gap-3">
            <div
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all",
                step.status === 'completed' && "bg-green-500 text-white",
                step.status === 'current' && "bg-primary text-white ring-4 ring-primary/20",
                step.status === 'upcoming' && "bg-muted text-muted-foreground"
              )}
            >
              {step.status === 'completed' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            <p className={cn(
              "text-sm font-medium flex-1",
              step.status === 'current' && "text-primary font-semibold",
              step.status === 'upcoming' && "text-muted-foreground"
            )}>
              {step.name}
            </p>
          </div>
        ))}
      </div>
      
      {progressPercentage < 100 && (
        <p className="text-xs text-muted-foreground mt-3">
          Complete all required selections to submit your design choices
        </p>
      )}
    </div>
  );
};