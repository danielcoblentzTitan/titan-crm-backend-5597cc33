import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project } from '@/services/supabaseService';

interface SalesMetricCardsProps {
  residential: Project[];
  barndominium: Project[];
  commercial: Project[];
  cancelled: Project[];
  year: string;
}

export const SalesMetricCards = ({ 
  residential, 
  barndominium, 
  commercial, 
  cancelled, 
  year 
}: SalesMetricCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotals = (projects: Project[]) => {
    const count = projects.length;
    const total = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const profit = projects.reduce((sum, project) => sum + (project.estimated_profit || 0), 0);
    const average = count > 0 ? total / count : 0;
    return { count, total, profit, average };
  };

  const residentialStats = calculateTotals(residential);
  const barndominiumStats = calculateTotals(barndominium);
  const commercialStats = calculateTotals(commercial);
  const cancelledStats = calculateTotals(cancelled);

  const totalRevenue = residentialStats.total + barndominiumStats.total + commercialStats.total;
  const totalProfit = residentialStats.profit + barndominiumStats.profit + commercialStats.profit;
  const totalProjects = residentialStats.count + barndominiumStats.count + commercialStats.count;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Calculate best performing months
  const getBestMonths = () => {
    const allProjects = [...residential, ...barndominium, ...commercial];
    const monthlyData: Record<string, { revenue: number; count: number; name: string }> = {};
    
    allProjects.forEach(project => {
      if (project.start_date) {
        const date = new Date(project.start_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, count: 0, name: monthName };
        }
        
        monthlyData[monthKey].revenue += project.budget || 0;
        monthlyData[monthKey].count += 1;
      }
    });
    
    const months = Object.values(monthlyData);
    const bestRevenueMonth = months.reduce((best, current) => 
      current.revenue > best.revenue ? current : best, { revenue: 0, count: 0, name: 'N/A' });
    const bestCountMonth = months.reduce((best, current) => 
      current.count > best.count ? current : best, { revenue: 0, count: 0, name: 'N/A' });
    
    return { bestRevenueMonth, bestCountMonth };
  };

  const { bestRevenueMonth, bestCountMonth } = getBestMonths();

  // Yearly goals (these could be stored in database or config)
  const yearlyGoals = {
    revenue: 2000000, // $2M goal
    projects: 20,
    profit: 400000, // $400K goal
  };

  const revenueProgress = totalRevenue > 0 ? (totalRevenue / yearlyGoals.revenue) * 100 : 0;
  const projectProgress = totalProjects > 0 ? (totalProjects / yearlyGoals.projects) * 100 : 0;

  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueProgress.toFixed(1)}% of {formatCurrency(yearlyGoals.revenue)} goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {projectProgress.toFixed(1)}% of {yearlyGoals.projects} goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Month Sales Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(bestRevenueMonth.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {bestRevenueMonth.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Month Qty Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestCountMonth.count}</div>
            <p className="text-xs text-muted-foreground">
              {bestCountMonth.name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Residential</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{residentialStats.count}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(residentialStats.total)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(residentialStats.average)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center">Barndominium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barndominiumStats.count}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(barndominiumStats.total)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(barndominiumStats.average)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commercial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commercialStats.count}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(commercialStats.total)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(commercialStats.average)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledStats.count}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(cancelledStats.total)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Lost revenue
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};