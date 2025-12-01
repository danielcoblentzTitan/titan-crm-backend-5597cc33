import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PunchlistComment {
  id: string;
  punchlist_item_id: string;
  author_id: string;
  author_name: string;
  comment_text: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  punchlist_item_id: string;
  comment_text: string;
  is_internal: boolean;
  author_name: string;
}

export function usePunchlistComments(itemId: string) {
  const [comments, setComments] = useState<PunchlistComment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchComments = async () => {
    if (!itemId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('punchlist_comments')
        .select('*')
        .eq('punchlist_item_id', itemId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (commentData: CreateCommentData) => {
    try {
      const { data, error } = await supabase
        .from('punchlist_comments')
        .insert({
          ...commentData,
          author_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setComments(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Comment added",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('punchlist_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast({
        title: "Success",
        description: "Comment deleted",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Real-time subscription for comments
  useEffect(() => {
    if (!itemId) return;

    const channel = supabase
      .channel('punchlist-comments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'punchlist_comments',
          filter: `punchlist_item_id=eq.${itemId}`,
        },
        (payload) => {
          const newComment = payload.new as PunchlistComment;
          setComments(prev => [...prev, newComment]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'punchlist_comments',
          filter: `punchlist_item_id=eq.${itemId}`,
        },
        (payload) => {
          const deletedComment = payload.old as PunchlistComment;
          setComments(prev => prev.filter(comment => comment.id !== deletedComment.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId]);

  useEffect(() => {
    fetchComments();
  }, [itemId]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refetch: fetchComments,
  };
}