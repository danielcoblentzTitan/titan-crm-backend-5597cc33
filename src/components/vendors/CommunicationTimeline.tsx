import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowUp, 
  ArrowDown,
  Command,
  FileText,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface CommunicationTimelineProps {
  messages: any[];
  rfqs: any[];
  pos: any[];
  schedules: any[];
}

interface TimelineItem {
  id: string;
  type: 'message' | 'rfq' | 'po' | 'schedule';
  date: string;
  title: string;
  description: string;
  direction?: 'inbound' | 'outbound';
  status?: string;
  commands?: any[];
  data: any;
}

export const CommunicationTimeline: React.FC<CommunicationTimelineProps> = ({
  messages,
  rfqs,
  pos,
  schedules
}) => {
  // Combine all activities into timeline items
  const timelineItems: TimelineItem[] = [
    ...messages.map(msg => ({
      id: `msg-${msg.id}`,
      type: 'message' as const,
      date: msg.created_at,
      title: msg.subject || 'Email Communication',
      description: msg.direction === 'inbound' 
        ? `From: ${msg.from_email}` 
        : `To: ${msg.to_emails?.join(', ')}`,
      direction: msg.direction,
      commands: msg.parsed_commands,
      data: msg
    })),
    ...rfqs.map(rfq => ({
      id: `rfq-${rfq.id}`,
      type: 'rfq' as const,
      date: rfq.created_at,
      title: rfq.subject || 'RFQ Request',
      description: `Status: ${rfq.status}`,
      status: rfq.status,
      data: rfq
    })),
    ...pos.map(po => ({
      id: `po-${po.id}`,
      type: 'po' as const,
      date: po.created_at,
      title: po.subject || 'Purchase Order',
      description: `$${po.total?.toLocaleString()} - ${po.status}`,
      status: po.status,
      data: po
    })),
    ...schedules.map(schedule => ({
      id: `schedule-${schedule.id}`,
      type: 'schedule' as const,
      date: schedule.created_at,
      title: schedule.subject || 'Schedule Request',
      description: `Status: ${schedule.status}`,
      status: schedule.status,
      data: schedule
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTimelineIcon = (item: TimelineItem) => {
    switch (item.type) {
      case 'message':
        return item.direction === 'inbound' ? 
          <ArrowDown className="h-4 w-4 text-blue-500" /> :
          <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'rfq':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'po':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'schedule':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'active':
        return 'default';
      case 'acknowledged':
      case 'quoted':
        return 'secondary';
      case 'accepted':
      case 'confirmed':
      case 'completed':
        return 'default';
      case 'rejected':
      case 'declined':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Communication Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timelineItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No communication history</p>
            <p className="text-sm">Activities will appear here as they occur</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {timelineItems.map((item, index) => (
              <div key={item.id} className="flex space-x-3">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {getTimelineIcon(item)}
                  </div>
                  {index < timelineItems.length - 1 && (
                    <div className="w-px h-8 bg-border mt-2"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.type === 'message' && item.direction && (
                          <Badge 
                            variant={item.direction === 'inbound' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.direction}
                          </Badge>
                        )}
                        {item.status && (
                          <Badge 
                            variant={getStatusColor(item.status)}
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        )}
                        {item.commands && item.commands.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Command className="h-3 w-3 mr-1" />
                            Commands
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      
                      {/* Show command details if available */}
                      {item.commands && item.commands.length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          Commands: {item.commands.map(cmd => cmd.command).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};