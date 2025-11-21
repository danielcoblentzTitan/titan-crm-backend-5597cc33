import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Clock, Mail } from 'lucide-react';
import { useVendorMessages } from '@/integrations/supabase/hooks/useVendorMessages';
import { useRFQs, usePurchaseOrders, useScheduleRequests } from '@/integrations/supabase/hooks/useVendorWorkflows';

interface VendorDashboardProps {
  vendorId?: string;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ vendorId }) => {
  const { data: messages = [] } = useVendorMessages(undefined, undefined, vendorId);
  const { data: rfqs = [] } = useRFQs(vendorId);
  const { data: pos = [] } = usePurchaseOrders(vendorId);
  const { data: schedules = [] } = useScheduleRequests(vendorId);

  // Calculate metrics
  const totalValue = pos.reduce((sum, po) => sum + (po.total || 0), 0);
  const pendingRFQs = rfqs.filter(r => ['Sent', 'Acknowledged'].includes(r.status)).length;
  const activeSchedules = schedules.filter(s => ['Sent', 'Acknowledged', 'Confirmed'].includes(s.status)).length;
  const recentMessages = messages.filter(m => {
    const messageDate = new Date(m.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return messageDate >= sevenDaysAgo;
  });

  // Status distribution
  const getStatusCounts = (items: any[]) => {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const rfqStatusCounts = getStatusCounts(rfqs);
  const poStatusCounts = getStatusCounts(pos);
  const scheduleStatusCounts = getStatusCounts(schedules);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vendor Dashboard</h2>
        <p className="text-muted-foreground">Email-native vendor management system overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {pos.length} purchase orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending RFQs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRFQs}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting vendor response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSchedules}</div>
            <p className="text-xs text-muted-foreground">
              In coordination
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RFQ Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(rfqStatusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm">{status}</span>
                <Badge variant="outline">{count as number}</Badge>
              </div>
            ))}
            {Object.keys(rfqStatusCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">No RFQs yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchase Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(poStatusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm">{status}</span>
                <Badge variant="outline">{count as number}</Badge>
              </div>
            ))}
            {Object.keys(poStatusCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">No POs yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(scheduleStatusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm">{status}</span>
                <Badge variant="outline">{count as number}</Badge>
              </div>
            ))}
            {Object.keys(scheduleStatusCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">No schedule requests yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMessages.slice(0, 5).map((message: any) => (
              <div key={message.id} className="flex items-center space-x-3 p-3 rounded-md bg-muted">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {message.object_type.toUpperCase()}
                    </Badge>
                    <Badge variant={message.direction === 'inbound' ? 'default' : 'secondary'}>
                      {message.direction}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{message.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {message.direction === 'inbound' ? 'From' : 'To'}: {message.from_email || message.to_emails?.[0]}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
            
            {recentMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Email communications will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};