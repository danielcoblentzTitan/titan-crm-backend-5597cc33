import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  MessageCircle, 
  Phone, 
  Video, 
  Paperclip, 
  Users,
  Clock,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  sender_type: 'customer' | 'builder' | 'team_member';
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  reply_to_id?: string;
  attachments: any[];
  read_by: string[];
  is_priority: boolean;
  created_at: string;
  sender_name?: string;
}

interface RealtimeChatProps {
  projectId: string;
  customerName: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const RealtimeChat = ({ 
  projectId, 
  customerName, 
  isMinimized = false,
  onToggleMinimize 
}: RealtimeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [builderTyping, setBuilderTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();
    
    return () => {
      supabase.removeAllChannels();
    };
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender names for builder messages
      const messagesWithNames = await Promise.all((data || []).map(async (message) => {
        let senderName = customerName; // Default for customer messages
        
        if (message.sender_type !== 'customer') {
          // Fetch builder's name from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', message.sender_id)
            .single();
          
          senderName = profile?.full_name || 'Builder';
        }

        return {
          ...message,
          sender_type: message.sender_type as 'customer' | 'builder' | 'team_member',
          message_type: message.message_type as 'text' | 'image' | 'file' | 'system',
          attachments: Array.isArray(message.attachments) ? message.attachments : [],
          read_by: Array.isArray(message.read_by) ? message.read_by.map(id => String(id)) : [],
          sender_name: senderName
        } as ChatMessage;
      }));

      setMessages(messagesWithNames);
      
      // Mark messages as read
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await markMessagesAsRead(user.data.user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Fetch sender profile for real-time messages
          if (newMessage.sender_type !== 'customer') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMessage.sender_id)
              .single();
            
            newMessage.sender_name = profile?.full_name || 'Builder';
          } else {
            newMessage.sender_name = customerName;
          }
          
          setMessages(prev => [...prev, newMessage]);
          
          // Show notification for messages from builder
          if (newMessage.sender_type !== 'customer') {
            setUnreadCount(prev => prev + 1);
            toast({
              title: 'New Message',
              description: `Message from ${newMessage.sender_name}: ${newMessage.message_text.substring(0, 50)}...`
            });
          }
        }
      )
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const presenceState = channel.presenceState();
          const builderOnline = Object.values(presenceState).some((presence: any) => 
            presence?.[0]?.user_type === 'builder'
          );
          setIsOnline(builderOnline);
        }
      )
      .subscribe();

    // Track user presence
    const user = supabase.auth.getUser();
    user.then(({ data }) => {
      if (data.user) {
        channel.track({
          user_id: data.user.id,
          user_type: 'customer',
          user_name: customerName,
          online_at: new Date().toISOString()
        });
      }
    });
  };

  const markMessagesAsRead = async (userId: string) => {
    try {
      const unreadMessages = messages.filter(msg => 
        msg.sender_type !== 'customer' && !msg.read_by.includes(userId)
      );

      for (const message of unreadMessages) {
        await supabase
          .from('chat_messages')
          .update({
            read_by: [...message.read_by, userId]
          })
          .eq('id', message.id);
      }

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const messageData = {
        project_id: projectId,
        sender_id: user.data.user.id,
        sender_type: 'customer' as const,
        message_text: newMessage.trim(),
        message_type: 'text' as const,
        is_priority: false,
        read_by: [user.data.user.id]
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const getSenderInitials = (senderType: string, senderName?: string) => {
    if (senderType === 'customer') return customerName.charAt(0).toUpperCase();
    if (senderName) return senderName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    return 'TB'; // Titan Buildings
  };

  if (isMinimized) {
    return (
      <Button
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
        size="sm"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </div>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-xl z-50 flex flex-col">
      <CardHeader className="flex-shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <MessageCircle className="h-4 w-4" />
            <span>Chat with Builder</span>
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-success' : 'bg-muted'}`} />
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Phone className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Video className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={onToggleMinimize}
            >
              ×
            </Button>
          </div>
        </div>
        
        {isOnline && (
          <div className="flex items-center space-x-1 text-xs text-success">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span>Builder is online</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex space-x-2 max-w-[80%] ${
                    message.sender_type === 'customer' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getSenderInitials(message.sender_type, message.sender_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      message.sender_type === 'customer'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p>{message.message_text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {getMessageTime(message.created_at)}
                      </span>
                      {message.sender_type === 'customer' && (
                        <CheckCheck className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {builderTyping && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex space-x-1">
                <div className="h-1 w-1 bg-current rounded-full animate-bounce" />
                <div className="h-1 w-1 bg-current rounded-full animate-bounce delay-100" />
                <div className="h-1 w-1 bg-current rounded-full animate-bounce delay-200" />
              </div>
              <span>Builder is typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 border-t">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 h-8 text-sm"
            />
            <Button 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};