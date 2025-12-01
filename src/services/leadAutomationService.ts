import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./supabaseService";

export interface LeadFollowUpTask {
  id: string;
  lead_id: string;
  task_type: string;
  due_date: string;
  completed_at?: string;
  assigned_to?: string;
  notes?: string;
  is_automated: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadCadence {
  id: string;
  name: string;
  description?: string;
  intervals_days: number[];
  max_touches: number;
  is_active: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  template_type: string;
  is_active: boolean;
}

export class LeadAutomationService {
  // Get all cadences
  static async getCadences(): Promise<LeadCadence[]> {
    const { data, error } = await supabase
      .from('lead_cadences')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Get follow-up tasks for a lead
  static async getLeadTasks(leadId: string): Promise<LeadFollowUpTask[]> {
    const { data, error } = await supabase
      .from('lead_follow_up_tasks')
      .select('*')
      .eq('lead_id', leadId)
      .order('due_date');

    if (error) throw error;
    return data || [];
  }

  // Get overdue tasks
  static async getOverdueTasks(): Promise<LeadFollowUpTask[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('lead_follow_up_tasks')
      .select('*')
      .lt('due_date', today)
      .is('completed_at', null)
      .order('due_date');

    if (error) throw error;
    return data || [];
  }

  // Get tasks due today
  static async getTodayTasks(): Promise<LeadFollowUpTask[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('lead_follow_up_tasks')
      .select('*')
      .eq('due_date', today)
      .is('completed_at', null)
      .order('due_date');

    if (error) throw error;
    return data || [];
  }

  // Create follow-up task
  static async createTask(task: Omit<LeadFollowUpTask, 'id' | 'created_at' | 'updated_at'>): Promise<LeadFollowUpTask> {
    const { data, error } = await supabase
      .from('lead_follow_up_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data as LeadFollowUpTask;
  }

  // Complete a task
  static async completeTask(taskId: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('lead_follow_up_tasks')
      .update({
        completed_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', taskId);

    if (error) throw error;
  }

  // Generate next follow-up tasks based on cadence
  static async generateCadenceTasks(leadId: string, cadenceName: 'Quoted-3-touch' | 'Follow-up-2-3-days' | 'Decision-weekly' | 'Budget-monthly' | 'Customer-quarterly'): Promise<void> {
    // Get the cadence configuration
    const { data: cadence, error: cadenceError } = await supabase
      .from('lead_cadences')
      .select('*')
      .eq('name', cadenceName)
      .single();

    if (cadenceError || !cadence) return;

    // Get existing tasks for this lead
    const { data: existingTasks } = await supabase
      .from('lead_follow_up_tasks')
      .select('*')
      .eq('lead_id', leadId)
      .eq('is_automated', true);

    const existingTaskCount = existingTasks?.length || 0;
    
    // Only create tasks if we haven't reached the max touches
    if (existingTaskCount >= cadence.max_touches) return;

    // Create tasks for remaining intervals
    const tasksToCreate = [];
    const today = new Date();

    for (let i = existingTaskCount; i < cadence.max_touches; i++) {
      const daysToAdd = cadence.intervals_days[i] || cadence.intervals_days[cadence.intervals_days.length - 1];
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + daysToAdd);

      tasksToCreate.push({
        lead_id: leadId,
        task_type: 'email',
        due_date: dueDate.toISOString().split('T')[0],
        is_automated: true
      });
    }

    if (tasksToCreate.length > 0) {
      const { error } = await supabase
        .from('lead_follow_up_tasks')
        .insert(tasksToCreate);

      if (error) throw error;
    }
  }

  // Get leads by aging buckets
  static async getLeadsByAging() {
    const { data, error } = await supabase
      .from('leads')
      .select('*, assigned_to(name)')
      .eq('stage', 'Quoted')
      .not('quote_date', 'is', null);

    if (error) throw error;

    const today = new Date();
    const leads = data || [];

    const buckets = {
      recent: leads.filter(lead => {
        if (!lead.quote_date) return false;
        const daysSince = Math.floor((today.getTime() - new Date(lead.quote_date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 30;
      }),
      thirtyToNinety: leads.filter(lead => {
        if (!lead.quote_date) return false;
        const daysSince = Math.floor((today.getTime() - new Date(lead.quote_date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 30 && daysSince <= 90;
      }),
      ninetyToOneEighty: leads.filter(lead => {
        if (!lead.quote_date) return false;
        const daysSince = Math.floor((today.getTime() - new Date(lead.quote_date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 90 && daysSince <= 180;
      }),
      stale: leads.filter(lead => {
        if (!lead.quote_date) return false;
        const daysSince = Math.floor((today.getTime() - new Date(lead.quote_date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 180;
      })
    };

    return buckets;
  }

  // Get email templates
  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Calculate lead metrics
  static async getLeadMetrics() {
    // Get all leads
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*');

    if (leadsError) throw leadsError;

    const leads = allLeads || [];
    const today = new Date();

    // Calculate various metrics
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.stage === 'Won').length;
    const lostLeads = leads.filter(l => l.stage === 'Lost').length;
    const activeLeads = leads.filter(l => !['Won', 'Lost'].includes(l.stage || '')).length;

    // Win rate
    const winRate = totalLeads > 0 ? (wonLeads / (wonLeads + lostLeads)) * 100 : 0;

    // Average response time (mock calculation)
    const avgResponseTime = leads
      .filter(l => l.first_contact_date && l.created_at)
      .reduce((acc, lead) => {
        const created = new Date(lead.created_at).getTime();
        const contacted = new Date(lead.first_contact_date!).getTime();
        return acc + (contacted - created) / (1000 * 60 * 60); // hours
      }, 0) / leads.filter(l => l.first_contact_date && l.created_at).length || 0;

    // Quote to close time
    const avgQuoteToClose = leads
      .filter(l => l.quote_date && l.stage === 'Won' && l.updated_at)
      .reduce((acc, lead) => {
        const quoted = new Date(lead.quote_date!).getTime();
        const closed = new Date(lead.updated_at).getTime();
        return acc + (closed - quoted) / (1000 * 60 * 60 * 24); // days
      }, 0) / leads.filter(l => l.quote_date && l.stage === 'Won').length || 0;

    return {
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      winRate: Math.round(winRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      avgQuoteToClose: Math.round(avgQuoteToClose * 100) / 100
    };
  }
}