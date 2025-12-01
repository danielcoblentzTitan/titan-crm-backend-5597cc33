import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { usePunchlistAnalytics } from '@/hooks/usePunchlistAnalytics';

interface AnalyticsDashboardProps {
  projectId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AnalyticsDashboard({ projectId }: AnalyticsDashboardProps) {
  const { 
    loading, 
    getAnalyticsSummary, 
    getCompletionTrend, 
    getPriorityDistribution 
  } = usePunchlistAnalytics(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const summary = getAnalyticsSummary();
  const completionTrend = getCompletionTrend();
  const priorityDistribution = getPriorityDistribution();

  if (!summary) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No Analytics Data</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Analytics will appear once punchlist items are created
          </p>
        </CardContent>
      </Card>
    );
  }

  const { current, trends } = summary;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{current.completion_rate}%</p>
                <div className="flex items-center mt-1">
                  {trends.completion_rate >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${trends.completion_rate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(trends.completion_rate).toFixed(1)}%
                  </span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{current.total_items}</p>
                <div className="flex items-center mt-1">
                  {trends.total_items >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-blue-500 mr-1" />
                  )}
                  <span className="text-xs text-blue-500">
                    {trends.total_items >= 0 ? '+' : ''}{trends.total_items}
                  </span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{current.completed_items}</p>
                <Progress 
                  value={current.completion_rate} 
                  className="mt-2 h-2" 
                />
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-500">{current.overdue_items}</p>
                <div className="flex items-center mt-1">
                  {trends.overdue_items <= 0 ? (
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${trends.overdue_items <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trends.overdue_items >= 0 ? '+' : ''}{trends.overdue_items}
                  </span>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Completion Trend (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any, name: string) => [
                      name === 'completion_rate' ? `${value}%` : value,
                      name === 'completion_rate' ? 'Completion Rate' : 
                      name === 'total_items' ? 'Total Items' : 'Completed Items'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completion_rate" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priorityDistribution.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ priority, percentage }) => `${priority}: ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  {priorityDistribution.map((item, index) => (
                    <div key={item.priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.priority}</span>
                      </div>
                      <Badge variant="outline">{item.count} items</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-200 flex items-center justify-center text-muted-foreground">
                No priority data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(current.items_by_status || {}).map(([status, count]) => (
            <div key={status} className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${
                status === 'Completed' ? 'text-green-500' :
                status === 'In Progress' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {count as number}
              </div>
              <div className="text-sm text-muted-foreground">{status}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {current.total_items > 0 ? Math.round(((count as number) / current.total_items) * 100) : 0}%
              </div>
            </div>
          ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}