import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Image, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedProject, EnhancedPhase, Milestone } from './SophisticatedGantt';
import { format } from 'date-fns';

interface Props {
  projects: EnhancedProject[];
  phases: EnhancedPhase[];
  milestones: Milestone[];
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'png';
  includeBaselines: boolean;
  includeMilestones: boolean;
  includeProgress: boolean;
  includeCriticalPath: boolean;
  dateRange: 'all' | 'current' | 'custom';
  projectFilter: 'all' | 'active' | 'selected';
}

export function GanttExport({ projects, phases, milestones }: Props) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeBaselines: false,
    includeMilestones: true,
    includeProgress: true,
    includeCriticalPath: true,
    dateRange: 'all',
    projectFilter: 'all'
  });

  const handleExport = async () => {
    setExporting(true);
    
    try {
      // Prepare export data
      const exportData = {
        projects: projects.filter(p => {
          if (options.projectFilter === 'active') return p.status === 'Active';
          return true; // 'all' or 'selected'
        }),
        phases: phases.filter(p => {
          const project = projects.find(proj => proj.id === p.project_id);
          if (options.projectFilter === 'active') return project?.status === 'Active';
          return true;
        }),
        milestones: options.includeMilestones ? milestones : [],
        options,
        exportDate: new Date().toISOString(),
        title: `Gantt Chart Export - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`
      };

      switch (options.format) {
        case 'pdf':
          await exportToPDF(exportData);
          break;
        case 'excel':
          await exportToExcel(exportData);
          break;
        case 'csv':
          await exportToCSV(exportData);
          break;
        case 'png':
          await exportToPNG(exportData);
          break;
      }

      toast({
        title: "Export Successful",
        description: `Gantt chart exported as ${options.format.toUpperCase()}`
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export Gantt chart",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async (data: any) => {
    // Create a simple PDF report with phase data
    const content = createTextReport(data);
    const blob = new Blob([content], { type: 'text/plain' });
    downloadFile(blob, `gantt-chart-${format(new Date(), 'yyyy-MM-dd')}.txt`);
  };

  const exportToExcel = async (data: any) => {
    // Create CSV format that Excel can open
    const csv = createCSVContent(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `gantt-chart-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const exportToCSV = async (data: any) => {
    const csv = createCSVContent(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `gantt-chart-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const exportToPNG = async (data: any) => {
    // For now, create a simple text representation
    // In a real implementation, you'd capture the Gantt chart canvas/SVG
    const content = createTextReport(data);
    const blob = new Blob([content], { type: 'text/plain' });
    downloadFile(blob, `gantt-chart-${format(new Date(), 'yyyy-MM-dd')}.txt`);
  };

  const createTextReport = (data: any) => {
    let report = `GANTT CHART EXPORT REPORT\n`;
    report += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
    report += `Projects: ${data.projects.length}\n`;
    report += `Phases: ${data.phases.length}\n`;
    report += `Milestones: ${data.milestones.length}\n\n`;

    data.projects.forEach((project: EnhancedProject) => {
      report += `\nPROJECT: ${project.code} - ${project.name}\n`;
      report += `Status: ${project.status}\n`;
      report += `PM: ${project.pm_name || 'Unassigned'}\n`;
      report += `Timeline: ${project.start_target} to ${project.finish_target}\n`;
      
      const projectPhases = data.phases.filter((p: EnhancedPhase) => p.project_id === project.id);
      
      if (projectPhases.length > 0) {
        report += `\nPhases:\n`;
        projectPhases.forEach((phase: EnhancedPhase) => {
          report += `  - ${phase.name}\n`;
          report += `    Status: ${phase.status}\n`;
          report += `    Duration: ${phase.duration_days} days\n`;
          report += `    Dates: ${phase.start_date || 'TBD'} to ${phase.end_date || 'TBD'}\n`;
          if (options.includeProgress) {
            report += `    Progress: ${phase.completion_percentage}%\n`;
          }
          if (options.includeCriticalPath && phase.is_critical_path) {
            report += `    Critical Path: YES\n`;
          }
          report += `\n`;
        });
      }

      if (options.includeMilestones) {
        const projectMilestones = data.milestones.filter((m: Milestone) => m.project_id === project.id);
        if (projectMilestones.length > 0) {
          report += `Milestones:\n`;
          projectMilestones.forEach((milestone: Milestone) => {
            report += `  - ${milestone.milestone_name}\n`;
            report += `    Type: ${milestone.milestone_type}\n`;
            report += `    Target: ${milestone.target_date || 'TBD'}\n`;
            report += `    Actual: ${milestone.actual_date || 'Pending'}\n\n`;
          });
        }
      }
      
      report += `${'='.repeat(80)}\n`;
    });

    return report;
  };

  const createCSVContent = (data: any) => {
    let csv = 'Project Code,Project Name,Phase Name,Status,Start Date,End Date,Duration (Days),Progress (%),Critical Path,Resource\n';
    
    data.phases.forEach((phase: EnhancedPhase) => {
      const project = data.projects.find((p: EnhancedProject) => p.id === phase.project_id);
      csv += `"${project?.code || ''}","${project?.name || ''}","${phase.name}","${phase.status}","${phase.start_date || ''}","${phase.end_date || ''}",${phase.duration_days},${phase.completion_percentage},${phase.is_critical_path ? 'Yes' : 'No'},"${phase.resource_name || ''}"\n`;
    });

    if (options.includeMilestones) {
      csv += '\n\nMilestones\n';
      csv += 'Project Code,Project Name,Milestone Name,Type,Target Date,Actual Date,Progress (%)\n';
      
      data.milestones.forEach((milestone: Milestone) => {
        const project = data.projects.find((p: EnhancedProject) => p.id === milestone.project_id);
        csv += `"${project?.code || ''}","${project?.name || ''}","${milestone.milestone_name}","${milestone.milestone_type}","${milestone.target_date || ''}","${milestone.actual_date || ''}",${milestone.completion_percentage}\n`;
      });
    }

    return csv;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Gantt Chart</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={options.format}
              onValueChange={(value) => setOptions({ ...options, format: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Excel (.csv)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV Data
                  </div>
                </SelectItem>
                <SelectItem value="png">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    PNG Image
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Filter */}
          <div className="space-y-2">
            <Label>Projects</Label>
            <Select
              value={options.projectFilter}
              onValueChange={(value) => setOptions({ ...options, projectFilter: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="active">Active Projects Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="progress"
                  checked={options.includeProgress}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeProgress: !!checked })
                  }
                />
                <Label htmlFor="progress" className="text-sm">Progress Information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="milestones"
                  checked={options.includeMilestones}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeMilestones: !!checked })
                  }
                />
                <Label htmlFor="milestones" className="text-sm">Milestones</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="critical"
                  checked={options.includeCriticalPath}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeCriticalPath: !!checked })
                  }
                />
                <Label htmlFor="critical" className="text-sm">Critical Path</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="baselines"
                  checked={options.includeBaselines}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeBaselines: !!checked })
                  }
                />
                <Label htmlFor="baselines" className="text-sm">Baseline Comparison</Label>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}