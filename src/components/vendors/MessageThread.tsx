import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Mail, Reply, ArrowRight, ArrowLeft, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useVendorMessagesByThread, useProcessVendorCommand } from '@/integrations/supabase/hooks/useVendorMessages';
import { EmailComposer } from './EmailComposer';

interface MessageThreadProps {
  vendor: any;
  objectType: string;
  objectId: string;
  object: any;
  project?: any;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ vendor, objectType, objectId, object, project }) => {
  const { data: messages = [], isLoading, refetch } = useVendorMessagesByThread(objectType, objectId);
  const processCommand = useProcessVendorCommand();
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);

  const handleProcessCommands = async (messageId: string, commands: any[]) => {
    if (commands.length > 0) {
      await processCommand.mutateAsync({
        messageId,
        objectType,
        objectId,
        commands
      });
      refetch(); // Refresh messages after processing
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'outbound' 
      ? 'border-l-4 border-l-blue-500' 
      : 'border-l-4 border-l-green-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Email Thread</h3>
        <Button size="sm" variant="outline" onClick={() => setIsEmailComposerOpen(true)}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((message: any) => (
          <Card key={message.id} className={`${getDirectionColor(message.direction)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {message.direction === 'outbound' ? (
                    <ArrowRight className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 text-green-500" />
                  )}
                  <span className="font-medium text-sm">
                    {message.direction === 'outbound' ? 'To' : 'From'}: {message.from_email || message.to_emails?.[0]}
                  </span>
                  <Badge variant={message.direction === 'outbound' ? 'default' : 'secondary'}>
                    {message.direction}
                  </Badge>
                  {message.direction === 'outbound' && (
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(message.status)}
                      <span className="text-xs text-muted-foreground">{message.status}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              <CardTitle className="text-base">{message.subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm whitespace-pre-wrap">
                {message.body_text || message.body_html?.replace(/<[^>]*>/g, '') || 'No message content'}
              </div>
              
              {message.parsed_commands && message.parsed_commands.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium">Parsed Commands:</span>
                      {message.parsed_commands.map((cmd: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cmd.command} {cmd.value && `(${cmd.value})`}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProcessCommands(message.id, message.parsed_commands)}
                      disabled={processCommand.isPending}
                      className="text-xs"
                    >
                      {processCommand.isPending ? 'Processing...' : 'Process Commands'}
                    </Button>
                  </div>
                </div>
              )}
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">Attachments:</span>
                    <Badge variant="outline" className="text-xs">
                      {message.attachments.length} file(s)
                    </Badge>
                  </div>
                </div>
              )}
              
              {message.delivered_at && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Delivered: {format(new Date(message.delivered_at), 'MMM d, yyyy h:mm a')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No messages yet</p>
          <p className="text-sm">Email communications will appear here</p>
        </div>
      )}

      <EmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        vendor={vendor}
        object={object}
        objectType={objectType as 'rfq' | 'purchase_order' | 'schedule_request'}
        project={project}
      />
    </div>
  );
};