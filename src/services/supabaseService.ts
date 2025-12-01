import { supabase } from '@/integrations/supabase/client';
import { addDays, subDays } from 'date-fns';
import { generateProjectCode } from '@/lib/project-utils';

// Types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'builder' | 'customer';
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  user_id?: string;
  signed_up_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInvite {
  id: string;
  customer_id: string;
  invited_by?: string;
  invite_token: string;
  email: string;
  invited_at: string;
  accepted_at?: string;
  expires_at: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role: string;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  password_hash?: string;
}

export interface LeadNotification {
  id: string;
  lead_id: string;
  team_member_id: string;
  notification_type: string;
  message: string;
  read_at?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source: string;
  status: string;
  priority: string;
  assigned_to?: string;
  assigned_to_name?: string;
  estimated_value: number;
  building_type?: string;
  notes?: string;
  last_contact_date?: string;
  next_follow_up?: string;
  converted_to_customer_id?: string;
  assigned_date?: string;
  notification_sent?: boolean;
  archived_at?: string;
  pipeline_probability?: number;
  created_at: string;
  updated_at: string;
  // Enhanced Lead Management fields
  stage?: 'New' | 'Working' | 'Quoted' | 'Negotiating' | 'Committed' | 'Won' | 'Lost';
  sub_status?: 'Recently Quoted' | 'Follow Up' | 'In Decision Making' | 'Pending Land/Budget' | 'Current Customer' | 'Move to Lost' | 'Not Qualified';
  quote_date?: string;
  stage_entered_date?: string;
  first_contact_date?: string;
  quote_valid_until?: string;
  customer_decision_by?: string;
  next_action_due_date?: string;
  cadence_name?: 'Quoted-3-touch' | 'Follow-up-2-3-days' | 'Decision-weekly' | 'Budget-monthly' | 'Customer-quarterly';
  county?: string;
  timeline?: '0-3 Months' | '3-6 Months' | '6-12 Months' | '12+ Months';
  lost_reason?: 'Budget' | 'Timeline' | 'Location' | 'DIY' | 'Competitor' | 'No Response' | 'Other';
  lost_notes?: string;
  deals_active?: boolean;
  building_specifications?: any;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  team_member_id?: string;
  activity_type: string;
  subject?: string;
  notes?: string;
  scheduled_for?: string;
  completed_at?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  customer_id: string;
  customer_name: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  progress: number;
  building_type?: string;
  county?: string;
  square_footage?: number;
  start_date: string;
  estimated_completion: string;
  end_date?: string;
  completion_date?: string;
  budget?: number;
  estimated_profit?: number;
  actual_profit?: number;
  description?: string;
  phase?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  is_cancelled?: boolean;
  created_at: string;
  updated_at: string;
  costs?: ProjectCosts;
}

export interface ProjectCosts {
  id: string;
  project_id: string;
  metal: number;
  lumber: number;
  doors_windows: number;
  garage_doors: number;
  flooring: number;
  drywall: number;
  paint: number;
  fixtures: number;
  trim: number;
  building_crew: number;
  concrete: number;
  electric: number;
  plumbing: number;
  hvac: number;
  drywall_sub: number;
  painter: number;
  additional_cogs: number;
  miscellaneous: number;
  materials: number;
  permits: number;
  equipment: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  project_id?: string;
  project_name?: string;
  job_type: 'Residential' | 'Barndominium' | 'Commercial';
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Activity {
  id: string;
  type: 'milestone' | 'task' | 'note' | 'invoice' | 'payment';
  title: string;
  description?: string;
  project_id?: string;
  project_name?: string;
  status: 'new' | 'in-progress' | 'completed' | 'overdue';
  time: string;
  created_at: string;
}

// Service functions
export class SupabaseService {
  public supabase = supabase; // Expose the supabase client

  // Authentication
  async signUp(email: string, password: string, userData: { full_name?: string; role?: 'builder' | 'customer' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data as Profile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    
    if (error) throw error;
    return data as Customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Customer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Customer Invites
  async sendCustomerInvite(customerId: string, email: string): Promise<CustomerInvite> {
    const { data, error } = await supabase
      .from('customer_invites')
      .insert([{
        customer_id: customerId,
        email: email,
        invited_by: (await this.getCurrentUser())?.id
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Call edge function to send email
    await supabase.functions.invoke('send-customer-invite', {
      body: {
        email: email,
        invite_token: data.invite_token,
        customer_id: customerId
      }
    });
    
    return data as CustomerInvite;
  }

  async getCustomerInvites(customerId: string): Promise<CustomerInvite[]> {
    const { data, error } = await supabase
      .from('customer_invites')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async acceptCustomerInvite(inviteToken: string, userId: string): Promise<boolean> {
    const { data: invite, error: inviteError } = await supabase
      .from('customer_invites')
      .select('customer_id')
      .eq('invite_token', inviteToken)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) throw new Error('Invalid or expired invite');

    // Update customer with user_id
    await supabase
      .from('customers')
      .update({ 
        user_id: userId, 
        signed_up_at: new Date().toISOString() 
      })
      .eq('id', invite.customer_id);

    // Mark invite as accepted
    await supabase
      .from('customer_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('invite_token', inviteToken);

    return true;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        costs:project_costs(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(project => ({
      ...project,
      status: project.status as Project['status'],
      costs: project.costs?.[0] || null
    })) || [];
  }

  async addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    // Use projects_new table for all new projects
    // Compute standardized project code
    const lastName = (project.customer_name || project.name || '').trim().split(/\s+/).slice(-1)[0] || 'PROJECT';
    const computedCode = generateProjectCode(project.building_type || 'Barndominium', lastName, '001');

    const { data, error } = await supabase
      .from('projects_new')
      .insert([{
        code: computedCode,
        name: project.name,
        status: (project.status as any) || 'Lead',
        city: project.city,
        state: project.state,
        zip: project.zip,
        building_type: project.building_type || 'Barndominium',
        notes: project.description,
        latitude: project.latitude,
        longitude: project.longitude,
        size_sqft: project.square_footage,
        start_target: project.start_date,
        finish_target: project.estimated_completion
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Map projects_new fields back to Project interface
    return { 
      id: data.id,
      name: data.name,
      customer_id: '', // projects_new doesn't have customer_id
      customer_name: '',
      status: data.status as Project['status'],
      progress: 0,
      building_type: data.building_type,
      square_footage: data.size_sqft,
      start_date: data.start_target,
      estimated_completion: data.finish_target,
      description: data.notes,
      city: data.city,
      state: data.state,
      zip: data.zip,
      latitude: data.latitude,
      longitude: data.longitude,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as Project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { ...data, status: data.status as Project['status'] } as Project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Project Costs
  async getProjectCosts(): Promise<ProjectCosts[]> {
    const { data, error } = await supabase
      .from('project_costs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  async updateProjectCosts(projectId: string, costs: Partial<ProjectCosts>): Promise<ProjectCosts> {
    // First, check if there's an existing cost record for this project
    const { data: existingCosts } = await supabase
      .from('project_costs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (existingCosts && existingCosts.length > 0) {
      // Update the existing record
      const { data, error } = await supabase
        .from('project_costs')
        .update(costs)
        .eq('id', existingCosts[0].id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clean up any duplicate records for this project (keep only the updated one)
      await supabase
        .from('project_costs')
        .delete()
        .eq('project_id', projectId)
        .neq('id', data.id);
      
      return data as ProjectCosts;
    } else {
      // Create a new record
      const { data, error } = await supabase
        .from('project_costs')
        .insert({
          project_id: projectId,
          ...costs
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ProjectCosts;
    }
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(invoice => ({
      ...invoice,
      job_type: invoice.job_type as Invoice['job_type'],
      status: invoice.status as Invoice['status'],
      items: invoice.items || []
    })) || [];
  }

  async generatePaymentDrawInvoices(projectId: string): Promise<void> {
    try {
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        throw new Error('Project not found');
      }

      // Get customer details
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', project.customer_id)
        .single();

      if (customerError || !customer) {
        throw new Error('Customer not found');
      }

      // Check if invoices already exist for this project to avoid duplicates
      const { data: existingInvoices, error: existingError } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', projectId)
        .like('invoice_number', '%DRAW%');

      if (existingError) throw existingError;

      if (existingInvoices && existingInvoices.length > 0) {
        console.log('Payment draw invoices already exist for this project');
        return;
      }

      // Get project schedule data to determine phase-based due dates
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('project_schedules')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (scheduleError) {
        console.log('No schedule found, using default date offsets');
      }

      // Define payment schedule tied to actual construction phases
      const paymentSchedule = [
        {
          drawNumber: 1,
          title: 'Draw 1 – Permit Approved',
          percentage: 0.20,
          description: 'Payment due once building permit has been approved and project is cleared to begin.',
          phaseType: 'project_start'
        },
        {
          drawNumber: 2,
          title: 'Draw 2 – Lumber Delivered Onsite',
          percentage: 0.20,
          description: 'Payment due upon delivery of framing package to job site.',
          phaseType: 'lumber_delivery' // 3 days before project start
        },
        {
          drawNumber: 3,
          title: 'Draw 3 – Trusses Set',
          percentage: 0.15,
          description: 'Payment due once roof trusses are installed and framing is substantially complete.',
          phaseType: 'framing_crew', // 4th day of framing crew
          dayOffset: 3 // 0-indexed, so day 4 = offset 3
        },
        {
          drawNumber: 4,
          title: 'Draw 4 – Dried-In',
          percentage: 0.15,
          description: 'Payment due when building is weather-tight with roofing, windows, and exterior Entry doors installed. Note: Garage Doors and any special order doors are not part of this.',
          phaseType: 'framing_crew', // Final day of framing crew
          dayOffset: 'end' // End of framing crew phase
        },
        {
          drawNumber: 5,
          title: 'Draw 5 – Rough-Ins Complete',
          percentage: 0.15,
          description: 'Payment due when plumbing, electrical, and HVAC rough-ins are completed and inspected.',
          phaseType: 'insulation', // 1 day before insulation starts
          dayOffset: -1 // 1 day before insulation starts
        },
        {
          drawNumber: 6,
          title: 'Draw 6 – Drywall Installed',
          percentage: 0.10,
          description: 'Payment due once drywall is hung and finished.',
          phaseType: 'drywall', // 1 day after drywall completed
          dayOffset: 1 // 1 day after completion
        },
        {
          drawNumber: 7,
          title: 'Draw 7 – Certificate of Occupancy',
          percentage: 0.05,
          description: 'Payment due after final walkthrough and Certificate of Occupancy issued.',
          phaseType: 'completion' // Project completion date
        }
      ];

      // Helper function to find a phase in the schedule data
      const findPhaseInSchedule = (phaseName: string) => {
        if (!scheduleData?.schedule_data || !Array.isArray(scheduleData.schedule_data)) return null;
        return (scheduleData.schedule_data as any[]).find((phase: any) => 
          phase.name?.toLowerCase().includes(phaseName) || 
          phase.title?.toLowerCase().includes(phaseName)
        );
      };

      // Calculate dates based on project schedule or fallback to project dates
      const projectStartDate = new Date(project.start_date.split('T')[0] + 'T12:00:00Z');
      const projectCompletionDate = project.estimated_completion ? 
        new Date(project.estimated_completion.split('T')[0] + 'T12:00:00Z') : 
        addDays(projectStartDate, 90); // 90-day fallback

      const invoicesToCreate = [];

      for (const draw of paymentSchedule) {
        let dueDate: Date;

        // Calculate due date based on phase type
        switch (draw.phaseType) {
          case 'project_start':
            dueDate = new Date(projectStartDate);
            break;

          case 'lumber_delivery':
            dueDate = subDays(projectStartDate, 3);
            break;

          case 'framing_crew':
            const framingPhase = findPhaseInSchedule('framing');
            if (framingPhase) {
              if (draw.dayOffset === 'end') {
                // Use end date of framing crew phase
                dueDate = framingPhase.endDate ? 
                  new Date(framingPhase.endDate.split('T')[0] + 'T12:00:00Z') :
                  addDays(projectStartDate, 21); // Fallback
              } else {
                // Use start date plus offset
                const framingStart = framingPhase.startDate ? 
                  new Date(framingPhase.startDate.split('T')[0] + 'T12:00:00Z') :
                  addDays(projectStartDate, 7); // Fallback
                const offsetDays = typeof draw.dayOffset === 'number' ? draw.dayOffset : 0;
                dueDate = addDays(framingStart, offsetDays);
              }
            } else {
              dueDate = addDays(projectStartDate, 21); // Fallback: 21 days after start
            }
            break;

          case 'plumbing_underground':
            const plumbingPhase = findPhaseInSchedule('plumbing') || findPhaseInSchedule('underground');
            if (plumbingPhase?.startDate) {
              const plumbingStart = new Date(plumbingPhase.startDate.split('T')[0] + 'T12:00:00Z');
              const offsetDays = typeof draw.dayOffset === 'number' ? draw.dayOffset : 0;
              dueDate = addDays(plumbingStart, offsetDays);
            } else {
              dueDate = addDays(projectStartDate, 25); // Fallback: 25 days after start
            }
            break;

          case 'insulation':
            const insulationPhase = findPhaseInSchedule('insulation');
            if (insulationPhase?.startDate) {
              const insulationStart = new Date(insulationPhase.startDate.split('T')[0] + 'T12:00:00Z');
              const offsetDays = typeof draw.dayOffset === 'number' ? draw.dayOffset : 0;
              dueDate = addDays(insulationStart, offsetDays);
            } else {
              dueDate = addDays(projectStartDate, 40); // Fallback: 40 days after start
            }
            break;

          case 'drywall':
            const drywallPhase = findPhaseInSchedule('drywall');
            if (drywallPhase?.endDate) {
              const drywallEnd = new Date(drywallPhase.endDate.split('T')[0] + 'T12:00:00Z');
              const offsetDays = typeof draw.dayOffset === 'number' ? draw.dayOffset : 0;
              dueDate = addDays(drywallEnd, offsetDays);
            } else {
              dueDate = addDays(projectStartDate, 65); // Fallback: 65 days after start
            }
            break;

          case 'completion':
            dueDate = new Date(projectCompletionDate);
            break;

          default:
            dueDate = addDays(projectStartDate, 30); // Safe fallback
        }
        
        const issueDate = new Date(dueDate);
        issueDate.setDate(issueDate.getDate() - 7); // Issue 7 days before due date

        const amount = Math.round((project.budget || 0) * draw.percentage);
        
        const invoiceNumber = `${project.name} - Draw ${draw.drawNumber}`;

        const invoiceData = {
          customer_id: customer.id,
          project_id: projectId,
          invoice_number: invoiceNumber,
          customer_name: customer.name,
          project_name: project.name,
          job_type: 'Residential' as const,
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          subtotal: amount,
          tax: Math.round(amount * 0.0875), // 8.75% tax rate
          total: Math.round(amount * 1.0875),
          status: 'Draft' as const,
          notes: `Draw ${draw.drawNumber}`
        };

        invoicesToCreate.push(invoiceData);
      }

      // Create all invoices
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoicesToCreate)
        .select();

      if (error) throw error;

      // Create invoice items for each invoice
      for (let i = 0; i < (data || []).length; i++) {
        const invoice = data[i];
        const draw = paymentSchedule[i];
        
        await supabase
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            description: `${draw.title} - Construction Progress Payment`,
            quantity: 1,
            unit_price: invoice.subtotal,
            total_price: invoice.subtotal
          });
      }

      console.log(`Generated ${invoicesToCreate.length} payment draw invoices for project ${project.name}`);
    } catch (error) {
      console.error('Error generating payment draw invoices:', error);
      throw error;
    }
  }

  async addInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const { items, ...invoiceData } = invoice;
    
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Add invoice items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        invoice_id: data.id
      }));
      
      await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
    }
    
    return { 
      ...data, 
      job_type: data.job_type as Invoice['job_type'],
      status: data.status as Invoice['status'],
      items 
    } as Invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { items, ...invoiceData } = updates;
    
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update items if provided
    if (items) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      // Insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          ...item,
          invoice_id: id
        }));
        
        await supabase
          .from('invoice_items')
          .insert(itemsToInsert);
      }
    }
    
    return { 
      ...data, 
      job_type: data.job_type as Invoice['job_type'],
      status: data.status as Invoice['status'],
      items: items || [] 
    } as Invoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data?.map(activity => ({
      ...activity,
      type: activity.type as Activity['type'],
      status: activity.status as Activity['status']
    })) || [];
  }

  async addActivity(activity: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();
    
    if (error) throw error;
    return { 
      ...data, 
      type: data.type as Activity['type'],
      status: data.status as Activity['status']
    } as Activity;
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Simple password hashing utility
  private async hashPassword(password: string): Promise<string> {
    // Simple hash using built-in crypto for now
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async addTeamMember(teamMember: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'> & { password?: string }): Promise<TeamMember> {
    const { password, ...memberData } = teamMember;
    
    // Hash password if provided
    let password_hash = '';
    if (password) {
      password_hash = await this.hashPassword(password);
    }
    
    const { data, error } = await supabase
      .from('team_members')
      .insert([{ ...memberData, password_hash }])
      .select()
      .single();
    
    if (error) throw error;
    return data as TeamMember;
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember> & { password?: string }): Promise<TeamMember> {
    const { password, ...memberData } = updates;
    
    // Hash password if provided
    let updateData = { ...memberData };
    if (password) {
      updateData.password_hash = await this.hashPassword(password);
    }
    
    const { data, error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TeamMember;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Lead Notifications
  async getLeadNotifications(teamMemberId?: string): Promise<LeadNotification[]> {
    let query = this.supabase
      .from('lead_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (teamMemberId) {
      query = query.eq('team_member_id', teamMemberId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('lead_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    if (error) throw error;
    return true;
  }

  async getUnreadNotificationCount(teamMemberId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('lead_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('team_member_id', teamMemberId)
      .is('read_at', null);
    
    if (error) throw error;
    return count || 0;
  }

  // Enhanced Lead Methods
  async getLeads(): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        team_members!leads_assigned_to_fkey(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(lead => ({
      ...lead,
      assigned_to_name: lead.team_members?.name || undefined
    })) || [];
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        team_members!leads_assigned_to_fkey(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(lead => ({
      ...lead,
      assigned_to_name: lead.team_members?.name || undefined
    })) || [];
  }

  async getLeadsByTeamMember(teamMemberId: string): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        team_members!leads_assigned_to_fkey(name)
      `)
      .eq('assigned_to', teamMemberId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(lead => ({
      ...lead,
      assigned_to_name: lead.team_members?.name || undefined
    })) || [];
  }

  async getActiveLeads(): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        team_members!leads_assigned_to_fkey(name)
      `)
      .is('archived_at', null)
      .neq('status', 'Lost')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(lead => ({
      ...lead,
      assigned_to_name: lead.team_members?.name || undefined
    })) || [];
  }

  async getArchivedLeads(): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        team_members!leads_assigned_to_fkey(name)
      `)
      .or('archived_at.not.is.null,status.eq.Lost')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(lead => ({
      ...lead,
      assigned_to_name: lead.team_members?.name || undefined
    })) || [];
  }

  async assignLead(leadId: string, teamMemberId: string): Promise<Lead> {
    const { data, error } = await this.supabase
      .from('leads')
      .update({ 
        assigned_to: teamMemberId,
        assigned_date: new Date().toISOString(),
        notification_sent: true
      })
      .eq('id', leadId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  }

  async addLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assigned_to_name'>): Promise<Lead> {
    console.log('supabaseService.addLead called with:', lead);
    
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select()
      .single();
    
    console.log('Supabase response:', { data, error });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data as Lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    console.log('Supabase updateLead called with:', { id, updates });
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase updateLead error:', error);
        throw error;
      }
      
      console.log('Supabase updateLead success:', data);
      return data as Lead;
    } catch (error) {
      console.error('updateLead failed:', error);
      throw error;
    }
  }

  async deleteLead(id: string): Promise<boolean> {
    try {
      // First, delete all related records to avoid foreign key constraint issues
      
      // Delete related estimates
      await supabase
        .from('estimates')
        .delete()
        .eq('lead_id', id);
      
      // Delete related lead activities
      await supabase
        .from('lead_activities')
        .delete()
        .eq('lead_id', id);
      
      // Delete related lead notifications
      await supabase
        .from('lead_notifications')
        .delete()
        .eq('lead_id', id);
      
      // Delete related lead documents
      await supabase
        .from('lead_documents')
        .delete()
        .eq('lead_id', id);
      
      // Delete related price requests
      await supabase
        .from('price_requests')
        .delete()
        .eq('lead_id', id);
      
      // Finally, delete the lead itself
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteLead:', error);
      throw error;
    }
  }

  async convertLeadToCustomer(leadId: string, customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    // Create customer
    const customer = await this.addCustomer(customerData);
    
    // Update lead to mark as converted
    await this.updateLead(leadId, {
      status: 'Won',
      converted_to_customer_id: customer.id
    });
    
    return customer;
  }

  // Lead Activities
  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async addLeadActivity(activity: Omit<LeadActivity, 'id' | 'created_at'>): Promise<LeadActivity> {
    const { data, error } = await supabase
      .from('lead_activities')
      .insert([activity])
      .select()
      .single();
    
    if (error) throw error;
    return data as LeadActivity;
  }

  // Enhanced Statistics with Lead Tracking
  async getCompanyStats() {
    const [leads, projects, customers, invoices] = await Promise.all([
      this.getLeads(),
      this.getProjects(),
      this.getCustomers(),
      this.getInvoices()
    ]);

    const totalLeadValue = leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    const totalProjectValue = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

    // Enhanced lead statistics
    const leadStats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => l.status === 'Contacted').length,
      qualified: leads.filter(l => l.status === 'Qualified').length,
      proposal: leads.filter(l => l.status === 'Proposal').length,
      won: leads.filter(l => l.status === 'Won').length,
      lost: leads.filter(l => l.status === 'Lost').length,
      converted: leads.filter(l => l.converted_to_customer_id).length,
      totalValue: totalLeadValue,
      avgValue: leads.length > 0 ? totalLeadValue / leads.length : 0,
      conversionRate: leads.length > 0 ? (leads.filter(l => l.status === 'Won').length / leads.length) * 100 : 0
    };

    return {
      leads: leadStats,
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'In Progress').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        totalValue: totalProjectValue
      },
      customers: {
        total: customers.length
      },
      invoices: {
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'Paid').length,
        pending: invoices.filter(i => i.status === 'Sent').length,
        totalValue: totalInvoiceValue
      }
    };
  }

  async getTeamMemberStats(teamMemberId: string) {
    const leads = await this.getLeadsByTeamMember(teamMemberId);
    const totalLeadValue = leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    const notifications = await this.getLeadNotifications(teamMemberId);
    const unreadCount = await this.getUnreadNotificationCount(teamMemberId);

    return {
      leads: {
        total: leads.length,
        new: leads.filter(l => l.status === 'New').length,
        contacted: leads.filter(l => l.status === 'Contacted').length,
        qualified: leads.filter(l => l.status === 'Qualified').length,
        proposal: leads.filter(l => l.status === 'Proposal').length,
        won: leads.filter(l => l.status === 'Won').length,
        lost: leads.filter(l => l.status === 'Lost').length,
        totalValue: totalLeadValue,
        conversionRate: leads.length > 0 ? (leads.filter(l => l.status === 'Won').length / leads.length) * 100 : 0
      },
      notifications: {
        total: notifications.length,
        unread: unreadCount
      }
    };
  }

  // Design Selection Documents
  async getDesignSelectionDocument(projectId: string) {
    const { data, error } = await supabase
      .from('design_selection_documents')
      .select(`
        *,
        design_selection_versions (
          id,
          version_number,
          selections_data,
          notes,
          created_at,
          created_by
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  async createDesignSelectionDocument(projectId: string, customerId: string, selectionsData: any, notes?: string) {
    const { data: user } = await supabase.auth.getUser();
    
    // Create the document
    const { data: document, error: docError } = await supabase
      .from('design_selection_documents')
      .insert({
        project_id: projectId,
        customer_id: customerId,
        created_by: user.user?.id
      })
      .select()
      .single();
    
    if (docError) throw docError;
    
    // Create the first version
    const { data: version, error: versionError } = await supabase
      .from('design_selection_versions')
      .insert({
        document_id: document.id,
        version_number: 1,
        selections_data: selectionsData,
        notes,
        created_by: user.user?.id
      })
      .select()
      .single();
    
    if (versionError) throw versionError;
    
    return { document, version };
  }

  async createNewDesignSelectionVersion(documentId: string, selectionsData: any, notes?: string) {
    const { data: user } = await supabase.auth.getUser();
    
    // Get current highest version number
    const { data: currentDoc, error: docError } = await supabase
      .from('design_selection_documents')
      .select('current_version_number')
      .eq('id', documentId)
      .single();
    
    if (docError) throw docError;
    
    const newVersionNumber = currentDoc.current_version_number + 1;
    
    // Create new version
    const { data: version, error: versionError } = await supabase
      .from('design_selection_versions')
      .insert({
        document_id: documentId,
        version_number: newVersionNumber,
        selections_data: selectionsData,
        notes,
        created_by: user.user?.id
      })
      .select()
      .single();
    
    if (versionError) throw versionError;
    
    // Update document's current version number
    const { error: updateError } = await supabase
      .from('design_selection_documents')
      .update({ current_version_number: newVersionNumber })
      .eq('id', documentId);
    
    if (updateError) throw updateError;
    
    return version;
  }

  // Change Orders methods
  async createChangeOrder(changeOrderData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('change_orders')
        .insert([changeOrderData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating change order:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
