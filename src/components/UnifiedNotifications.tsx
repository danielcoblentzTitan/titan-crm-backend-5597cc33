
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, MessageCircle, Users, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  type: 'lead_assignment' | 'message' | 'photo_upload';
  title: string;
  message: string;
  project_id?: string;
  project_name?: string;
  read_at?: string;
  created_at: string;
}

interface UnifiedNotificationsProps {
  compact?: boolean;
}

export const UnifiedNotifications = ({ compact = false }: UnifiedNotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Subscribe to real-time message notifications
      const messageChannel = supabase
        .channel(`message-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('Real-time message received:', payload);
            handleNewMessage(payload.new as any);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Get read states from localStorage
      const readStates = JSON.parse(localStorage.getItem('notification_read_states') || '{}');
      
      // Get lead notifications
      const { data: leadNotifs, error: leadError } = await supabase
        .from('lead_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (leadError) throw leadError;

      // Get latest message from each customer (up to 3 different customers)
      const { data: messages, error: messageError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_name,
          sender_type,
          project_id,
          is_customer_facing,
          created_at,
          projects!inner(name, customer_id)
        `)
        .eq('sender_type', 'customer')
        .eq('is_customer_facing', true)
        .order('created_at', { ascending: false })
        .limit(50); // Get more messages to filter properly

      if (messageError) throw messageError;

      // Filter to get latest message from each customer (up to 3 customers)
      const latestMessagesPerCustomer = new Map();
      if (messages) {
        messages.forEach(msg => {
          const customerId = (msg.projects as any)?.customer_id;
          if (customerId && !latestMessagesPerCustomer.has(customerId)) {
            latestMessagesPerCustomer.set(customerId, msg);
          }
        });
      }
      
      // Get up to 3 latest messages from different customers
      const filteredMessages = Array.from(latestMessagesPerCustomer.values()).slice(0, 3);

      // Combine and format notifications
      const allNotifications: Notification[] = [
        ...(leadNotifs || []).map(notif => ({
          id: notif.id,
          type: 'lead_assignment' as const,
          title: 'New Lead Assignment',
          message: notif.message,
          read_at: notif.read_at,
          created_at: notif.created_at
        })),
        ...filteredMessages.map(msg => {
          const messageId = `message-${msg.id}`;
          return {
            id: messageId,
            type: 'message' as const,
            title: `New message from ${msg.sender_name}`,
            message: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
            project_id: msg.project_id,
            project_name: (msg.projects as any)?.name,
            read_at: readStates[messageId] || undefined, // Use localStorage read state
            created_at: msg.created_at
          };
        })
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = async (message: any) => {
    console.log('New message received in notifications:', message);
    console.log('Current user ID:', user?.id);
    console.log('Message sender ID:', message.sender_id);
    console.log('Is customer facing:', message.is_customer_facing);
    
    // Only notify if this is a customer-facing message and user is not the sender
    if (message.is_customer_facing && message.sender_id !== user?.id) {
      console.log('Processing notification for message:', message);
      
      // Get project info
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', message.project_id)
        .single();

      const newNotification: Notification = {
        id: `message-${message.id}`,
        type: 'message',
        title: `New message from ${message.sender_name}`,
        message: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
        project_id: message.project_id,
        project_name: project?.name,
        read_at: undefined, // Start as unread
        created_at: message.created_at
      };

      console.log('Adding notification:', newNotification);
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        console.log('Updated notifications list:', updated);
        return updated;
      });

      // Show toast notification
      toast({
        title: newNotification.title,
        description: `${newNotification.project_name}: ${newNotification.message}`,
      });
      console.log('Toast notification shown');
    } else {
      console.log('Skipping notification - not customer facing or same sender');
    }
  };

  const markAsRead = async (notificationId: string) => {
    console.log('markAsRead called with ID:', notificationId);
    try {
      if (notificationId.startsWith('message-')) {
        console.log('Marking message notification as read');
        
        // Save to localStorage for persistence
        const readStates = JSON.parse(localStorage.getItem('notification_read_states') || '{}');
        readStates[notificationId] = new Date().toISOString();
        localStorage.setItem('notification_read_states', JSON.stringify(readStates));
        
        // Update local state
        setNotifications(prev => {
          const updated = prev.map(n => 
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          );
          console.log('Updated notifications:', updated);
          return updated;
        });
      } else {
        console.log('Marking lead notification as read');
        // For lead notifications, mark as read in database
        await supabase
          .from('lead_notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId);
        
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('handleNotificationClick called with:', notification);
    if (notification.type === 'message' && notification.project_id) {
      console.log('Navigating to project and marking as read');
      // Mark as read when clicked
      markAsRead(notification.id);
      // Navigate to the project message board with messages tab selected
      navigate(`/project/${notification.project_id}?tab=messages`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'lead_assignment':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-green-100 text-green-800';
      case 'lead_assignment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
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
        {notifications.filter(n => !n.read_at).length === 0 ? (
          <p className="text-sm text-gray-500">No new notifications</p>
        ) : (
          <div className="space-y-2">
            {notifications.filter(n => !n.read_at).slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-2 border rounded-md cursor-pointer transition-colors text-sm ${
                  notification.read_at ? 'bg-muted/50 hover:bg-muted' : 'bg-background border-primary/20 hover:bg-primary/5'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">
                        {notification.type === 'message' ? 'New Message' : 'New Lead'} 
                        {notification.type === 'message' && notification.title.includes('from ') 
                          ? ` - ${notification.title.split('from ')[1]}` 
                          : ''
                        }
                      </span>
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    {notification.project_name && (
                      <p className="text-xs text-muted-foreground mt-1">Project: {notification.project_name}</p>
                    )}
                  </div>
                  {!notification.read_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
