import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, CheckCircle2, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    inSelections: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [customers, projects, approvals] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('titan_projects').select('id, status', { count: 'exact' }),
      supabase.from('project_approvals').select('id', { count: 'exact', head: true })
    ]);

    const activeCount = projects.data?.filter(p => p.status !== 'completed').length || 0;
    const selectionsCount = projects.data?.filter(p => p.status === 'selections').length || 0;

    setStats({
      totalCustomers: customers.count || 0,
      activeProjects: activeCount,
      pendingApprovals: 0, // Can be enhanced with proper approval tracking
      inSelections: selectionsCount
    });
  };

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-blue-600' },
    { title: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, color: 'text-green-600' },
    { title: 'Pending Approvals', value: stats.pendingApprovals, icon: CheckCircle2, color: 'text-orange-600' },
    { title: 'In Selections', value: stats.inSelections, icon: Clock, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to TITAN Admin. Here's an overview of your projects and customers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest projects and customer updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity to display.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
