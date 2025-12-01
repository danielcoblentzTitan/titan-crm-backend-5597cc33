
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Plus, User, Building } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Customer, TeamMember } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_type: 'internal' | 'external';
  sender_id: string;
  sender_name: string;
  recipient_type: 'internal' | 'external';
  recipient_id: string;
  recipient_name: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
}

const MessagingSystem = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { toast } = useToast();

  const [composeForm, setComposeForm] = useState({
    recipient_type: 'internal' as 'internal' | 'external',
    recipient_id: '',
    subject: '',
    content: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersData, teamData] = await Promise.all([
        supabaseService.getCustomers(),
        supabaseService.getTeamMembers()
      ]);
      setCustomers(customersData);
      setTeamMembers(teamData);
      // Load messages would go here when we have the table
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load messaging data.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    try {
      const recipientName = composeForm.recipient_type === 'internal' 
        ? teamMembers.find(t => t.id === composeForm.recipient_id)?.name || 'Unknown'
        : customers.find(c => c.id === composeForm.recipient_id)?.name || 'Unknown';

      const messageData = {
        ...composeForm,
        sender_type: 'internal' as const,
        sender_id: 'current-user-id', // Would get from auth context
        sender_name: 'Current User', // Would get from auth context
        recipient_name: recipientName,
        read: false
      };

      // Here we would save to messages table
      console.log('Would send message:', messageData);
      
      toast({
        title: "Message Sent",
        description: `Message sent to ${recipientName}`,
      });
      
      setIsComposeOpen(false);
      setComposeForm({
        recipient_type: 'internal',
        recipient_id: '',
        subject: '',
        content: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const recipients = composeForm.recipient_type === 'internal' ? teamMembers : customers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <MessageSquare className="h-6 w-6 mr-2" />
          Messages
        </h2>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#003562] hover:bg-[#003562]/90">
              <Plus className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Message Type</label>
                  <Select
                    value={composeForm.recipient_type}
                    onValueChange={(value: 'internal' | 'external') => 
                      setComposeForm({ ...composeForm, recipient_type: value, recipient_id: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal (Team)</SelectItem>
                      <SelectItem value="external">External (Customer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Recipient</label>
                  <Select
                    value={composeForm.recipient_id}
                    onValueChange={(value) => setComposeForm({ ...composeForm, recipient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          {recipient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Message subject"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  placeholder="Type your message here..."
                  rows={6}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} className="bg-[#003562] hover:bg-[#003562]/90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet. Start a conversation!</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className={`cursor-pointer transition-colors hover:bg-gray-50 ${!message.read ? 'border-[#003562]' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {message.sender_type === 'internal' ? (
                      <User className="h-4 w-4 text-[#003562]" />
                    ) : (
                      <Building className="h-4 w-4 text-green-600" />
                    )}
                    <div>
                      <CardTitle className="text-base">{message.subject}</CardTitle>
                      <p className="text-sm text-gray-600">
                        From: {message.sender_name} | To: {message.recipient_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!message.read && <Badge variant="secondary">New</Badge>}
                    <Badge variant={message.sender_type === 'internal' ? 'default' : 'outline'}>
                      {message.sender_type === 'internal' ? 'Internal' : 'Customer'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;
