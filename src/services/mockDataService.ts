import { supabase } from "@/integrations/supabase/client";

export class MockDataService {
  // Generate sample leads with the new enhanced fields
  static async generateSampleLeads() {
    const sampleLeads = [
      {
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sarah.johnson@email.com",
        phone: "(555) 123-4567",
        company: "Johnson Farms",
        address: "123 Farm Road",
        city: "Austin",
        state: "TX",
        zip: "78701",
        county: "Travis",
        source: "Website",
        status: "Working",
        stage: "Quoted" as const,
        sub_status: "Recently Quoted" as const,
        priority: "High",
        estimated_value: 145000,
        building_type: "Barndominium",
        timeline: "3-6 Months" as any,
        quote_date: "2024-08-01",
        stage_entered_date: new Date("2024-08-01").toISOString(),
        deals_active: true,
        cadence_name: "Quoted-3-touch" as any,
        next_action_due_date: "2024-08-15",
        notes: "Interested in 40x60 barndominium with living quarters"
      },
      {
        first_name: "Mike",
        last_name: "Rodriguez",
        email: "mike.rodriguez@email.com",
        phone: "(555) 234-5678",
        company: "Rodriguez Construction",
        address: "456 Industrial Blvd",
        city: "Houston",
        state: "TX",
        zip: "77001",
        county: "Harris",
        source: "Referral",
        status: "New",
        stage: "Working" as const,
        sub_status: "Follow Up" as const,
        priority: "Medium",
        estimated_value: 89000,
        building_type: "Commercial",
        timeline: "0-3 Months" as any,
        first_contact_date: new Date("2024-08-10").toISOString(),
        stage_entered_date: new Date("2024-08-10").toISOString(),
        deals_active: true,
        cadence_name: "Follow-up-2-3-days" as any,
        next_action_due_date: "2024-08-14",
        notes: "Looking for office space and warehouse combo"
      },
      {
        first_name: "Jennifer",
        last_name: "Smith",
        email: "jen.smith@email.com",
        phone: "(555) 345-6789",
        company: "Smith Family Ranch",
        address: "789 Ranch Drive",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        county: "Dallas",
        source: "Facebook",
        status: "Quoted",
        stage: "Quoted" as any,
        sub_status: "In Decision Making" as any,
        priority: "Hot",
        estimated_value: 210000,
        building_type: "Residential",
        timeline: "6-12 Months" as any,
        quote_date: "2024-07-15",
        quote_valid_until: "2024-08-15",
        customer_decision_by: "2024-08-20",
        stage_entered_date: new Date("2024-07-15").toISOString(),
        deals_active: true,
        cadence_name: "Decision-weekly",
        next_action_due_date: "2024-08-17",
        notes: "High-end residential project, very interested but waiting on land purchase"
      },
      {
        first_name: "David",
        last_name: "Wilson",
        email: "david.wilson@email.com",
        phone: "(555) 456-7890",
        company: "Wilson Ag Services",
        address: "321 County Road 15",
        city: "San Antonio",
        state: "TX",
        zip: "78201",
        county: "Bexar",
        source: "Google Ads",
        status: "Lost",
        stage: "Lost" as any,
        sub_status: "Move to Lost" as any,
        priority: "Low",
        estimated_value: 75000,
        building_type: "Agricultural",
        timeline: "12+ Months",
        quote_date: "2024-06-01",
        lost_reason: "Budget",
        lost_notes: "Decided to postpone project due to budget constraints",
        stage_entered_date: new Date("2024-07-20").toISOString(),
        deals_active: false,
        notes: "Wanted equipment storage building, may revisit next year"
      },
      {
        first_name: "Lisa",
        last_name: "Brown",
        email: "lisa.brown@email.com",
        phone: "(555) 567-8901",
        company: "Brown Logistics",
        address: "654 Warehouse Way",
        city: "Fort Worth",
        state: "TX",
        zip: "76101",
        county: "Tarrant",
        source: "Trade Show",
        status: "Working",
        stage: "Negotiating" as any,
        sub_status: "In Decision Making",
        priority: "High",
        estimated_value: 185000,
        building_type: "Commercial",
        timeline: "0-3 Months",
        quote_date: "2024-07-28",
        quote_valid_until: "2024-08-28",
        first_contact_date: new Date("2024-07-20").toISOString(),
        stage_entered_date: new Date("2024-08-05").toISOString(),
        deals_active: true,
        cadence_name: "Decision-weekly",
        next_action_due_date: "2024-08-16",
        notes: "Logistics company needing expanded warehouse space"
      },
      {
        first_name: "Robert",
        last_name: "Taylor",
        email: "robert.taylor@email.com",
        phone: "(555) 678-9012",
        company: "Taylor Equipment",
        address: "987 Equipment Row",
        city: "Plano",
        state: "TX",
        zip: "75023",
        county: "Collin",
        source: "Referral",
        status: "Won",
        stage: "Won" as any,
        sub_status: "Current Customer",
        priority: "High",
        estimated_value: 165000,
        building_type: "Commercial",
        timeline: "3-6 Months",
        quote_date: "2024-06-15",
        stage_entered_date: new Date("2024-07-30").toISOString(),
        deals_active: true,
        converted_to_customer_id: "customer-123", // Would be a real customer ID
        notes: "Equipment dealer, project started last week"
      },
      {
        first_name: "Amanda",
        last_name: "Davis",
        email: "amanda.davis@email.com",
        phone: "(555) 789-0123",
        company: "Davis Horse Ranch",
        address: "456 Horse Trail",
        city: "Arlington",
        state: "TX",
        zip: "76010",
        county: "Tarrant",
        source: "Website",
        status: "New",
        stage: "New" as any,
        priority: "Medium",
        estimated_value: 95000,
        building_type: "Agricultural",
        timeline: "6-12 Months",
        stage_entered_date: new Date("2024-08-12").toISOString(),
        deals_active: true,
        notes: "Horse barn and training facility, just submitted form"
      },
      {
        first_name: "James",
        last_name: "Miller",
        email: "james.miller@email.com",
        phone: "(555) 890-1234",
        company: "Miller Manufacturing",
        address: "159 Industrial Parkway",
        city: "Garland",
        state: "TX",
        zip: "75040",
        county: "Dallas",
        source: "Cold Call",
        status: "Quoted",
        stage: "Quoted" as any,
        sub_status: "Pending Land/Budget",
        priority: "Medium",
        estimated_value: 125000,
        building_type: "Manufacturing",
        timeline: "12+ Months",
        quote_date: "2024-05-20",
        quote_valid_until: "2024-08-20",
        stage_entered_date: new Date("2024-05-20").toISOString(),
        deals_active: true,
        cadence_name: "Budget-monthly",
        next_action_due_date: "2024-08-20",
        notes: "Manufacturing expansion, waiting for land acquisition approval"
      }
    ];

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(sampleLeads as any)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sample leads:', error);
      throw error;
    }
  }

  // Generate sample follow-up tasks
  static async generateSampleTasks(leadIds: string[]) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sampleTasks = [
      {
        lead_id: leadIds[0],
        task_type: 'email',
        due_date: today.toISOString().split('T')[0],
        notes: 'Follow up on quote - 3 day nudge',
        is_automated: true
      },
      {
        lead_id: leadIds[1],
        task_type: 'call',
        due_date: yesterday.toISOString().split('T')[0],
        notes: 'Schedule site visit',
        is_automated: false
      },
      {
        lead_id: leadIds[2],
        task_type: 'quote_follow_up',
        due_date: today.toISOString().split('T')[0],
        notes: 'Check on decision timeline',
        is_automated: true
      },
      {
        lead_id: leadIds[4],
        task_type: 'email',
        due_date: tomorrow.toISOString().split('T')[0],
        notes: 'Send contract for signature',
        is_automated: false
      }
    ];

    try {
      const { data, error } = await supabase
        .from('lead_follow_up_tasks')
        .insert(sampleTasks)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sample tasks:', error);
      throw error;
    }
  }

  // Check if sample data already exists
  static async checkExistingSampleData() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .eq('email', 'sarah.johnson@email.com')
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking existing data:', error);
      return false;
    }
  }

  // Generate all sample data
  static async generateAllSampleData() {
    try {
      // Check if sample data already exists
      const hasExistingData = await this.checkExistingSampleData();
      if (hasExistingData) {
        console.log('Sample data already exists, skipping generation');
        return;
      }

      console.log('Generating sample leads...');
      const leads = await this.generateSampleLeads();
      
      if (leads && leads.length > 0) {
        console.log('Generating sample tasks...');
        const leadIds = leads.map(lead => lead.id);
        await this.generateSampleTasks(leadIds);
      }

      console.log('Sample data generation completed successfully!');
      return { success: true, message: 'Sample data generated successfully' };
    } catch (error) {
      console.error('Error generating sample data:', error);
      throw error;
    }
  }
}