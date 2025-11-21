import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  id: string;
  project_id: string;
  analytics_date: string;
  total_items: number;
  completed_items: number;
  overdue_items: number;
  completion_rate: number;
  avg_completion_time_hours?: number;
  items_by_priority: any;
  items_by_status: any;
  trend_data: any;
}

interface TimeTrackingData {
  id: string;
  punchlist_item_id: string;
  started_at?: string;
  completed_at?: string;
  time_spent_minutes?: number;
}

export function usePunchlistAnalytics(projectId?: string) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [timeTracking, setTimeTracking] = useState<TimeTrackingData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      
      // Fetch analytics data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('punchlist_analytics')
        .select('*')
        .eq('project_id', projectId)
        .gte('analytics_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('analytics_date', { ascending: true });

      if (analyticsError) throw analyticsError;

      setAnalytics((analyticsData || []) as AnalyticsData[]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTimeTracking = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('punchlist_time_tracking')
        .insert({
          punchlist_item_id: itemId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setTimeTracking(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error starting time tracking:', error);
      return null;
    }
  };

  const stopTimeTracking = async (trackingId: string) => {
    try {
      const tracking = timeTracking.find(t => t.id === trackingId);
      if (!tracking?.started_at) return null;

      const startTime = new Date(tracking.started_at);
      const endTime = new Date();
      const timeSpentMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      const { data, error } = await supabase
        .from('punchlist_time_tracking')
        .update({
          completed_at: endTime.toISOString(),
          time_spent_minutes: timeSpentMinutes
        })
        .eq('id', trackingId)
        .select()
        .single();

      if (error) throw error;

      setTimeTracking(prev => prev.map(t => t.id === trackingId ? data : t));
      return data;
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      return null;
    }
  };

  const getAnalyticsSummary = () => {
    if (analytics.length === 0) return null;

    const latest = analytics[analytics.length - 1];
    const previous = analytics.length > 1 ? analytics[analytics.length - 2] : null;

    return {
      current: latest,
      trends: {
        completion_rate: previous ? latest.completion_rate - previous.completion_rate : 0,
        total_items: previous ? latest.total_items - previous.total_items : 0,
        overdue_items: previous ? latest.overdue_items - previous.overdue_items : 0
      }
    };
  };

  const getCompletionTrend = () => {
    return analytics.map(a => ({
      date: a.analytics_date,
      completion_rate: a.completion_rate,
      total_items: a.total_items,
      completed_items: a.completed_items
    }));
  };

  const getPriorityDistribution = () => {
    const latest = analytics[analytics.length - 1];
    if (!latest) return [];

    return Object.entries(latest.items_by_priority || {}).map(([priority, count]) => ({
      priority,
      count: count as number,
      percentage: latest.total_items > 0 ? ((count as number) / latest.total_items) * 100 : 0
    }));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  return {
    analytics,
    timeTracking,
    loading,
    fetchAnalytics,
    startTimeTracking,
    stopTimeTracking,
    getAnalyticsSummary,
    getCompletionTrend,
    getPriorityDistribution
  };
}