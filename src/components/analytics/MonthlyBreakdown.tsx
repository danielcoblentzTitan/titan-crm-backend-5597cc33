import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import type { Project } from '@/services/supabaseService';

interface MonthlyBreakdownProps {
  projects: Project[];
  year: string;
}

export const MonthlyBreakdown = ({ projects, year }: MonthlyBreakdownProps) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const chartData = monthNames.map((month, index) => {
    const monthProjects = projects.filter(project => {
      const projectDate = new Date(project.start_date);
      return projectDate.getMonth() === index && !project.is_cancelled && project.status !== 'Cancelled';
    });

    const residential = monthProjects.filter(p => p.building_type === 'Residential');
    const barndominium = monthProjects.filter(p => p.building_type === 'Barndominium');
    const commercial = monthProjects.filter(p => p.building_type === 'Commercial');

    return {
      month,
      residential: residential.reduce((sum, p) => sum + (p.budget || 0), 0),
      barndominium: barndominium.reduce((sum, p) => sum + (p.budget || 0), 0),
      commercial: commercial.reduce((sum, p) => sum + (p.budget || 0), 0),
      residentialCount: residential.length,
      barndominiumCount: barndominium.length,
      commercialCount: commercial.length,
    };
  });

  const chartConfig = {
    residential: {
      label: 'Residential',
      color: 'hsl(var(--blue-600))',
    },
    barndominium: {
      label: 'Barndominium',
      color: 'hsl(var(--amber-600))',
    },
    commercial: {
      label: 'Commercial',
      color: 'hsl(var(--green-600))',
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Breakdown - {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar 
                  dataKey="residential" 
                  name="Residential" 
                  fill="#2563eb" 
                  stackId="sales"
                />
                <Bar 
                  dataKey="barndominium" 
                  name="Barndominium" 
                  fill="#d97706" 
                  stackId="sales"
                />
                <Bar 
                  dataKey="commercial" 
                  name="Commercial" 
                  fill="#059669" 
                  stackId="sales"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Projects Count - {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <ChartTooltip 
                  content={<ChartTooltipContent />} 
                  formatter={(value: number) => [`${value} projects`, '']}
                />
                <Legend />
                <Bar 
                  dataKey="residentialCount" 
                  name="Residential" 
                  fill="#2563eb" 
                  stackId="count"
                />
                <Bar 
                  dataKey="barndominiumCount" 
                  name="Barndominium" 
                  fill="#d97706" 
                  stackId="count"
                />
                <Bar 
                  dataKey="commercialCount" 
                  name="Commercial" 
                  fill="#059669" 
                  stackId="count"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};