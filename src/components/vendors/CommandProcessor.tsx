import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Send, ArrowUpRight } from 'lucide-react';
import { useUpdateObjectStatus } from '@/integrations/supabase/hooks/useVendorMessages';
import { useVendorMessages } from '@/integrations/supabase/hooks/useVendorMessages';

interface CommandProcessorProps {
  vendorId?: string;
}

export const CommandProcessor: React.FC<CommandProcessorProps> = ({ vendorId }) => {
  const { data: messages = [], isLoading, refetch } = useVendorMessages(undefined, undefined, vendorId);
  const updateStatus = useUpdateObjectStatus();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [manualUpdate, setManualUpdate] = useState({
    objectType: '',
    objectId: '',
    status: '',
    extraFields: {}
  });

  // Filter messages with unprocessed commands
  const messagesWithCommands = messages.filter(
    (message: any) => 
      message.parsed_commands && 
      message.parsed_commands.length > 0 && 
      message.direction === 'inbound'
  );

  const handleManualStatusUpdate = async () => {
    if (!manualUpdate.objectType || !manualUpdate.objectId || !manualUpdate.status) {
      return;
    }

    await updateStatus.mutateAsync({
      objectType: manualUpdate.objectType,
      objectId: manualUpdate.objectId,
      status: manualUpdate.status,
      extraFields: manualUpdate.extraFields
    });

    setManualUpdate({
      objectType: '',
      objectId: '',
      status: '',
      extraFields: {}
    });
    refetch();
  };

  const getCommandIcon = (command: string) => {
    switch (command) {
      case 'ACK':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'QUOTE':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'DATE':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'YES':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'NO':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Send className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCommandDescription = (command: any) => {
    switch (command.command) {
      case 'ACK':
        return 'Vendor acknowledged receipt';
      case 'QUOTE':
        return `Quote provided: $${command.value}`;
      case 'DATE':
        return `Date confirmed: ${command.value}`;
      case 'YES':
        return 'Vendor confirmed';
      case 'NO':
        return 'Vendor declined';
      default:
        return `Command: ${command.command}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading command processor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Command Processor</h2>
          <p className="text-muted-foreground">Process vendor email commands and update statuses</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Manual Status Update */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Status Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Object Type</Label>
              <Select
                value={manualUpdate.objectType}
                onValueChange={(value) => setManualUpdate(prev => ({ ...prev, objectType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rfq">RFQ</SelectItem>
                  <SelectItem value="purchase_order">Purchase Order</SelectItem>
                  <SelectItem value="schedule_request">Schedule Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Object ID</Label>
              <Input
                value={manualUpdate.objectId}
                onChange={(e) => setManualUpdate(prev => ({ ...prev, objectId: e.target.value }))}
                placeholder="Enter object ID"
              />
            </div>
            <div>
              <Label>New Status</Label>
              <Select
                value={manualUpdate.status}
                onValueChange={(value) => setManualUpdate(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="Quoted">Quoted</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleManualStatusUpdate}
            disabled={updateStatus.isPending || !manualUpdate.objectType || !manualUpdate.objectId || !manualUpdate.status}
          >
            {updateStatus.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </CardContent>
      </Card>

      {/* Messages with Commands */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Commands from Vendors</h3>
        
        {messagesWithCommands.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending commands</h3>
              <p className="text-muted-foreground">
                All vendor email commands have been processed
              </p>
            </CardContent>
          </Card>
        ) : (
          messagesWithCommands.map((message: any) => (
            <Card key={message.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">
                      {message.object_type.toUpperCase()}
                    </Badge>
                    <div>
                      <CardTitle className="text-base">{message.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        From: {message.from_email} • {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMessage(message)}
                  >
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Object ID: {message.object_id}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {message.parsed_commands.map((cmd: any, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                        {getCommandIcon(cmd.command)}
                        <span className="text-sm font-medium">{getCommandDescription(cmd)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Command Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Object Type</Label>
                  <p>{selectedMessage.object_type.toUpperCase()}</p>
                </div>
                <div>
                  <Label>Object ID</Label>
                  <p className="font-mono text-sm">{selectedMessage.object_id}</p>
                </div>
              </div>
              
              <div>
                <Label>From</Label>
                <p>{selectedMessage.from_email}</p>
              </div>
              
              <div>
                <Label>Subject</Label>
                <p>{selectedMessage.subject}</p>
              </div>
              
              <div>
                <Label>Message Content</Label>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {selectedMessage.body_text || 'No content'}
                </div>
              </div>
              
              <div>
                <Label>Parsed Commands</Label>
                <div className="space-y-2">
                  {selectedMessage.parsed_commands.map((cmd: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center space-x-2">
                        {getCommandIcon(cmd.command)}
                        <span className="font-medium">{cmd.command}</span>
                        {cmd.value && <span className="text-muted-foreground">({cmd.value})</span>}
                      </div>
                      <Badge variant="outline">
                        {getCommandDescription(cmd)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};