import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, ZoomIn, ZoomOut, Filter, Download, Settings, 
  Target, TrendingUp, Clock, GitBranch, AlertTriangle,
  Play, Pause, CheckCircle, Circle, Diamond
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { GanttTimeline } from './GanttTimeline';
import { GanttFilters } from './GanttFilters';
import { GanttExport } from './GanttExport';
import { CriticalPathIndicator } from './CriticalPathIndicator';
import { MilestoneMarkers } from './MilestoneMarkers';
import { DependencyArrows } from './DependencyArrows';
import { ProgressBars } from './ProgressBars';
import { BaselineComparison } from './BaselineComparison';

export interface EnhancedPhase {
  id: string;
  project_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  baseline_start_date: string | null;
  baseline_end_date: string | null;
  duration_days: number;
  baseline_duration_days: number;
  completion_percentage: number;
  status: 'Planned' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  is_critical_path: boolean;
  color: string | null;
  resource_id: string | null;
  effort_hours: number;
  project_code?: string;
  project_name?: string;
  resource_name?: string;
}

export interface EnhancedProject {
  id: string;
  code: string;
  name: string;
  status: string;
  pm_name?: string;
  start_target: string;
  finish_target: string;
  completion_percentage?: number;
}

export interface Milestone {
  id: string;
  project_id: string;
  milestone_name: string;
  target_date: string | null;
  actual_date: string | null;
  milestone_type: 'delivery' | 'review' | 'payment' | 'approval' | 'start' | 'finish';
  is_critical: boolean;
  completion_percentage: number;
  color: string;
}

export interface GanttViewSettings {
  zoom_level: 'days' | 'weeks' | 'months' | 'quarters';
  show_critical_path: boolean;
  show_baselines: boolean;
  show_progress: boolean;
  show_milestones: boolean;
  show_dependencies: boolean;
  group_by: 'none' | 'status' | 'resource' | 'priority';
  filter_status: string[];
  filter_resources: string[];
}

interface Props {
  projects: EnhancedProject[];
  phases: EnhancedPhase[];
  milestones: Milestone[];
  onProjectSelect: (project: EnhancedProject) => void;
  onPhaseUpdate: (phase: EnhancedPhase) => void;
  onRefresh: () => void;
}

export function SophisticatedGantt({ projects, phases, milestones, onProjectSelect, onPhaseUpdate, onRefresh }: Props) {
  const { toast } = useToast();
  const [viewSettings, setViewSettings] = useState<GanttViewSettings>({
    zoom_level: 'weeks',
    show_critical_path: true,
    show_baselines: false,
    show_progress: true,
    show_milestones: true,
    show_dependencies: true,
    group_by: 'none',
    filter_status: [],
    filter_resources: []
  });
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate timeline bounds based on zoom level
  const timelineBounds = useMemo(() => {
    const allDates = [
      ...projects.map(p => p.start_target),
      ...projects.map(p => p.finish_target),
      ...phases.filter(p => p.start_date).map(p => p.start_date!),
      ...phases.filter(p => p.end_date).map(p => p.end_date!),
      ...phases.filter(p => p.baseline_start_date).map(p => p.baseline_start_date!),
      ...phases.filter(p => p.baseline_end_date).map(p => p.baseline_end_date!),
      ...milestones.filter(m => m.target_date).map(m => m.target_date!)
    ].filter(Boolean);

    if (allDates.length === 0) {
      const today = new Date();
      return {
        start: today,
        end: addDays(today, 365),
        totalDays: 365
      };
    }

    const startDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())));
    const endDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())));
    
    // Adjust bounds based on zoom level
    let adjustedStart: Date, adjustedEnd: Date;
    
    switch (viewSettings.zoom_level) {
      case 'days':
        adjustedStart = addDays(startDate, -7);
        adjustedEnd = addDays(endDate, 7);
        break;
      case 'weeks':
        adjustedStart = startOfWeek(addDays(startDate, -14));
        adjustedEnd = endOfWeek(addDays(endDate, 14));
        break;
      case 'months':
        adjustedStart = startOfMonth(addDays(startDate, -30));
        adjustedEnd = endOfMonth(addDays(endDate, 30));
        break;
      case 'quarters':
        adjustedStart = startOfQuarter(addDays(startDate, -90));
        adjustedEnd = endOfQuarter(addDays(endDate, 90));
        break;
      default:
        adjustedStart = addDays(startDate, -30);
        adjustedEnd = addDays(endDate, 30);
    }
    
    return {
      start: adjustedStart,
      end: adjustedEnd,
      totalDays: differenceInDays(adjustedEnd, adjustedStart)
    };
  }, [projects, phases, milestones, viewSettings.zoom_level]);

  // Filter and group phases
  const processedPhases = useMemo(() => {
    let filtered = phases;

    // Apply status filter
    if (viewSettings.filter_status.length > 0) {
      filtered = filtered.filter(p => viewSettings.filter_status.includes(p.status));
    }

    // Apply resource filter
    if (viewSettings.filter_resources.length > 0) {
      filtered = filtered.filter(p => p.resource_id && viewSettings.filter_resources.includes(p.resource_id));
    }

    // Group phases
    const grouped: Record<string, EnhancedPhase[]> = {};
    
    if (viewSettings.group_by === 'none') {
      // Group by project
      filtered.forEach(phase => {
        const key = phase.project_id;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(phase);
      });
    } else {
      // Group by selected criteria
      filtered.forEach(phase => {
        let key: string;
        switch (viewSettings.group_by) {
          case 'status':
            key = phase.status;
            break;
          case 'resource':
            key = phase.resource_name || 'Unassigned';
            break;
          case 'priority':
            key = phase.priority;
            break;
          default:
            key = phase.project_id;
        }
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(phase);
      });
    }

    return grouped;
  }, [phases, viewSettings]);

  // Save view settings to database
  const saveViewSettings = useCallback(async (newSettings: Partial<GanttViewSettings>) => {
    const updatedSettings = { ...viewSettings, ...newSettings };
    setViewSettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('gantt_view_settings')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...updatedSettings
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save view settings:', error);
    }
  }, [viewSettings]);

  // Load view settings from database
  useEffect(() => {
    const loadViewSettings = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data, error } = await supabase
          .from('gantt_view_settings')
          .select('*')
          .eq('user_id', user.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setViewSettings({
            zoom_level: data.zoom_level as 'days' | 'weeks' | 'months' | 'quarters',
            show_critical_path: data.show_critical_path,
            show_baselines: data.show_baselines,
            show_progress: data.show_progress,
            show_milestones: data.show_milestones,
            show_dependencies: data.show_dependencies,
            group_by: data.group_by as 'none' | 'status' | 'resource' | 'priority',
            filter_status: data.filter_status || [],
            filter_resources: data.filter_resources || []
          });
        }
      } catch (error) {
        console.error('Failed to load view settings:', error);
      }
    };

    loadViewSettings();
  }, []);

  // Calculate critical path for a project
  const calculateCriticalPath = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('calculate_critical_path', {
        project_id_param: projectId
      });

      if (error) throw error;

      toast({
        title: "Critical Path Calculated",
        description: `Found ${(data as any)?.critical_phases?.length || 0} phases on critical path`
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to calculate critical path:', error);
      toast({
        title: "Error",
        description: "Failed to calculate critical path",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create baseline for a project
  const createBaseline = async (projectId: string, name: string = 'Manual Baseline') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_project_baseline', {
        project_id_param: projectId,
        baseline_name_param: name
      });

      if (error) throw error;

      toast({
        title: "Baseline Created",
        description: `Created baseline: ${name}`
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to create baseline:', error);
      toast({
        title: "Error",
        description: "Failed to create baseline",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update phase progress
  const updatePhaseProgress = async (phaseId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('project_phases')
        .update({ completion_percentage: progress })
        .eq('id', phaseId);

      if (error) throw error;

      toast({
        title: "Progress Updated",
        description: `Phase progress set to ${progress}%`
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In Progress': return <Play className="h-4 w-4 text-blue-500" />;
      case 'On Hold': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'Cancelled': return <Circle className="h-4 w-4 text-red-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sophisticated Project Gantt
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveViewSettings({ zoom_level: 'days' })}
                className={viewSettings.zoom_level === 'days' ? 'bg-primary text-primary-foreground' : ''}
              >
                Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveViewSettings({ zoom_level: 'weeks' })}
                className={viewSettings.zoom_level === 'weeks' ? 'bg-primary text-primary-foreground' : ''}
              >
                Weeks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveViewSettings({ zoom_level: 'months' })}
                className={viewSettings.zoom_level === 'months' ? 'bg-primary text-primary-foreground' : ''}
              >
                Months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveViewSettings({ zoom_level: 'quarters' })}
                className={viewSettings.zoom_level === 'quarters' ? 'bg-primary text-primary-foreground' : ''}
              >
                Quarters
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <GanttExport projects={projects} phases={phases} milestones={milestones} />
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* View Options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Display Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={viewSettings.show_critical_path}
                    onCheckedChange={(checked) => saveViewSettings({ show_critical_path: checked })}
                  />
                  <Label className="text-sm">Critical Path</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={viewSettings.show_baselines}
                    onCheckedChange={(checked) => saveViewSettings({ show_baselines: checked })}
                  />
                  <Label className="text-sm">Baselines</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={viewSettings.show_progress}
                    onCheckedChange={(checked) => saveViewSettings({ show_progress: checked })}
                  />
                  <Label className="text-sm">Progress</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={viewSettings.show_milestones}
                    onCheckedChange={(checked) => saveViewSettings({ show_milestones: checked })}
                  />
                  <Label className="text-sm">Milestones</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={viewSettings.show_dependencies}
                    onCheckedChange={(checked) => saveViewSettings({ show_dependencies: checked })}
                  />
                  <Label className="text-sm">Dependencies</Label>
                </div>
              </div>
            </div>

            {/* Grouping */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Group By</Label>
              <Select
                value={viewSettings.group_by}
                onValueChange={(value) => saveViewSettings({ group_by: value as 'none' | 'status' | 'resource' | 'priority' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Project</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <GanttFilters
              phases={phases}
              viewSettings={viewSettings}
              onFilterChange={saveViewSettings}
            />

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => projects.forEach(p => calculateCriticalPath(p.id))}
                  disabled={loading}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Calculate Critical Paths
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => projects.forEach(p => createBaseline(p.id))}
                  disabled={loading}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Create Baselines
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Gantt Chart */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {/* Timeline Header */}
            <GanttTimeline
              timelineBounds={timelineBounds}
              zoomLevel={viewSettings.zoom_level}
            />

            {/* Content Area */}
            <div className="relative">
              {Object.entries(processedPhases).map(([groupKey, groupPhases]) => {
                const project = projects.find(p => p.id === groupKey);
                const groupName = viewSettings.group_by === 'none' 
                  ? (project ? `${project.code} - ${project.name}` : groupKey)
                  : groupKey;

                return (
                  <div key={groupKey} className="border-b border-border">
                    {/* Group Header */}
                    <div className="bg-muted/30 p-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{groupName}</h3>
                          {project && (
                            <Badge variant="outline">{project.status}</Badge>
                          )}
                          {viewSettings.show_critical_path && (
                            <CriticalPathIndicator phases={groupPhases} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {project && (
                            <>
                              <Progress
                                value={project.completion_percentage || 0}
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">
                                {project.completion_percentage || 0}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Phase Rows */}
                    <div className="relative">
                      {groupPhases.map((phase, index) => (
                        <div key={phase.id} className="flex border-b border-border/50 min-h-[48px]">
                          {/* Phase Info */}
                          <div className="w-80 p-3 bg-background border-r border-border">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(phase.status)}
                              <span className="font-medium text-sm">{phase.name}</span>
                              {phase.is_critical_path && viewSettings.show_critical_path && (
                                <Badge variant="destructive" className="text-xs">
                                  Critical
                                </Badge>
                              )}
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(phase.priority)}`} />
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{phase.duration_days}d</span>
                              {phase.effort_hours > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{phase.effort_hours}h</span>
                                </>
                              )}
                              {phase.resource_name && (
                                <>
                                  <span>•</span>
                                  <span>{phase.resource_name}</span>
                                </>
                              )}
                            </div>
                            {viewSettings.show_progress && (
                              <div className="mt-2 flex items-center gap-2">
                                <Progress value={phase.completion_percentage} className="flex-1 h-1" />
                                <span className="text-xs">{phase.completion_percentage}%</span>
                              </div>
                            )}
                          </div>

                          {/* Timeline Area */}
                          <div className="flex-1 relative">
                            {/* Baseline Comparison */}
                            {viewSettings.show_baselines && (
                              <BaselineComparison
                                phase={phase}
                                timelineBounds={timelineBounds}
                              />
                            )}

                            {/* Progress Bars */}
                            {viewSettings.show_progress && (
                              <ProgressBars
                                phase={phase}
                                timelineBounds={timelineBounds}
                                onProgressUpdate={(progress) => updatePhaseProgress(phase.id, progress)}
                              />
                            )}

                            {/* Dependencies */}
                            {viewSettings.show_dependencies && (
                              <DependencyArrows
                                phase={phase}
                                allPhases={phases}
                                timelineBounds={timelineBounds}
                              />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Milestones for this group */}
                      {viewSettings.show_milestones && (
                        <MilestoneMarkers
                          milestones={milestones.filter(m => 
                            viewSettings.group_by === 'none' 
                              ? m.project_id === groupKey
                              : groupPhases.some(p => p.project_id === m.project_id)
                          )}
                          timelineBounds={timelineBounds}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Status Icons</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-500" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-yellow-500" />
                  <span>On Hold</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span>Planned</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Priority Levels</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Low</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Milestone Types</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Diamond className="h-4 w-4 text-blue-500" />
                  <span>Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Approval</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}