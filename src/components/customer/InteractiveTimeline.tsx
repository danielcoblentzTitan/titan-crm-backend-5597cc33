import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  Camera, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

interface TimelinePhase {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'upcoming' | 'delayed';
  start_date?: string;
  end_date?: string;
  completion_percentage: number;
  description?: string;
  customer_notes?: string;
  milestones?: string[];
  photos_count?: number;
}

interface InteractiveTimelineProps {
  projectId: string;
  phases: TimelinePhase[];
  currentPhase?: string;
}

export const InteractiveTimeline = ({ projectId, phases, currentPhase }: InteractiveTimelineProps) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null);

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'in_progress':
        return <div className="h-6 w-6 rounded-full bg-primary animate-pulse" />;
      case 'delayed':
        return <Clock className="h-6 w-6 text-warning" />;
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/40" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-success/20">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary/20 text-primary border-primary/20">In Progress</Badge>;
      case 'delayed':
        return <Badge className="bg-warning/20 text-warning border-warning/20">Delayed</Badge>;
      default:
        return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const calculateDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const days = differenceInDays(parseISO(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const togglePhaseExpansion = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Project Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {phases.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Phases Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {phases.filter(p => p.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">Currently Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {phases.filter(p => p.status === 'upcoming').length}
                </div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round((phases.filter(p => p.status === 'completed').length / phases.length) * 100)}%</span>
              </div>
              <Progress 
                value={(phases.filter(p => p.status === 'completed').length / phases.length) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <Card 
            key={phase.id} 
            className={`transition-all duration-200 ${
              phase.status === 'in_progress' 
                ? 'border-primary shadow-md' 
                : phase.status === 'completed'
                ? 'border-success/20'
                : ''
            }`}
          >
            <CardContent className="p-4">
              <div 
                className="flex items-center space-x-4 cursor-pointer"
                onClick={() => togglePhaseExpansion(phase.id)}
              >
                <div className="flex-shrink-0">
                  {getPhaseIcon(phase.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {phase.name}
                    </h3>
                    {getStatusBadge(phase.status)}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {phase.start_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(parseISO(phase.start_date), 'MMM d')}</span>
                        {phase.end_date && (
                          <span>- {format(parseISO(phase.end_date), 'MMM d')}</span>
                        )}
                      </div>
                    )}
                    
                    {phase.end_date && phase.status !== 'completed' && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{calculateDaysRemaining(phase.end_date)} days remaining</span>
                      </div>
                    )}
                    
                    {phase.photos_count && phase.photos_count > 0 && (
                      <div className="flex items-center space-x-1">
                        <Camera className="h-4 w-4" />
                        <span>{phase.photos_count} photos</span>
                      </div>
                    )}
                  </div>
                  
                  {phase.status === 'in_progress' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{phase.completion_percentage}%</span>
                      </div>
                      <Progress value={phase.completion_percentage} className="h-1.5" />
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {expandedPhase === phase.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {/* Expanded Phase Details */}
              {expandedPhase === phase.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {phase.description && (
                    <div>
                      <h4 className="font-medium mb-1">Phase Description</h4>
                      <p className="text-sm text-muted-foreground">{phase.description}</p>
                    </div>
                  )}
                  
                  {phase.customer_notes && (
                    <div>
                      <h4 className="font-medium mb-1">Notes for You</h4>
                      <p className="text-sm text-muted-foreground">{phase.customer_notes}</p>
                    </div>
                  )}
                  
                  {phase.milestones && phase.milestones.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Milestones</h4>
                      <div className="space-y-1">
                        {phase.milestones.map((milestone, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>{milestone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Camera className="h-4 w-4" />
                      <span>View Photos</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Ask Question</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};