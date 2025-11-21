import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Trash2, User, Lock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { usePunchlistComments, CreateCommentData } from '@/hooks/usePunchlistComments';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommentsThreadProps {
  itemId: string;
  isCustomerView?: boolean;
}

export function CommentsThread({ itemId, isCustomerView = false }: CommentsThreadProps) {
  const { comments, loading, addComment, deleteComment } = usePunchlistComments(itemId);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentData: CreateCommentData = {
        punchlist_item_id: itemId,
        comment_text: newComment.trim(),
        is_internal: isInternal,
        author_name: 'Current User', // This should be populated from user profile
      };
      
      await addComment(commentData);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  const visibleComments = isCustomerView 
    ? comments.filter(comment => !comment.is_internal)
    : comments;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Communication
          {comments.length > 0 && (
            <Badge variant="secondary">{comments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <ScrollArea className="h-64 w-full">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground py-4">
                Loading comments...
              </div>
            ) : visibleComments.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No comments yet. Start the conversation!
              </div>
            ) : (
              visibleComments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{comment.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      {comment.is_internal ? (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Internal
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Customer Visible
                        </Badge>
                      )}
                    </div>
                    {!isCustomerView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Add Comment Form */}
        {!isCustomerView && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="internal-comment"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal-comment" className="text-sm">
                  {isInternal ? 'Internal comment' : 'Customer visible'}
                </Label>
              </div>
              
              <Button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}