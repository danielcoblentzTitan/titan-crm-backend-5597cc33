import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MasterScheduleView } from '../schedule/MasterScheduleView';
import { AllProjectsWeatherRail } from './AllProjectsWeatherRail';
import { ShiftScheduleDialog } from './ShiftScheduleDialog';
import { LiveMasterSchedule } from './LiveMasterSchedule';
import type { EnhancedProject, EnhancedPhase, Milestone } from '../gantt/SophisticatedGantt';
import { SchedulerKanban } from './SchedulerKanban';
import { generateProjectCode } from '@/lib/project-utils';

interface Project extends EnhancedProject {
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  size_sqft: number | null;
  pm_user_id: string | null;
  notes: string | null;
  pm_name?: string;
  building_type?: string | null;
}

interface Phase extends EnhancedPhase {
  sort_order?: number;
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  dependency_phase_id: string | null;
  project_code?: string;
  project_name?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'PM' | 'Viewer';
}

export function SchedulerMissionControl() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const geocodedProjectsRef = useRef<Set<string>>(new Set()); // Track geocoded projects to prevent loops
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pmFilter, setPmFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Auto-select Fulford project for weather display
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const fulfordProject = projects.find(p => 
        p.code?.toLowerCase().includes('fulford') || 
        p.name?.toLowerCase().includes('fulford')
      );
      if (fulfordProject) {
        setSelectedProject(fulfordProject);
      }
    }
  }, [projects, selectedProject]);

  // Realtime listeners for automatic updates
  useEffect(() => {
    const channel = supabase
      .channel('mission-control-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projects_new' 
      }, async (payload) => {
        console.log('Projects (new) change:', payload.eventType);
        // Don't geocode on INSERT - let the initial load handle it to avoid infinite loops
        // Only refresh the UI
        setRefreshKey(prev => prev + 1);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projects' 
      }, () => {
        console.log('Projects (legacy) updated, refreshing...');
        setRefreshKey(prev => prev + 1);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'project_phases' 
      }, () => {
        console.log('Project phases updated, refreshing...');
        setRefreshKey(prev => prev + 1);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'project_schedules' 
      }, () => {
        console.log('Project schedules updated, refreshing...');
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    console.log('Starting loadData...');
    setLoading(true);
    try {
      // Load users
      console.log('Loading users...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      console.log('Users query result:', { usersData, usersError });
      
      if (usersError) throw usersError;
      setUsers((usersData || []) as User[]);

      // Load projects from both new and legacy tables
      console.log('Loading projects...');
      const [
        { data: projectsNew, error: projectsNewError },
        { data: legacyProjects, error: legacyError }
      ] = await Promise.all([
        supabase
          .from('projects_new')
          .select(`
            *,
            pm:users!pm_user_id(name)
          `)
          .order('code'),
        supabase
          .from('projects')
          .select('id, name, status, customer_name, building_type, address, city, state, zip, latitude, longitude')
          .in('status', ['Active', 'In Progress', 'Planning'])
          .order('name')
      ]);
      
      console.log('Projects query result:', { projectsNew, projectsNewError, legacyProjects, legacyError });
      
      if (projectsNewError) throw projectsNewError;
      if (legacyError) throw legacyError;
      
      const projectsWithPM = (projectsNew || []).map(project => {
        const lastName = (project.name || '').trim().split(/\s+/).slice(-1)[0] || 'PROJECT';
        const computedCode = project.code && project.code.startsWith('TB-')
          ? project.code
          : generateProjectCode(project.building_type || 'Barndominium', lastName, '001');
        return {
          ...project,
          code: computedCode,
          pm_name: project.pm?.name || 'Unassigned'
        };
      }) as Project[];
      
      const legacyProjectsFormatted = (legacyProjects || []).map(proj => {
        const lastName = (proj.customer_name || proj.name || '').trim().split(/\s+/).slice(-1)[0] || 'PROJECT';
        const computedCode = generateProjectCode((proj as any).building_type || 'Barndominium', lastName, '001');
        return {
          id: proj.id,
          code: computedCode,
          name: proj.name || 'Untitled Project',
          status: proj.status || 'Active',
          city: proj.city || null,
          state: proj.state || null,
          zip: proj.zip || null,
          latitude: (proj as any).latitude || null,
          longitude: (proj as any).longitude || null,
          size_sqft: null,
          pm_user_id: null,
          notes: null,
          pm_name: 'Unassigned',
          building_type: (proj as any).building_type || null,
          start_target: null,
          finish_target: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }) as Project[];

      // Dedupe legacy projects against projects_new using normalized names
      const normalizeName = (name: string) =>
        (name || '')
          .toLowerCase()
          .replace(/[-_]/g, ' ')
          .replace(/[()]/g, '')
          .split(/\s+/)
          .filter((w) => w && w !== 'project' && w !== 'projects')
          .join(' ') 
          .trim();

      const newKeys = new Set((projectsWithPM || []).map(p => normalizeName(p.name)));
      const legacyFilteredFormatted = legacyProjectsFormatted.filter(lp => !newKeys.has(normalizeName(lp.name)));
      
      const combined = [...projectsWithPM, ...legacyFilteredFormatted];
      setProjects(combined);

      // Attempt to geocode missing coordinates for ALL projects (new and legacy) in background
      // Only geocode projects we haven't attempted yet to prevent infinite loops
      const missingCoords = combined.filter(p => 
        (!p.latitude || !p.longitude) && 
        p.city && 
        p.state && 
        !geocodedProjectsRef.current.has(p.id)
      );
      
      if (missingCoords.length > 0) {
        console.log(`Found ${missingCoords.length} projects without coordinates, geocoding...`);
        // Mark as geocoded immediately to prevent re-attempts
        missingCoords.forEach(p => geocodedProjectsRef.current.add(p.id));
        
        // Fire-and-forget to edge function; no await to avoid blocking UI
        Promise.all(
          missingCoords.slice(0, 5).map(p => 
            supabase.functions.invoke('geocode-project', {
              body: { project_id: p.id, city: p.city, state: p.state, zip: p.zip }
            }).catch(err => {
              console.warn(`Failed to geocode ${p.id}:`, err);
              // Remove from set if failed so we can retry later
              geocodedProjectsRef.current.delete(p.id);
            })
          )
        ).then(() => {
          // Only refresh after geocoding completes, not in the loop
          setTimeout(() => setRefreshKey(prev => prev + 1), 2000);
        });
      }

      // Load enhanced phases with all tracking data
      console.log('Loading enhanced phases...');
      const { data: phasesData, error: phasesError } = await supabase
        .from('project_phases')
        .select(`
          *,
          resource:resources(name)
        `)
        .order('start_date');
      
      console.log('Enhanced phases query result:', { phasesData, phasesError });
      
      if (phasesError) throw phasesError;
      
      const enhancedPhases = (phasesData || []).map(phase => ({
        ...phase,
        project_code: '', // Will be filled by joining with projects
        project_name: '', // Will be filled by joining with projects
        resource_name: phase.resource?.name || 'Unassigned',
        // Ensure compatibility with both interfaces
        planned_start: phase.start_date,
        planned_finish: phase.end_date,
        actual_start: phase.actual_start_date,
        actual_finish: phase.actual_end_date,
        dependency_phase_id: null, // TODO: Add to project_phases table
        sort_order: 0
      }));
      
      // Add project info to phases
      const phasesWithProject = enhancedPhases.map(phase => {
        const project = projectsWithPM.find(p => p.id === phase.project_id);
        return {
          ...phase,
          project_code: project?.code || '',
          project_name: project?.name || ''
        };
      });
      
      setPhases(phasesWithProject as Phase[]);

      // Load milestones
      console.log('Loading milestones...');
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .order('target_date');
      
      console.log('Milestones query result:', { milestonesData, milestonesError });
      
      if (milestonesError) throw milestonesError;
      setMilestones((milestonesData || []) as Milestone[]);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load mission control data",
        variant: "destructive"
      });
    } finally {
      console.log('loadData completed');
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (statusFilter !== 'all' && project.status !== statusFilter) return false;
    if (pmFilter !== 'all' && project.pm_user_id !== pmFilter) return false;
    if (cityFilter && project.city && !project.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    return true;
  });

  const activeProjects = filteredProjects.filter(p => 
    p.status === 'Active'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Lead': return 'bg-blue-500';
      case 'On Hold': return 'bg-yellow-500';
      case 'Closed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Blocked': return 'bg-red-500';
      case 'Not Started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const blockedPhases = phases.filter(p => p.status === 'On Hold'); // Map to closest equivalent
  const inProgressPhases = phases.filter(p => p.status === 'In Progress');

  // Update phase handler for sophisticated Gantt
  const handlePhaseUpdate = async (phase: Phase) => {
    try {
      const { error } = await supabase
        .from('project_phases')
        .update({
          start_date: phase.start_date,
          end_date: phase.end_date,
          completion_percentage: phase.completion_percentage,
          status: phase.status
        })
        .eq('id', phase.id);

      if (error) throw error;
      
      // Trigger refresh
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to update phase:', error);
      toast({
        title: "Error",
        description: "Failed to update phase",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading Mission Control...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Titan Buildings — Mission Control
          </h1>
          <p className="text-muted-foreground">
            Centralized command board for scheduling and managing all barndominium projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="py-2">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              {projects.filter(p => p.status === 'Active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {inProgressPhases.length} phases in progress
            </p>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-medium">Lead Projects</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              {projects.filter(p => p.status === 'Lead').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline opportunities
            </p>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-medium">Blocked Phases</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-red-600">
              {blockedPhases.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              {activeProjects.length > 0 
                ? `${(activeProjects.reduce((sum, p) => sum + (p.size_sqft || 0), 0) / 1000).toFixed(0)}k`
                : '0k'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Total sq ft
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Blocked Phases Alert */}
      {blockedPhases.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Blocked Phases Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockedPhases.slice(0, 3).map(phase => (
                <div key={phase.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{phase.project_code}</span>
                    <span className="mx-2">•</span>
                    <span>{phase.name}</span>
                  </div>
                  <Badge variant="destructive">On Hold</Badge>
                </div>
              ))}
              {blockedPhases.length > 3 && (
                <p className="text-sm text-red-600">
                  +{blockedPhases.length - 3} more blocked phases
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Projects Weather Rail */}
      <AllProjectsWeatherRail projects={filteredProjects} />

      {/* Main Scheduler Interface */}
      <div className="w-full">
        {/* Scheduler Views */}
        <div className="w-full">
          <Tabs defaultValue="gantt" className="w-full">
            <TabsList>
              <TabsTrigger value="gantt">Master Schedule</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">Project List</TabsTrigger>
            </TabsList>

            <TabsContent value="gantt" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Live schedule view with weather delay integration
                </div>
                <Button 
                  onClick={() => setShiftDialogOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Shift Schedule
                </Button>
              </div>
              <LiveMasterSchedule />
            </TabsContent>

            <TabsContent value="kanban" className="space-y-4">
              <SchedulerKanban 
                phases={phases.filter(p => 
                  activeProjects.some(proj => proj.id === p.project_id)
                ) as any}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredProjects.map(project => (
                      <div 
                        key={project.id}
                        className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-accent"
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                          <div>
                            <div className="font-medium">{project.code}</div>
                            <div className="text-sm text-muted-foreground">{project.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {project.city || 'Unknown'}, {project.state || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {project.pm_name}
                          </div>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Shift Schedule Dialog */}
      <ShiftScheduleDialog 
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        projects={activeProjects}
        onScheduleShifted={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}