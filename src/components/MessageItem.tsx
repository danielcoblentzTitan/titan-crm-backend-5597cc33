import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Reply, User, Building2, Image as ImageIcon, Trash2, MoreHorizontal, Edit3 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Message, messageService } from "@/services/messageService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface MessageItemProps {
  message: Message;
  onReply: (messageId: string | null) => void;
  replyingTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSendReply: (parentId: string) => void;
  sending: boolean;
  currentUserType: 'builder' | 'customer';
  isCustomerPortal?: boolean;
  level?: number;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
}

export const MessageItem = ({
  message,
  onReply,
  replyingTo,
  replyContent,
  setReplyContent,
  onSendReply,
  sending,
  currentUserType,
  isCustomerPortal = false,
  level = 0,
  onDelete,
  onEdit
}: MessageItemProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (message.message_type === 'image' && message.file_path) {
      loadImage();
    }
  }, [message.file_path, message.message_type]);

  const loadImage = async () => {
    if (!message.file_path) return;
    
    setImageLoading(true);
    try {
      const url = await messageService.getImageUrl(message.file_path);
      setImageUrl(url);
    } catch (error) {
      console.error('Error loading image:', error);
    } finally {
      setImageLoading(false);
    }
  };

  const isOwnMessage = message.sender_type === currentUserType;
  const senderIcon = message.sender_type === 'builder' ? Building2 : User;
  const senderInitials = message.sender_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const canEdit = messageService.canEditMessage(message, user?.id);

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      await onEdit(message.id, editContent);
      setIsEditing(false);
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

  return (
    <div className={`${level > 0 ? 'ml-4 sm:ml-8 border-l-2 border-gray-200 pl-2 sm:pl-4' : ''}`}>
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 sm:mb-4`}>
        <div className={`max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-start space-x-2 sm:space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
              <AvatarFallback className={`text-[10px] sm:text-xs font-medium ${
                message.sender_type === 'builder' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {senderInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className={`flex-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
              {/* Sender info header */}
              <div className={`flex items-center space-x-1 sm:space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'} flex-wrap`}>
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {message.sender_name}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>

              {/* Message bubble */}
              <div className={`inline-block p-2 sm:p-3 rounded-lg max-w-full ${
                isOwnMessage 
                  ? message.sender_type === 'builder'
                    ? 'bg-blue-500 text-white' 
                    : 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}>
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px] text-xs sm:text-sm"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleEdit} disabled={!editContent.trim()}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsEditing(false);
                        setEditContent(message.content);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm leading-relaxed">{message.content}</div>
                )}
                
                {message.message_type === 'image' && (
                  <div className="mt-1 sm:mt-2">
                    {imageLoading ? (
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-[10px] sm:text-xs">Loading...</span>
                      </div>
                    ) : imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={message.file_name || "Shared image"}
                        className="max-w-full max-h-32 sm:max-h-64 rounded cursor-pointer"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 text-[10px] sm:text-xs opacity-75">
                        <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Image unavailable</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Message actions */}
              <div className={`flex items-center space-x-2 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} flex-wrap`}>
                {!isCustomerPortal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                    onClick={() => onReply(replyingTo === message.id ? null : message.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
                
                {/* Message options */}
                {user?.id === message.sender_id && !isCustomerPortal && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit message
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this message?')) {
                            onDelete(message.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Internal/Customer badge for builder view */}
                {!isCustomerPortal && (
                  <Badge 
                    variant={message.is_customer_facing ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {message.is_customer_facing ? "Customer" : "Internal"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {replyingTo === message.id && (
        <div className="mt-2 mb-4 ml-11">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="flex-1 min-h-[60px] resize-none"
            />
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => onSendReply(message.id)}
                disabled={!replyContent.trim() || sending}
                size="sm"
              >
                Send
              </Button>
              <Button
                variant="outline"
                onClick={() => onReply(null)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {message.replies && message.replies.length > 0 && (
        <div className="mt-2">
          {message.replies.map((reply) => (
            <MessageItem
              key={reply.id}
              message={reply}
              onReply={onReply}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSendReply={onSendReply}
              sending={sending}
              currentUserType={currentUserType}
              isCustomerPortal={isCustomerPortal}
              level={level + 1}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};