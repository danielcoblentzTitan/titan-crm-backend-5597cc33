import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useVendors } from '@/integrations/supabase/hooks/useVendors';
import { useVendorMessages } from '@/integrations/supabase/hooks/useVendorMessages';

export const PerformanceDashboard: React.FC = () => {
  const { data: vendors = [] } = useVendors();
  const { data: allMessages = [] } = useVendorMessages();

  // Calculate vendor status distribution
  const statusDistribution = vendors.reduce((acc, vendor) => {
    acc[vendor.status] = (acc[vendor.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status,
    value: count,
    color: {
      'Active': '#22c55e',
      'Probation': '#f59e0b',
      'Inactive': '#6b7280',
      'Blacklisted': '#ef4444'
    }[status] || '#6b7280'
  }));

  // Calculate trade distribution
  const tradeDistribution = vendors.reduce((acc, vendor) => {
    const trade = vendor.trade || 'Unspecified';
    acc[trade] = (acc[trade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tradeData = Object.entries(tradeDistribution)
    .map(([trade, count]) => ({ trade, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 trades

  // Calculate message volume over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const messageVolumeData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayMessages = allMessages.filter(msg => 
      msg.created_at.split('T')[0] === dateStr
    );
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      inbound: dayMessages.filter(m => m.direction === 'inbound').length,
      outbound: dayMessages.filter(m => m.direction === 'outbound').length,
      total: dayMessages.length
    };
  });

  // Calculate top performing vendors
  const vendorPerformance = vendors.map(vendor => {
    const vendorMessages = allMessages.filter(m => m.vendor_id === vendor.id);
    const responseMessages = vendorMessages.filter(m => 
      m.direction === 'inbound' && m.parsed_commands?.length > 0
    );
    
    return {
      name: vendor.name,
      trade: vendor.trade,
      status: vendor.status,
      rating: vendor.rating,
      messageCount: vendorMessages.length,
      responseRate: vendorMessages.length > 0 ? 
        (responseMessages.length / vendorMessages.length * 100) : 0
    };
  }).sort((a, b) => b.responseRate - a.responseRate).slice(0, 10);

  // Key metrics
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === 'Active').length;
  const averageRating = vendors.length > 0 ? 
    vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length : 0;
  const totalMessages = allMessages.length;
  const recentMessages = allMessages.filter(m => {
    const messageDate = new Date(m.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return messageDate >= sevenDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Build Partners Performance Dashboard</h2>
        <p className="text-muted-foreground">Comprehensive analytics and insights</p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendors}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {activeVendors} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Overall satisfaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {recentMessages} in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVendors > 0 ? Math.round((activeVendors / totalVendors) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Active partners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tradeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="trade" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Message Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Volume (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="inbound" 
                stroke="#22c55e" 
                name="Inbound"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="outbound" 
                stroke="#3b82f6" 
                name="Outbound"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vendorPerformance.slice(0, 5).map((vendor, index) => (
              <div key={vendor.name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{vendor.name}</span>
                      {vendor.trade && (
                        <Badge variant="outline">{vendor.trade}</Badge>
                      )}
                      <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'}>
                        {vendor.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vendor.messageCount} messages • {vendor.rating}/5 rating
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {vendor.responseRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Response Rate</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};