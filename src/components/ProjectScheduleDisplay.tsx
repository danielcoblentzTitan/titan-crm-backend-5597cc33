import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target, Building2, Home, Building } from "lucide-react";

interface ProjectScheduleDisplayProps {
  projectType?: string;
  startDate: string;
  estimatedCompletion?: string;
  currentProgress?: number;
  currentPhase?: string;
}

const ProjectScheduleDisplay = ({ 
  projectType = "residential", 
  startDate, 
  estimatedCompletion,
  currentProgress = 0,
  currentPhase = "Planning"
}: ProjectScheduleDisplayProps) => {
  
  const getScheduleInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case "barndominium":
      case "barndos":
        return {
          standardDuration: 12,
          targetDuration: 6,
          icon: <Home className="h-5 w-5" />,
          color: "bg-amber-100 text-amber-800",
          description: "Barndominium Construction"
        };
      case "commercial":
        return {
          standardDuration: 8,
          targetDuration: 4,
          icon: <Building className="h-5 w-5" />,
          color: "bg-blue-100 text-blue-800",
          description: "Commercial Building"
        };
      default: // residential
        return {
          standardDuration: 3,
          targetDuration: 3,
          icon: <Building2 className="h-5 w-5" />,
          color: "bg-green-100 text-green-800",
          description: "Residential Building"
        };
    }
  };

  const scheduleInfo = getScheduleInfo(projectType);
  const start = new Date(startDate);
  
  // Calculate projected completion dates
  const standardCompletion = new Date(start);
  standardCompletion.setMonth(standardCompletion.getMonth() + scheduleInfo.standardDuration);
  
  const targetCompletion = new Date(start);
  targetCompletion.setMonth(targetCompletion.getMonth() + scheduleInfo.targetDuration);

  // Calculate days elapsed and remaining
  const today = new Date();
  const totalDays = Math.ceil((standardCompletion.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const progressByTime = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  // Adjust phases based on project type
  const getPhases = (type: string) => {
    if (type.toLowerCase().includes('barndo')) {
      return [
        { name: "Permits & Planning", duration: 5, color: "bg-gray-500" },
        { name: "Site Preparation", duration: 10, color: "bg-yellow-500" },
        { name: "Exterior Framing", duration: 10, color: "bg-blue-500" },
        { name: "Roofing & Siding", duration: 10, color: "bg-green-500" },
        { name: "Interior Systems", duration: 50, color: "bg-purple-500" },
        { name: "Finishing", duration: 15, color: "bg-indigo-500" }
      ];
    }
    
    // Default phases for residential/commercial
    return [
      { name: "Permits & Planning", duration: 5, color: "bg-gray-500" },
      { name: "Site Preparation", duration: 10, color: "bg-yellow-500" },
      { name: "Exterior Framing", duration: 10, color: "bg-blue-500" },
      { name: "Roofing & Siding", duration: 10, color: "bg-green-500" },
      { name: "Interior Systems", duration: 50, color: "bg-purple-500" },
      { name: "Finishing", duration: 15, color: "bg-indigo-500" }
    ];
  };

  const phases = getPhases(projectType);

  const getCurrentPhaseIndex = () => {
    const phaseMapping: { [key: string]: number } = {
      "planning": 0,
      "permits": 0,
      "site preparation": 1,
      "framing": 2,
      "roofing": 3,
      "siding": 3,
      "interior": 4,
      "finishing": 5,
      "completed": 6
    };
    
    const lowerPhase = currentPhase.toLowerCase();
    for (const [key, index] of Object.entries(phaseMapping)) {
      if (lowerPhase.includes(key)) {
        return index;
      }
    }
    return 0;
  };

  const currentPhaseIndex = getCurrentPhaseIndex();

  // Calculate actual progress based on completed phases
  const calculateActualProgress = () => {
    let totalProgress = 0;
    
    // Add progress from completed phases
    for (let i = 0; i < currentPhaseIndex; i++) {
      totalProgress += phases[i].duration;
    }
    
    // Add partial progress from current phase if available
    if (currentProgress && currentPhaseIndex < phases.length) {
      const currentPhaseProgress = (currentProgress / 100) * phases[currentPhaseIndex].duration;
      totalProgress += currentPhaseProgress;
    }
    
    return Math.min(Math.max(totalProgress, 0), 100);
  };

  const actualProgress = calculateActualProgress();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Project Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {scheduleInfo.icon}
                <Badge className={scheduleInfo.color}>
                  {scheduleInfo.description}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Project Start</span>
                  <span className="text-sm">{start.toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Target Completion</span>
                  <span className="text-sm font-semibold text-green-600">
                    {targetCompletion.toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Standard Timeline</span>
                  <span className="text-sm text-muted-foreground">
                    {standardCompletion.toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duration</span>
                  <span className="text-sm">
                    {scheduleInfo.targetDuration} - {scheduleInfo.standardDuration} months
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">
                  {Math.round(actualProgress)}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
                <Progress 
                  value={actualProgress} 
                  className="mt-2 h-2" 
                />
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium">Current Phase</div>
                <Badge variant="outline" className="mt-1">
                  {currentPhase}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Construction Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, index) => {
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              const isUpcoming = index > currentPhaseIndex;
              
              return (
                <div key={phase.name} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className={`w-4 h-4 rounded-full ${
                        isCompleted ? 'bg-green-500' : 
                        isCurrent ? phase.color : 
                        'bg-gray-200'
                      }`}
                    />
                    <span className={`text-sm ${
                      isCompleted ? 'text-green-600 line-through' :
                      isCurrent ? 'font-medium' :
                      'text-muted-foreground'
                    }`}>
                      {phase.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {phase.duration}% of timeline
                    </span>
                    {isCurrent && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="text-sm space-y-2">
              <p className="font-medium">Timeline Notes:</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Weather conditions may affect outdoor construction phases</li>
                <li>• Permit approval times vary by local jurisdiction</li>
                <li>• Custom features may extend timeline</li>
                <li>• Progress updates provided weekly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectScheduleDisplay;