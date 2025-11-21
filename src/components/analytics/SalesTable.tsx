import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/services/supabaseService';

interface SalesTableProps {
  title: string;
  projects: Project[];
  type: 'residential' | 'barndominium' | 'commercial' | 'cancelled';
}

export const SalesTable = ({ title, projects, type }: SalesTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Planning': 'secondary',
      'In Progress': 'default',
      'Completed': 'default',
      'On Hold': 'secondary',
      'Cancelled': 'destructive'
    } as const;

    return (
      <Badge variant={statusMap[status as keyof typeof statusMap] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const totalRevenue = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const totalProfit = projects.reduce((sum, project) => sum + (project.estimated_profit || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </div>
            <div className="font-semibold">{formatCurrency(totalRevenue)}</div>
            {type !== 'cancelled' && (
              <div className="text-xs text-muted-foreground">
                Profit: {formatCurrency(totalProfit)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {type} projects found for this year
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  {type !== 'cancelled' && <TableHead>Sq Ft</TableHead>}
                  {projects.some(p => p.county) && <TableHead>County</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.customer_name}</TableCell>
                    <TableCell>{formatCurrency(project.budget || 0)}</TableCell>
                    <TableCell>{getStatusBadge(project.status || 'Planning')}</TableCell>
                    {type !== 'cancelled' && (
                      <TableCell>
                        {project.square_footage ? `${project.square_footage?.toLocaleString()} sq ft` : '-'}
                      </TableCell>
                    )}
                    {projects.some(p => p.county) && (
                      <TableCell>{project.county || '-'}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};