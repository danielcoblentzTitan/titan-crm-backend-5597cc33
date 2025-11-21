import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageCircle, Send, Image, Reply, User, Building2, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { messageService, Message } from "@/services/messageService";
import { MessageItem } from "./MessageItem";
import { supabase } from "@/integrations/supabase/client";
import EmojiPicker from 'emoji-picker-react';

interface ProjectMessageBoardProps {
  projectId: string;
  projectName: string;
  isCustomerPortal?: boolean;
  currentUserName: string;
  currentUserType: 'builder' | 'customer';
}

export const ProjectMessageBoard = ({ 
  projectId, 
  projectName, 
  isCustomerPortal = false,
  currentUserName,
  currentUserType
}: ProjectMessageBoardProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isCustomerFacing, setIsCustomerFacing] = useState(isCustomerPortal);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time updates
    const channel = messageService.subscribeToMessages(projectId, (newMessage) => {
      // Only show messages that match the current view
      if (isCustomerPortal && !newMessage.is_customer_facing) return;
      
      setMessages(prev => {
        // Handle message updates
        if ((newMessage as any).updated) {
          return updateMessageInList(prev, newMessage.id, newMessage.content);
        }
        
        // Handle message deletion
        if ((newMessage as any).deleted) {
          return removeMessageFromList(prev, newMessage.id);
        }
        
        // Check if this is a reply
        if (newMessage.parent_message_id) {
          return addReplyToMessages(prev, newMessage);
        } else {
          // Add as new root message
          return [...prev, newMessage];
        }
      });
      scrollToBottom();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [projectId, isCustomerPortal]);

  const addReplyToMessages = (messages: Message[], reply: Message): Message[] => {
    return messages.map(msg => {
      if (msg.id === reply.parent_message_id) {
        return {
          ...msg,
          replies: [...(msg.replies || []), reply]
        };
      }
      if (msg.replies) {
        return {
          ...msg,
          replies: addReplyToMessages(msg.replies, reply)
        };
      }
      return msg;
    });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getProjectMessages(
        projectId, 
        isCustomerPortal ? true : undefined
      );
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    setSending(true);
    try {
      let filePath, fileName;
      let messageType: 'text' | 'image' = 'text';
      let content = newMessage;

      if (selectedImage) {
        messageType = 'image';
        filePath = await messageService.uploadMessageImage(selectedImage, projectId);
        fileName = selectedImage.name;
        if (!content.trim()) {
          content = `Shared an image: ${fileName}`;
        }
      }

      await messageService.sendMessage(
        projectId,
        content,
        currentUserName,
        currentUserType,
        isCustomerFacing,
        undefined,
        messageType,
        filePath,
        fileName
      );

      setNewMessage("");
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setSending(true);
    try {
      await messageService.sendMessage(
        projectId,
        replyContent,
        currentUserName,
        currentUserType,
        isCustomerFacing,
        parentId
      );

      setReplyContent("");
      setReplyingTo(null);

      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully"
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await messageService.editMessage(messageId, newContent);
      
      // Update message in local state
      setMessages(prev => updateMessageInList(prev, messageId, newContent));
      
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully"
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId);
      
      // Remove message from local state
      setMessages(prev => removeMessageFromList(prev, messageId));
      
      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const updateMessageInList = (messages: Message[], messageId: string, newContent: string): Message[] => {
    return messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, content: newContent, updated_at: new Date().toISOString() };
      }
      if (msg.replies) {
        return { ...msg, replies: updateMessageInList(msg.replies, messageId, newContent) };
      }
      return msg;
    });
  };

  const removeMessageFromList = (messages: Message[], messageId: string): Message[] => {
    return messages.filter(msg => {
      if (msg.id === messageId) return false;
      if (msg.replies) {
        msg.replies = removeMessageFromList(msg.replies, messageId);
      }
      return true;
    });
  };

  const handleEmojiSelect = (emojiData: any) => {
    console.log('Emoji selected:', emojiData);
    // Handle both old and new emoji picker formats
    const emoji = emojiData.emoji || emojiData.native || emojiData;
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedImage(file);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div>Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] sm:h-[600px] flex flex-col bg-white rounded-lg border">
      <div className="flex-shrink-0 border-b bg-gray-50 p-2 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
            <span className="font-semibold text-sm sm:text-base">Messages</span>
            {!isCustomerPortal && (
              <span className="text-xs text-gray-500 ml-2 bg-white px-1.5 py-0.5 rounded">
                {messages.length}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8 sm:py-12">
            <MessageCircle className="h-10 w-10 sm:h-16 sm:w-16 mx-auto mb-2 sm:mb-4 text-gray-300" />
            <p className="text-sm sm:text-lg font-medium mb-1 sm:mb-2">No messages yet</p>
            <p className="text-xs sm:text-sm">Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onReply={setReplyingTo}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSendReply={handleSendReply}
              sending={sending}
              currentUserType={currentUserType}
              isCustomerPortal={isCustomerPortal}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-2 sm:p-4 border-t bg-gray-50">
        {selectedImage && (
          <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded">
                <Image className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium">{selectedImage.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="text-gray-500 hover:text-gray-700 h-6 w-6 p-0 sm:h-8 sm:w-8"
            >
              ×
            </Button>
          </div>
        )}
        
        {/* Mobile Layout: Input full width, buttons below */}
        <div className="block sm:hidden">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full min-h-[60px] resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 mb-3"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Attachment and emoji buttons */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 p-0"
                title="Attach image"
              >
                <Image className="h-4 w-4" />
              </Button>
              
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Add emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    width={280}
                    height={350}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Customer visibility toggle and send button */}
              {!isCustomerPortal && (
                <div className="flex items-center space-x-1">
                  <Label htmlFor="customer-facing-send-mobile" className="text-xs text-gray-600 whitespace-nowrap">
                    Customer sees
                  </Label>
                  <Switch
                    id="customer-facing-send-mobile"
                    checked={isCustomerFacing}
                    onCheckedChange={setIsCustomerFacing}
                    className="scale-75"
                  />
                </div>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedImage) || sending}
                size="sm"
                className="h-8 w-16 bg-blue-600 hover:bg-blue-700 text-xs"
                title="Send message"
              >
                <Send className="h-3 w-3 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout: Horizontal */}
        <div className="hidden sm:flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[50px] resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Attachment and emoji buttons */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
              title="Attach image"
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width={280}
                  height={350}
                />
              </PopoverContent>
            </Popover>
            
            {/* Customer visibility toggle and send button */}
            {!isCustomerPortal && (
              <div className="flex items-center space-x-1 ml-1">
                <Label htmlFor="customer-facing-send" className="text-xs text-gray-600 whitespace-nowrap">
                  Customer sees
                </Label>
                <Switch
                  id="customer-facing-send"
                  checked={isCustomerFacing}
                  onCheckedChange={setIsCustomerFacing}
                />
              </div>
            )}
            
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedImage) || sending}
              size="sm"
              className="h-10 w-10 bg-blue-600 hover:bg-blue-700 p-0"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};