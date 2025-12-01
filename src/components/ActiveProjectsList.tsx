import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/services/supabaseService";
import { ActiveProjectRow } from "@/components/projects/ActiveProjectRow";
import { useProjectMetrics } from "@/hooks/useProjectMetrics";

interface PaymentData {
  projectId: string;
  totalPaid: number;
  totalBudget: number;
  remainingBalance: number;
  paymentProgress: number;
}

export const ActiveProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { paymentsById: paymentData } = useProjectMetrics(projects);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Using per-project phases via ActiveProjectRow for consistency with Customer Portal

  useEffect(() => {
    fetchActiveProjects();
  }, []);

  // Realtime updates for project changes (phase, status, etc.)
  useEffect(() => {
    const channel = supabase
      .channel('projects_realtime_active_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        setProjects((prev) => {
          const record = (payload.new || payload.old) as Partial<Project> & { id: string };
          if (!record || !record.id) return prev;

          if (payload.eventType === 'DELETE') {
            return prev.filter(p => p.id !== record.id);
          }

          // INSERT or UPDATE
          const exists = prev.some(p => p.id === record.id);
          const updated = exists
            ? prev.map(p => (p.id === record.id ? ({ ...p, ...(payload.new as Partial<Project>) } as Project) : p))
            : [...prev, record as Project];

          // Keep sorted by start_date
          return updated
            .filter(p => p.status !== 'Cancelled')
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'Completed')
        .neq('status', 'Cancelled')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    // Navigate to projects tab - the parent component can handle highlighting the specific project
    navigate('/dashboard?tab=projects&project=' + projectId);
  };

  const handleViewPortal = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent triggering the parent click
    navigate(`/customer-portal?projectId=${projectId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString.split('T')[0] + 'T12:00:00Z').toLocaleDateString();
  };

  const getProjectTypeDisplay = (description: string) => {
    // Extract project type from description or use a default
    if (description?.toLowerCase().includes('barndominium')) return 'Barndominium';
    if (description?.toLowerCase().includes('warehouse')) return 'Warehouse';
    if (description?.toLowerCase().includes('garage')) return 'Garage';
    if (description?.toLowerCase().includes('shop')) return 'Shop';
    return 'Building Project';
  };

  // Calculate summary totals
  const totalActiveProjects = projects.length;
  const totalRevenue = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const totalPaidRevenue = Object.values(paymentData).reduce((sum, payment) => sum + payment.totalPaid, 0);
  const totalRemainingRevenue = Object.values(paymentData).reduce((sum, payment) => sum + payment.remainingBalance, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Remaining Revenue</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading projects...</div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold">$0</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold">$0</div>
              <div className="text-sm text-muted-foreground">Remaining Revenue</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No active projects found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold mb-4">Active Projects</CardTitle>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalActiveProjects}</div>
            <div className="text-sm text-muted-foreground">Active Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">${totalRemainingRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Remaining Revenue</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <ActiveProjectRow
              key={project.id}
              project={project}
              payment={paymentData[project.id]}
              onProjectClick={handleProjectClick}
              onViewPortal={handleViewPortal}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};