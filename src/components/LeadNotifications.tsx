
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseService, LeadNotification } from "@/services/supabaseService";
import { useAuth } from "@/contexts/AuthContext";

interface LeadNotificationsProps {
  teamMemberId?: string;
  compact?: boolean;
}

const LeadNotifications = ({ teamMemberId, compact = false }: LeadNotificationsProps) => {
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription for notifications
    const channel = supabaseService.supabase
      .channel('lead-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_notifications',
          filter: teamMemberId ? `team_member_id=eq.${teamMemberId}` : undefined
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabaseService.supabase.removeChannel(channel);
    };
  }, [teamMemberId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        supabaseService.getLeadNotifications(teamMemberId),
        teamMemberId ? supabaseService.getUnreadNotificationCount(teamMemberId) : Promise.resolve(0)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabaseService.markNotificationAsRead(notificationId);
      await loadNotifications();
      toast({
        title: "Notification marked as read",
        description: "Notification has been marked as read.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={compact ? "w-full" : ""}>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Bell className="h-4 w-4" />
        <span className="text-sm">
          {unreadCount > 0 ? `${unreadCount} new` : 'No new notifications'}
        </span>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {unreadCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications yet.</p>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.read_at ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <div className="mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getNotificationColor(notification.notification_type)}>
                          {notification.notification_type}
                        </Badge>
                        {!notification.read_at && (
                          <Badge variant="destructive" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {!notification.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {notifications.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                And {notifications.length - 5} more notifications...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadNotifications;
