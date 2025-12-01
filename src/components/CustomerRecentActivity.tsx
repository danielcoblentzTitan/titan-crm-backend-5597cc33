import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  FileText, 
  MessageCircle, 
  DollarSign, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Upload,
  Edit,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'change_order' | 'message' | 'document' | 'schedule_update';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface CustomerRecentActivityProps {
  projectId: string;
}

export const CustomerRecentActivity = ({ projectId }: CustomerRecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 5;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: false });

  useEffect(() => {
    fetchRecentActivities();
    setupRealtimeSubscriptions();
  }, [projectId]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    setSelectedIndex(emblaApi.selectedScrollSnap());
    return () => {
      // @ts-ignore - embla types
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allActivities: ActivityItem[] = [];

      // Fetch change orders (notification only - no budget details)
      const { data: changeOrders } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', projectId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (changeOrders) {
        changeOrders.forEach(co => {
          const statusColor = co.status === 'Approved' ? 'text-green-600' : 
                            co.status === 'Rejected' ? 'text-red-600' : 'text-orange-600';
          
          allActivities.push({
            id: `co-${co.id}`,
            type: 'change_order',
            title: `Change Order ${co.status}`,
            description: co.title, // Only show title, no cost details
            timestamp: co.updated_at,
            icon: <Edit className="h-4 w-4" />,
            color: statusColor
          });
        });
      }

      // Fetch customer-facing messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_customer_facing', true)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (messages) {
        messages.forEach(msg => {
          const isFromCustomer = msg.sender_type === 'customer';
          allActivities.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: isFromCustomer ? 'You sent a message' : 'New message from builder',
            description: msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content,
            timestamp: msg.created_at,
            icon: <MessageCircle className="h-4 w-4" />,
            color: isFromCustomer ? 'text-blue-600' : 'text-purple-600'
          });
        });
      }

      // Fetch customer-facing documents
      const { data: documents } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('customer_facing', true)
        .gte('uploaded_at', thirtyDaysAgo.toISOString())
        .order('uploaded_at', { ascending: false });

      if (documents) {
        documents.forEach(doc => {
          allActivities.push({
            id: `doc-${doc.id}`,
            type: 'document',
            title: 'New document uploaded',
            description: doc.file_name,
            timestamp: doc.uploaded_at,
            icon: <Upload className="h-4 w-4" />,
            color: 'text-indigo-600'
          });
        });
      }

      // Fetch schedule update activities only
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'schedule_update')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (activities) {
        activities.forEach(activity => {
          allActivities.push({
            id: `activity-${activity.id}`,
            type: 'schedule_update',
            title: activity.title,
            description: activity.description,
            timestamp: activity.created_at,
            icon: <Calendar className="h-4 w-4" />,
            color: 'text-yellow-600'
          });
        });
      }

      // Sort all activities by timestamp
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Change orders subscription
    const changeOrdersChannel = supabase
      .channel('change_orders_activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'change_orders',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchRecentActivities();
        }
      )
      .subscribe();

    // Messages subscription
    const messagesChannel = supabase
      .channel('messages_activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchRecentActivities();
        }
      )
      .subscribe();

    // Documents subscription
    const documentsChannel = supabase
      .channel('documents_activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_documents',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchRecentActivities();
        }
      )
      .subscribe();

    // Activities subscription (for schedule updates only)
    const activitiesChannel = supabase
      .channel('activities_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchRecentActivities();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(changeOrdersChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  };

  const getActivityBadgeColor = (type: string) => {
    const colors = {
      'change_order': 'bg-orange-100 text-orange-800',
      'message': 'bg-blue-100 text-blue-800',
      'document': 'bg-indigo-100 text-indigo-800',
      'schedule_update': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const pages = React.useMemo(() => {
    const chunks: ActivityItem[][] = [];
    for (let i = 0; i < activities.length; i += ITEMS_PER_PAGE) {
      chunks.push(activities.slice(i, i + ITEMS_PER_PAGE));
    }
    return chunks;
  }, [activities]);

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading recent updates...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <div className="text-sm text-muted-foreground">No recent activity</div>
            <div className="text-xs text-muted-foreground mt-1">
              Updates from the last 30 days will appear here
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {pages.map((page, pageIndex) => (
                  <div key={pageIndex} className="min-w-full flex-shrink-0">
                    <div className="space-y-4">
                      {page.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{activity.title}</h4>
                              <Badge variant="outline" className={`text-xs ${getActivityBadgeColor(activity.type)}`}>
                                {activity.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pages.length > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  className="p-2 rounded-md border bg-background hover:bg-muted transition-colors"
                  aria-label="Previous updates"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  {pages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => emblaApi?.scrollTo(idx)}
                      className={idx === selectedIndex ? "h-2 w-6 rounded-full bg-primary" : "h-2 w-2 rounded-full bg-muted-foreground/30"}
                      aria-label={`Go to page ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  className="p-2 rounded-md border bg-background hover:bg-muted transition-colors"
                  aria-label="Next updates"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};