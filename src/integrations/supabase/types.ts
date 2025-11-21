export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          project_name: string | null
          status: string | null
          time: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          project_name?: string | null
          status?: string | null
          time: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          project_name?: string | null
          status?: string | null
          time?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ts: string
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ts?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ts?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      building_layouts: {
        Row: {
          building_height: number | null
          building_length: number | null
          building_width: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          layout_data: Json | null
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          layout_data?: Json | null
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          layout_data?: Json | null
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_layouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_layouts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          cost_impact: number | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          payment_plan_data: Json | null
          payment_plan_type: string | null
          project_id: string
          requested_by: string | null
          requested_date: string | null
          schedule_impact_days: number | null
          signature_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          cost_impact?: number | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_plan_data?: Json | null
          payment_plan_type?: string | null
          project_id: string
          requested_by?: string | null
          requested_date?: string | null
          schedule_impact_days?: number | null
          signature_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          cost_impact?: number | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_plan_data?: Json | null
          payment_plan_type?: string | null
          project_id?: string
          requested_by?: string | null
          requested_date?: string | null
          schedule_impact_days?: number | null
          signature_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "digital_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          delta_cost: number
          delta_days: number
          description: string | null
          id: string
          phase_id: string | null
          project_id: string
          reason: string | null
          requested_by: string
          requested_by_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          delta_cost?: number
          delta_days?: number
          description?: string | null
          id?: string
          phase_id?: string | null
          project_id: string
          reason?: string | null
          requested_by: string
          requested_by_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          delta_cost?: number
          delta_days?: number
          description?: string | null
          id?: string
          phase_id?: string | null
          project_id?: string
          reason?: string | null
          requested_by?: string
          requested_by_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests_vendor: {
        Row: {
          code: string
          cost_impact: number | null
          created_at: string
          description: string | null
          id: string
          object_alias: string | null
          po_id: string | null
          project_id: string | null
          schedule_impact_days: number | null
          status: string
          title: string
          updated_at: string
          vendor_id: string
          vendor_response: string | null
        }
        Insert: {
          code: string
          cost_impact?: number | null
          created_at?: string
          description?: string | null
          id?: string
          object_alias?: string | null
          po_id?: string | null
          project_id?: string | null
          schedule_impact_days?: number | null
          status?: string
          title: string
          updated_at?: string
          vendor_id: string
          vendor_response?: string | null
        }
        Update: {
          code?: string
          cost_impact?: number | null
          created_at?: string
          description?: string | null
          id?: string
          object_alias?: string | null
          po_id?: string | null
          project_id?: string | null
          schedule_impact_days?: number | null
          status?: string
          title?: string
          updated_at?: string
          vendor_id?: string
          vendor_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_vendor_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_vendor_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_vendor_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_priority: boolean | null
          message_text: string
          message_type: string
          project_id: string
          read_by: Json | null
          reply_to_id: string | null
          sender_id: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_priority?: boolean | null
          message_text: string
          message_type?: string
          project_id: string
          read_by?: Json | null
          reply_to_id?: string | null
          sender_id: string
          sender_type?: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_priority?: boolean | null
          message_text?: string
          message_type?: string
          project_id?: string
          read_by?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      critical_path_analysis: {
        Row: {
          analysis_data: Json | null
          analysis_date: string
          created_at: string
          critical_phases: string[]
          id: string
          longest_path_duration: number | null
          project_id: string
          total_float_days: number | null
        }
        Insert: {
          analysis_data?: Json | null
          analysis_date?: string
          created_at?: string
          critical_phases?: string[]
          id?: string
          longest_path_duration?: number | null
          project_id: string
          total_float_days?: number | null
        }
        Update: {
          analysis_data?: Json | null
          analysis_date?: string
          created_at?: string
          critical_phases?: string[]
          id?: string
          longest_path_duration?: number | null
          project_id?: string
          total_float_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "critical_path_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          created_at: string
          customer_facing: boolean | null
          customer_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          voice_note: string | null
        }
        Insert: {
          created_at?: string
          customer_facing?: boolean | null
          customer_id: string
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          notes?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          voice_note?: string | null
        }
        Update: {
          created_at?: string
          customer_facing?: boolean | null
          customer_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          voice_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          customer_id: string
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_at: string
          invited_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          customer_id: string
          email: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_at?: string
          invited_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          customer_id?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_at?: string
          invited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_onboarding: {
        Row: {
          communication_setup: boolean | null
          completed_at: string | null
          created_at: string
          customer_id: string
          dashboard_configured: boolean | null
          id: string
          onboarding_step: number | null
          project_id: string
          timeline_viewed: boolean | null
          updated_at: string
          welcome_completed: boolean | null
        }
        Insert: {
          communication_setup?: boolean | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          dashboard_configured?: boolean | null
          id?: string
          onboarding_step?: number | null
          project_id: string
          timeline_viewed?: boolean | null
          updated_at?: string
          welcome_completed?: boolean | null
        }
        Update: {
          communication_setup?: boolean | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          dashboard_configured?: boolean | null
          id?: string
          onboarding_step?: number | null
          project_id?: string
          timeline_viewed?: boolean | null
          updated_at?: string
          welcome_completed?: boolean | null
        }
        Relationships: []
      }
      customer_portal_access: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          last_accessed: string | null
          portal_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          last_accessed?: string | null
          portal_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          last_accessed?: string | null
          portal_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_access_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          signed_up_at: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          signed_up_at?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          signed_up_at?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      design_asset_categories: {
        Row: {
          bucket_path: string
          category_name: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          subcategory_name: string | null
          updated_at: string | null
        }
        Insert: {
          bucket_path: string
          category_name: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          subcategory_name?: string | null
          updated_at?: string | null
        }
        Update: {
          bucket_path?: string
          category_name?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          subcategory_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      design_options: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          is_active: boolean | null
          name: string
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          is_active?: boolean | null
          name: string
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      design_selection_documents: {
        Row: {
          created_at: string
          created_by: string | null
          current_version_number: number
          customer_id: string
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          customer_id: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          customer_id?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_selection_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_selection_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_selection_versions: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          notes: string | null
          selections_data: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          notes?: string | null
          selections_data: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          notes?: string | null
          selections_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_selection_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "design_selection_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_signatures: {
        Row: {
          created_at: string
          document_id: string | null
          document_type: string
          id: string
          ip_address: string | null
          signature_data: string
          signed_at: string
          signer_email: string
          signer_name: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_type: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signed_at?: string
          signer_email: string
          signer_name: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signed_at?: string
          signer_email?: string
          signer_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      estimates: {
        Row: {
          building_type: string
          created_at: string
          created_by: string | null
          description: string | null
          detailed_breakdown: Json | null
          dimensions: string | null
          estimated_price: number
          id: string
          is_auto_generated: boolean
          is_written_estimate: boolean | null
          lead_id: string
          lead_name: string
          notes: string | null
          scope: string | null
          status: string
          timeline: string | null
          updated_at: string
          version_name: string | null
          wall_height: string | null
        }
        Insert: {
          building_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          detailed_breakdown?: Json | null
          dimensions?: string | null
          estimated_price?: number
          id?: string
          is_auto_generated?: boolean
          is_written_estimate?: boolean | null
          lead_id: string
          lead_name: string
          notes?: string | null
          scope?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          version_name?: string | null
          wall_height?: string | null
        }
        Update: {
          building_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          detailed_breakdown?: Json | null
          dimensions?: string | null
          estimated_price?: number
          id?: string
          is_auto_generated?: boolean
          is_written_estimate?: boolean | null
          lead_id?: string
          lead_name?: string
          notes?: string | null
          scope?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          version_name?: string | null
          wall_height?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          project_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          project_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          project_id?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          bot_long_answer: string | null
          bot_short_answer: string
          category: string
          created_at: string | null
          escalation_hint: string | null
          feedback_helpful: number | null
          feedback_not_helpful: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          question: string
          related_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          bot_long_answer?: string | null
          bot_short_answer: string
          category: string
          created_at?: string | null
          escalation_hint?: string | null
          feedback_helpful?: number | null
          feedback_not_helpful?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question: string
          related_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bot_long_answer?: string | null
          bot_short_answer?: string
          category?: string
          created_at?: string | null
          escalation_hint?: string | null
          feedback_helpful?: number | null
          feedback_not_helpful?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question?: string
          related_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gantt_view_settings: {
        Row: {
          created_at: string
          filter_resources: string[] | null
          filter_status: string[] | null
          group_by: string | null
          id: string
          project_id: string | null
          show_baselines: boolean | null
          show_critical_path: boolean | null
          show_dependencies: boolean | null
          show_milestones: boolean | null
          show_progress: boolean | null
          updated_at: string
          user_id: string
          zoom_level: string | null
        }
        Insert: {
          created_at?: string
          filter_resources?: string[] | null
          filter_status?: string[] | null
          group_by?: string | null
          id?: string
          project_id?: string | null
          show_baselines?: boolean | null
          show_critical_path?: boolean | null
          show_dependencies?: boolean | null
          show_milestones?: boolean | null
          show_progress?: boolean | null
          updated_at?: string
          user_id: string
          zoom_level?: string | null
        }
        Update: {
          created_at?: string
          filter_resources?: string[] | null
          filter_status?: string[] | null
          group_by?: string | null
          id?: string
          project_id?: string | null
          show_baselines?: boolean | null
          show_critical_path?: boolean | null
          show_dependencies?: boolean | null
          show_milestones?: boolean | null
          show_progress?: boolean | null
          updated_at?: string
          user_id?: string
          zoom_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gantt_view_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_view_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      global_exceptions: {
        Row: {
          created_at: string
          created_by: string | null
          delay_days: number
          exception_date: string
          exception_type: string
          id: string
          reason: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delay_days?: number
          exception_date: string
          exception_type?: string
          id?: string
          reason: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delay_days?: number
          exception_date?: string
          exception_type?: string
          id?: string
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          is_working_day: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          is_working_day?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          is_working_day?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_id: string
          customer_name: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          job_type: string | null
          notes: string | null
          paid_date: string | null
          project_id: string | null
          project_name: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          customer_name: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          job_type?: string | null
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          project_name?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          customer_name?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          job_type?: string | null
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          project_name?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_elements: {
        Row: {
          created_at: string | null
          element_type: string
          id: string
          layout_id: string | null
          position_data: Json
          properties: Json | null
        }
        Insert: {
          created_at?: string | null
          element_type: string
          id?: string
          layout_id?: string | null
          position_data: Json
          properties?: Json | null
        }
        Update: {
          created_at?: string | null
          element_type?: string
          id?: string
          layout_id?: string | null
          position_data?: Json
          properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "layout_elements_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "building_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          scheduled_for: string | null
          subject: string | null
          team_member_id: string | null
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_for?: string | null
          subject?: string | null
          team_member_id?: string | null
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_for?: string | null
          subject?: string | null
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_cadences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          intervals_days: number[]
          is_active: boolean | null
          max_touches: number | null
          name: Database["public"]["Enums"]["cadence_name_enum"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          intervals_days: number[]
          is_active?: boolean | null
          max_touches?: number | null
          name: Database["public"]["Enums"]["cadence_name_enum"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          intervals_days?: number[]
          is_active?: boolean | null
          max_touches?: number | null
          name?: Database["public"]["Enums"]["cadence_name_enum"]
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_documents: {
        Row: {
          created_at: string
          customer_facing: boolean | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          lead_id: string
          notes: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          voice_note: string | null
        }
        Insert: {
          created_at?: string
          customer_facing?: boolean | null
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          lead_id: string
          notes?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          voice_note?: string | null
        }
        Update: {
          created_at?: string
          customer_facing?: boolean | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          lead_id?: string
          notes?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          voice_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_up_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string
          id: string
          is_automated: boolean | null
          lead_id: string
          notes: string | null
          task_type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          is_automated?: boolean | null
          lead_id: string
          notes?: string | null
          task_type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          is_automated?: boolean | null
          lead_id?: string
          notes?: string | null
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_up_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_up_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_up_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notifications: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          message: string
          notification_type: string
          read_at: string | null
          team_member_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          message: string
          notification_type?: string
          read_at?: string | null
          team_member_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string
          notification_type?: string
          read_at?: string | null
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notifications_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notifications_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stage_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          from_stage: Database["public"]["Enums"]["lead_stage"] | null
          id: string
          lead_id: string
          notes: string | null
          to_stage: Database["public"]["Enums"]["lead_stage"]
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["lead_stage"] | null
          id?: string
          lead_id: string
          notes?: string | null
          to_stage: Database["public"]["Enums"]["lead_stage"]
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["lead_stage"] | null
          id?: string
          lead_id?: string
          notes?: string | null
          to_stage?: Database["public"]["Enums"]["lead_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          additional_options: Json | null
          additional_project_notes: string | null
          address: string | null
          archived_at: string | null
          assigned_date: string | null
          assigned_to: string | null
          barndominium_features: Json | null
          barndominium_files: Json | null
          barndominium_vision: string | null
          best_contact_time: string | null
          building_features: Json | null
          building_length: string | null
          building_specifications: Json | null
          building_type: string | null
          building_width: string | null
          cadence_name: Database["public"]["Enums"]["cadence_name_enum"] | null
          city: string | null
          company: string | null
          converted_to_customer_id: string | null
          county: string | null
          created_at: string
          customer_decision_by: string | null
          deals_active: boolean | null
          doors: Json | null
          doors_windows_notes: string | null
          email: string | null
          entry_doors_count: string | null
          estimated_value: number | null
          first_contact_date: string | null
          first_name: string
          grid_number: string | null
          has_acquired_land: string | null
          has_plans: string | null
          id: string
          interior_finishing_options: Json | null
          is_barndominium: string | null
          jurisdiction_name: string | null
          last_contact_date: string | null
          last_name: string
          lean_to_notes: string | null
          lean_to_options: Json | null
          lost_notes: string | null
          lost_reason: Database["public"]["Enums"]["lost_reason_enum"] | null
          map_number: string | null
          next_action_due_date: string | null
          next_follow_up: string | null
          notes: string | null
          notification_sent: boolean | null
          other_options_notes: string | null
          overhead_doors_count: string | null
          parcel_id: string | null
          parcel_lookup_timestamp: string | null
          parcel_number: string | null
          phone: string | null
          pipeline_probability: number | null
          preferred_communication_method: string | null
          priority: string | null
          project_start_timeframe: string | null
          quote_date: string | null
          quote_valid_until: string | null
          site_needs: Json | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"] | null
          stage_entered_date: string | null
          state: string | null
          status: string | null
          sub_status: Database["public"]["Enums"]["lead_sub_status"] | null
          timeline: Database["public"]["Enums"]["timeline_enum"] | null
          updated_at: string
          uploaded_files: Json | null
          wall_height: string | null
          wants_interior_finished: string | null
          wants_lean_to: string | null
          windows_count: string | null
          zip: string | null
        }
        Insert: {
          additional_options?: Json | null
          additional_project_notes?: string | null
          address?: string | null
          archived_at?: string | null
          assigned_date?: string | null
          assigned_to?: string | null
          barndominium_features?: Json | null
          barndominium_files?: Json | null
          barndominium_vision?: string | null
          best_contact_time?: string | null
          building_features?: Json | null
          building_length?: string | null
          building_specifications?: Json | null
          building_type?: string | null
          building_width?: string | null
          cadence_name?: Database["public"]["Enums"]["cadence_name_enum"] | null
          city?: string | null
          company?: string | null
          converted_to_customer_id?: string | null
          county?: string | null
          created_at?: string
          customer_decision_by?: string | null
          deals_active?: boolean | null
          doors?: Json | null
          doors_windows_notes?: string | null
          email?: string | null
          entry_doors_count?: string | null
          estimated_value?: number | null
          first_contact_date?: string | null
          first_name: string
          grid_number?: string | null
          has_acquired_land?: string | null
          has_plans?: string | null
          id?: string
          interior_finishing_options?: Json | null
          is_barndominium?: string | null
          jurisdiction_name?: string | null
          last_contact_date?: string | null
          last_name: string
          lean_to_notes?: string | null
          lean_to_options?: Json | null
          lost_notes?: string | null
          lost_reason?: Database["public"]["Enums"]["lost_reason_enum"] | null
          map_number?: string | null
          next_action_due_date?: string | null
          next_follow_up?: string | null
          notes?: string | null
          notification_sent?: boolean | null
          other_options_notes?: string | null
          overhead_doors_count?: string | null
          parcel_id?: string | null
          parcel_lookup_timestamp?: string | null
          parcel_number?: string | null
          phone?: string | null
          pipeline_probability?: number | null
          preferred_communication_method?: string | null
          priority?: string | null
          project_start_timeframe?: string | null
          quote_date?: string | null
          quote_valid_until?: string | null
          site_needs?: Json | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          stage_entered_date?: string | null
          state?: string | null
          status?: string | null
          sub_status?: Database["public"]["Enums"]["lead_sub_status"] | null
          timeline?: Database["public"]["Enums"]["timeline_enum"] | null
          updated_at?: string
          uploaded_files?: Json | null
          wall_height?: string | null
          wants_interior_finished?: string | null
          wants_lean_to?: string | null
          windows_count?: string | null
          zip?: string | null
        }
        Update: {
          additional_options?: Json | null
          additional_project_notes?: string | null
          address?: string | null
          archived_at?: string | null
          assigned_date?: string | null
          assigned_to?: string | null
          barndominium_features?: Json | null
          barndominium_files?: Json | null
          barndominium_vision?: string | null
          best_contact_time?: string | null
          building_features?: Json | null
          building_length?: string | null
          building_specifications?: Json | null
          building_type?: string | null
          building_width?: string | null
          cadence_name?: Database["public"]["Enums"]["cadence_name_enum"] | null
          city?: string | null
          company?: string | null
          converted_to_customer_id?: string | null
          county?: string | null
          created_at?: string
          customer_decision_by?: string | null
          deals_active?: boolean | null
          doors?: Json | null
          doors_windows_notes?: string | null
          email?: string | null
          entry_doors_count?: string | null
          estimated_value?: number | null
          first_contact_date?: string | null
          first_name?: string
          grid_number?: string | null
          has_acquired_land?: string | null
          has_plans?: string | null
          id?: string
          interior_finishing_options?: Json | null
          is_barndominium?: string | null
          jurisdiction_name?: string | null
          last_contact_date?: string | null
          last_name?: string
          lean_to_notes?: string | null
          lean_to_options?: Json | null
          lost_notes?: string | null
          lost_reason?: Database["public"]["Enums"]["lost_reason_enum"] | null
          map_number?: string | null
          next_action_due_date?: string | null
          next_follow_up?: string | null
          notes?: string | null
          notification_sent?: boolean | null
          other_options_notes?: string | null
          overhead_doors_count?: string | null
          parcel_id?: string | null
          parcel_lookup_timestamp?: string | null
          parcel_number?: string | null
          phone?: string | null
          pipeline_probability?: number | null
          preferred_communication_method?: string | null
          priority?: string | null
          project_start_timeframe?: string | null
          quote_date?: string | null
          quote_valid_until?: string | null
          site_needs?: Json | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          stage_entered_date?: string | null
          state?: string | null
          status?: string | null
          sub_status?: Database["public"]["Enums"]["lead_sub_status"] | null
          timeline?: Database["public"]["Enums"]["timeline_enum"] | null
          updated_at?: string
          uploaded_files?: Json | null
          wall_height?: string | null
          wants_interior_finished?: string | null
          wants_lean_to?: string | null
          windows_count?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_to_customer_id_fkey"
            columns: ["converted_to_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      master_pricing_items: {
        Row: {
          approval_status: string | null
          approved_by_user_id: string | null
          base_cost: number | null
          category: string
          created_by_user_id: string | null
          dedupe_key: string | null
          dimensions: string | null
          effective_date: string | null
          id: string
          is_active: boolean | null
          item_name: string
          lead_time_days: number
          markup_pct: number | null
          model: string | null
          region: string | null
          sell_price: number | null
          sku: string | null
          spec: string | null
          subcategory: string | null
          tax_class: string | null
          uom: string
          updated_at: string | null
          vendor: string | null
          warranty: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_by_user_id?: string | null
          base_cost?: number | null
          category: string
          created_by_user_id?: string | null
          dedupe_key?: string | null
          dimensions?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name: string
          lead_time_days: number
          markup_pct?: number | null
          model?: string | null
          region?: string | null
          sell_price?: number | null
          sku?: string | null
          spec?: string | null
          subcategory?: string | null
          tax_class?: string | null
          uom: string
          updated_at?: string | null
          vendor?: string | null
          warranty?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_by_user_id?: string | null
          base_cost?: number | null
          category?: string
          created_by_user_id?: string | null
          dedupe_key?: string | null
          dimensions?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          lead_time_days?: number
          markup_pct?: number | null
          model?: string | null
          region?: string | null
          sell_price?: number | null
          sku?: string | null
          spec?: string | null
          subcategory?: string | null
          tax_class?: string | null
          uom?: string
          updated_at?: string | null
          vendor?: string | null
          warranty?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          is_customer_facing: boolean
          message_type: string
          parent_message_id: string | null
          project_id: string
          read_by: Json | null
          sender_id: string
          sender_name: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_customer_facing?: boolean
          message_type?: string
          parent_message_id?: string | null
          project_id: string
          read_by?: Json | null
          sender_id: string
          sender_name: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_customer_facing?: boolean
          message_type?: string
          parent_message_id?: string | null
          project_id?: string
          read_by?: Json | null
          sender_id?: string
          sender_name?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          sent_via: string
          subject: string
          to_profile_id: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          sent_via?: string
          subject: string
          to_profile_id: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          sent_via?: string
          subject?: string
          to_profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          created_at: string
          days_overdue: number | null
          email_sent: boolean | null
          id: string
          invoice_id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          created_at?: string
          days_overdue?: number | null
          email_sent?: boolean | null
          id?: string
          invoice_id: string
          reminder_type?: string
          sent_at?: string
        }
        Update: {
          created_at?: string
          days_overdue?: number | null
          email_sent?: boolean | null
          id?: string
          invoice_id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedule_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          schedule_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          schedule_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          schedule_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      permit_applications: {
        Row: {
          application_date: string | null
          approval_date: string | null
          created_at: string | null
          created_by: string | null
          estimated_fee: number | null
          id: string
          jurisdiction_id: string
          notes: string | null
          permit_number: string | null
          project_id: string | null
          project_type: string
          square_footage: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          application_date?: string | null
          approval_date?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_fee?: number | null
          id?: string
          jurisdiction_id: string
          notes?: string | null
          permit_number?: string | null
          project_id?: string | null
          project_type: string
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          application_date?: string | null
          approval_date?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_fee?: number | null
          id?: string
          jurisdiction_id?: string
          notes?: string | null
          permit_number?: string | null
          project_id?: string | null
          project_type?: string
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_applications_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "permit_jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_jurisdictions: {
        Row: {
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          portal_url: string | null
          project_types: Json
          updated_at: string | null
        }
        Insert: {
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          portal_url?: string | null
          project_types?: Json
          updated_at?: string | null
        }
        Update: {
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          portal_url?: string | null
          project_types?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      permit_tasks: {
        Row: {
          application_id: string
          assigned_to: string | null
          completion_date: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          status: string | null
          task_name: string
          task_order: number | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          task_name: string
          task_order?: number | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          task_name?: string
          task_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "permit_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_addon_items: {
        Row: {
          addon_package_id: string
          color: string | null
          created_at: string
          customer_notes: string | null
          description: string | null
          duration_days: number
          id: string
          internal_notes: string | null
          name: string
          priority: string | null
          sort_order: number | null
        }
        Insert: {
          addon_package_id: string
          color?: string | null
          created_at?: string
          customer_notes?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          internal_notes?: string | null
          name: string
          priority?: string | null
          sort_order?: number | null
        }
        Update: {
          addon_package_id?: string
          color?: string | null
          created_at?: string
          customer_notes?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          internal_notes?: string | null
          name?: string
          priority?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_addon_items_addon_package_id_fkey"
            columns: ["addon_package_id"]
            isOneToOne: false
            referencedRelation: "phase_addon_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_addon_packages: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      phase_dependencies: {
        Row: {
          created_at: string
          id: string
          lag_days: number
          predecessor_phase_id: string
          project_id: string
          successor_phase_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lag_days?: number
          predecessor_phase_id: string
          project_id: string
          successor_phase_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lag_days?: number
          predecessor_phase_id?: string
          project_id?: string
          successor_phase_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_dependencies_predecessor_phase_id_fkey"
            columns: ["predecessor_phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_dependencies_successor_phase_id_fkey"
            columns: ["successor_phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_template_items: {
        Row: {
          created_at: string
          default_color: string | null
          default_duration_days: number
          id: string
          lag_days: number
          name: string
          predecessor_item_id: string | null
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_color?: string | null
          default_duration_days?: number
          id?: string
          lag_days?: number
          name: string
          predecessor_item_id?: string | null
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_color?: string | null
          default_duration_days?: number
          id?: string
          lag_days?: number
          name?: string
          predecessor_item_id?: string | null
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_template_items_predecessor_item_id_fkey"
            columns: ["predecessor_item_id"]
            isOneToOne: false
            referencedRelation: "phase_template_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_template_items_new: {
        Row: {
          created_at: string
          default_duration_days: number
          id: string
          lag_days: number
          name: string
          predecessor_item_id: string | null
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_duration_days?: number
          id?: string
          lag_days?: number
          name: string
          predecessor_item_id?: string | null
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_duration_days?: number
          id?: string
          lag_days?: number
          name?: string
          predecessor_item_id?: string | null
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_template_items_new_predecessor_item_id_fkey"
            columns: ["predecessor_item_id"]
            isOneToOne: false
            referencedRelation: "phase_template_items_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_template_items_new_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates_new"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      phase_templates_new: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      phases_new: {
        Row: {
          actual_finish: string | null
          actual_start: string | null
          created_at: string
          dependency_phase_id: string | null
          id: string
          name: string
          planned_finish: string | null
          planned_start: string | null
          project_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          actual_finish?: string | null
          actual_start?: string | null
          created_at?: string
          dependency_phase_id?: string | null
          id?: string
          name: string
          planned_finish?: string | null
          planned_start?: string | null
          project_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          actual_finish?: string | null
          actual_start?: string | null
          created_at?: string
          dependency_phase_id?: string | null
          id?: string
          name?: string
          planned_finish?: string | null
          planned_start?: string | null
          project_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_new_dependency_phase_id_fkey"
            columns: ["dependency_phase_id"]
            isOneToOne: false
            referencedRelation: "phases_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phases_new_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
        ]
      }
      price_request_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string
          price_request_id: string
          recipient_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type: string
          price_request_id: string
          recipient_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          price_request_id?: string
          recipient_user_id?: string | null
        }
        Relationships: []
      }
      price_requests: {
        Row: {
          assigned_estimator_id: string | null
          attachments: Json | null
          created_at: string | null
          due_date: string | null
          final_price_file: string | null
          id: string
          lead_id: string | null
          project_id: string | null
          requested_by_user_id: string | null
          scope_summary: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_estimator_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          due_date?: string | null
          final_price_file?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          requested_by_user_id?: string | null
          scope_summary: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_estimator_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          due_date?: string | null
          final_price_file?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          requested_by_user_id?: string | null
          scope_summary?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_requests_assigned_estimator_id_fkey"
            columns: ["assigned_estimator_id"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_requests_assigned_estimator_id_fkey"
            columns: ["assigned_estimator_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_items: {
        Row: {
          base_price: number
          category_id: string
          created_at: string
          description: string | null
          formula_params: Json | null
          formula_type: string | null
          has_formula: boolean | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          unit_type: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category_id: string
          created_at?: string
          description?: string | null
          formula_params?: Json | null
          formula_type?: string | null
          has_formula?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          unit_type?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string
          created_at?: string
          description?: string | null
          formula_params?: Json | null
          formula_type?: string | null
          has_formula?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          unit_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pricing_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_lines: {
        Row: {
          created_at: string | null
          extended_price: number | null
          id: string
          item_label: string
          lead_time_days: number
          markup_pct: number | null
          master_item_id: string | null
          notes: string | null
          price_request_id: string | null
          qty: number | null
          unit_cost: number | null
          unit_price: number | null
          uom: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extended_price?: number | null
          id?: string
          item_label: string
          lead_time_days: number
          markup_pct?: number | null
          master_item_id?: string | null
          notes?: string | null
          price_request_id?: string | null
          qty?: number | null
          unit_cost?: number | null
          unit_price?: number | null
          uom: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extended_price?: number | null
          id?: string
          item_label?: string
          lead_time_days?: number
          markup_pct?: number | null
          master_item_id?: string | null
          notes?: string | null
          price_request_id?: string | null
          qty?: number | null
          unit_cost?: number | null
          unit_price?: number | null
          uom?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_lines_master_item_id_fkey"
            columns: ["master_item_id"]
            isOneToOne: false
            referencedRelation: "master_pricing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_lines_price_request_id_fkey"
            columns: ["price_request_id"]
            isOneToOne: false
            referencedRelation: "price_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      project_addon_selections: {
        Row: {
          addon_package_id: string
          applied_at: string
          id: string
          project_id: string
        }
        Insert: {
          addon_package_id: string
          applied_at?: string
          id?: string
          project_id: string
        }
        Update: {
          addon_package_id?: string
          applied_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_addon_selections_addon_package_id_fkey"
            columns: ["addon_package_id"]
            isOneToOne: false
            referencedRelation: "phase_addon_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_addon_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_baselines: {
        Row: {
          baseline_data: Json
          baseline_date: string
          baseline_name: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          project_id: string
          updated_at: string
        }
        Insert: {
          baseline_data?: Json
          baseline_date?: string
          baseline_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          updated_at?: string
        }
        Update: {
          baseline_data?: Json
          baseline_date?: string
          baseline_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_baselines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          additional_cogs: number | null
          building_crew: number | null
          concrete: number | null
          created_at: string | null
          doors_windows: number | null
          drywall: number | null
          drywall_sub: number | null
          electric: number | null
          equipment: number | null
          fixtures: number | null
          flooring: number | null
          garage_doors: number | null
          hvac: number | null
          id: string
          lumber: number | null
          materials: number | null
          metal: number | null
          miscellaneous: number | null
          paint: number | null
          painter: number | null
          permits: number | null
          plumbing: number | null
          project_id: string
          trim: number | null
          updated_at: string | null
        }
        Insert: {
          additional_cogs?: number | null
          building_crew?: number | null
          concrete?: number | null
          created_at?: string | null
          doors_windows?: number | null
          drywall?: number | null
          drywall_sub?: number | null
          electric?: number | null
          equipment?: number | null
          fixtures?: number | null
          flooring?: number | null
          garage_doors?: number | null
          hvac?: number | null
          id?: string
          lumber?: number | null
          materials?: number | null
          metal?: number | null
          miscellaneous?: number | null
          paint?: number | null
          painter?: number | null
          permits?: number | null
          plumbing?: number | null
          project_id: string
          trim?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_cogs?: number | null
          building_crew?: number | null
          concrete?: number | null
          created_at?: string | null
          doors_windows?: number | null
          drywall?: number | null
          drywall_sub?: number | null
          electric?: number | null
          equipment?: number | null
          fixtures?: number | null
          flooring?: number | null
          garage_doors?: number | null
          hvac?: number | null
          id?: string
          lumber?: number | null
          materials?: number | null
          metal?: number | null
          miscellaneous?: number | null
          paint?: number | null
          painter?: number | null
          permits?: number | null
          plumbing?: number | null
          project_id?: string
          trim?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string
          customer_facing: boolean | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          project_id: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          voice_note: string | null
        }
        Insert: {
          created_at?: string
          customer_facing?: boolean | null
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          notes?: string | null
          project_id?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          voice_note?: string | null
        }
        Update: {
          created_at?: string
          customer_facing?: boolean | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          voice_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_exceptions: {
        Row: {
          applied_at: string
          created_at: string
          delay_applied_days: number
          global_exception_id: string
          id: string
          phases_affected: Json
          project_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          delay_applied_days?: number
          global_exception_id: string
          id?: string
          phases_affected?: Json
          project_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          delay_applied_days?: number
          global_exception_id?: string
          id?: string
          phases_affected?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_exceptions_global"
            columns: ["global_exception_id"]
            isOneToOne: false
            referencedRelation: "global_exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_exceptions_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          actual_date: string | null
          color: string | null
          completed_date: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          is_automated: boolean | null
          is_completed: boolean | null
          is_critical: boolean | null
          milestone_name: string
          milestone_type: string | null
          notification_sent: boolean | null
          project_id: string
          target_date: string | null
          trigger_phase: string | null
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          color?: string | null
          completed_date?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          is_automated?: boolean | null
          is_completed?: boolean | null
          is_critical?: boolean | null
          milestone_name: string
          milestone_type?: string | null
          notification_sent?: boolean | null
          project_id: string
          target_date?: string | null
          trigger_phase?: string | null
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          color?: string | null
          completed_date?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          is_automated?: boolean | null
          is_completed?: boolean | null
          is_critical?: boolean | null
          milestone_name?: string
          milestone_type?: string | null
          notification_sent?: boolean | null
          project_id?: string
          target_date?: string | null
          trigger_phase?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          assignee_team_member_id: string | null
          baseline_duration_days: number | null
          baseline_end_date: string | null
          baseline_start_date: string | null
          color: string | null
          completion_percentage: number | null
          created_at: string
          created_by: string | null
          customer_notes: string | null
          duration_days: number
          effort_hours: number | null
          end_date: string | null
          id: string
          internal_notes: string | null
          is_critical_path: boolean | null
          name: string
          priority: string | null
          project_id: string
          publish_to_customer: boolean
          resource_id: string | null
          start_date: string | null
          status: string
          template_item_id: string | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          assignee_team_member_id?: string | null
          baseline_duration_days?: number | null
          baseline_end_date?: string | null
          baseline_start_date?: string | null
          color?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          customer_notes?: string | null
          duration_days?: number
          effort_hours?: number | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          is_critical_path?: boolean | null
          name: string
          priority?: string | null
          project_id: string
          publish_to_customer?: boolean
          resource_id?: string | null
          start_date?: string | null
          status?: string
          template_item_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          assignee_team_member_id?: string | null
          baseline_duration_days?: number | null
          baseline_end_date?: string | null
          baseline_start_date?: string | null
          color?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          customer_notes?: string | null
          duration_days?: number
          effort_hours?: number | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          is_critical_path?: boolean | null
          name?: string
          priority?: string | null
          project_id?: string
          publish_to_customer?: boolean
          resource_id?: string | null
          start_date?: string | null
          status?: string
          template_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_assignee_team_member_id_fkey"
            columns: ["assignee_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_assignee_team_member_id_fkey"
            columns: ["assignee_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "phase_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          category: string | null
          created_at: string
          customer_visible: boolean | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_before_after: boolean | null
          location_data: Json | null
          phase_name: string | null
          project_id: string
          related_photo_id: string | null
          tags: string[] | null
          updated_at: string
          uploaded_by: string
          uploader_type: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          customer_visible?: boolean | null
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_before_after?: boolean | null
          location_data?: Json | null
          phase_name?: string | null
          project_id: string
          related_photo_id?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
          uploader_type?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          customer_visible?: boolean | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_before_after?: boolean | null
          location_data?: Json | null
          phase_name?: string | null
          project_id?: string
          related_photo_id?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
          uploader_type?: string
        }
        Relationships: []
      }
      project_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          project_start_date: string
          schedule_data: Json
          total_duration_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          project_start_date: string
          schedule_data?: Json
          total_duration_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          project_start_date?: string
          schedule_data?: Json
          total_duration_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tab_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          parent_tab: string | null
          project_id: string
          sort_order: number | null
          tab_name: string
          tab_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          parent_tab?: string | null
          project_id: string
          sort_order?: number | null
          tab_name: string
          tab_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          parent_tab?: string | null
          project_id?: string
          sort_order?: number | null
          tab_name?: string
          tab_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_type_configs: {
        Row: {
          base_template_id: string | null
          created_at: string
          default_addon_ids: string[] | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          payment_schedule_template_id: string | null
          updated_at: string
        }
        Insert: {
          base_template_id?: string | null
          created_at?: string
          default_addon_ids?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          payment_schedule_template_id?: string | null
          updated_at?: string
        }
        Update: {
          base_template_id?: string | null
          created_at?: string
          default_addon_ids?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          payment_schedule_template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_type_configs_base_template_id_fkey"
            columns: ["base_template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_type_configs_payment_schedule_template_id_fkey"
            columns: ["payment_schedule_template_id"]
            isOneToOne: false
            referencedRelation: "payment_schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_profit: number | null
          address: string | null
          budget: number | null
          building_type: string | null
          cancelled_date: string | null
          city: string | null
          completion_date: string | null
          county: string | null
          cover_photo_url: string | null
          created_at: string | null
          customer_id: string
          customer_name: string
          customer_portal_enabled: boolean | null
          description: string | null
          end_date: string | null
          estimated_completion: string
          estimated_profit: number | null
          id: string
          is_cancelled: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          permit_approved_at: string | null
          phase: string | null
          progress: number | null
          project_type_config_id: string | null
          square_footage: number | null
          start_date: string
          state: string | null
          status: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          actual_profit?: number | null
          address?: string | null
          budget?: number | null
          building_type?: string | null
          cancelled_date?: string | null
          city?: string | null
          completion_date?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          customer_id: string
          customer_name: string
          customer_portal_enabled?: boolean | null
          description?: string | null
          end_date?: string | null
          estimated_completion: string
          estimated_profit?: number | null
          id?: string
          is_cancelled?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          permit_approved_at?: string | null
          phase?: string | null
          progress?: number | null
          project_type_config_id?: string | null
          square_footage?: number | null
          start_date: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          actual_profit?: number | null
          address?: string | null
          budget?: number | null
          building_type?: string | null
          cancelled_date?: string | null
          city?: string | null
          completion_date?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          customer_id?: string
          customer_name?: string
          customer_portal_enabled?: boolean | null
          description?: string | null
          end_date?: string | null
          estimated_completion?: string
          estimated_profit?: number | null
          id?: string
          is_cancelled?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          permit_approved_at?: string | null
          phase?: string | null
          progress?: number | null
          project_type_config_id?: string | null
          square_footage?: number | null
          start_date?: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_type_config_id_fkey"
            columns: ["project_type_config_id"]
            isOneToOne: false
            referencedRelation: "project_type_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_new: {
        Row: {
          building_type: string | null
          city: string | null
          code: string
          created_at: string
          finish_target: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          pm_user_id: string | null
          size_sqft: number | null
          start_target: string | null
          state: string | null
          status: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          building_type?: string | null
          city?: string | null
          code: string
          created_at?: string
          finish_target?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          pm_user_id?: string | null
          size_sqft?: number | null
          start_target?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          building_type?: string | null
          city?: string | null
          code?: string
          created_at?: string
          finish_target?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          pm_user_id?: string | null
          size_sqft?: number | null
          start_target?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_new_pm_user_id_fkey"
            columns: ["pm_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      punchlist_analytics: {
        Row: {
          analytics_date: string
          avg_completion_time_hours: number | null
          completed_items: number
          completion_rate: number
          created_at: string
          id: string
          items_by_priority: Json
          items_by_status: Json
          overdue_items: number
          project_id: string
          total_items: number
          trend_data: Json
          updated_at: string
        }
        Insert: {
          analytics_date?: string
          avg_completion_time_hours?: number | null
          completed_items?: number
          completion_rate?: number
          created_at?: string
          id?: string
          items_by_priority?: Json
          items_by_status?: Json
          overdue_items?: number
          project_id: string
          total_items?: number
          trend_data?: Json
          updated_at?: string
        }
        Update: {
          analytics_date?: string
          avg_completion_time_hours?: number | null
          completed_items?: number
          completion_rate?: number
          created_at?: string
          id?: string
          items_by_priority?: Json
          items_by_status?: Json
          overdue_items?: number
          project_id?: string
          total_items?: number
          trend_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      punchlist_comments: {
        Row: {
          author_id: string
          author_name: string
          comment_text: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          punchlist_item_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          comment_text: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          punchlist_item_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          comment_text?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          punchlist_item_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "punchlist_comments_punchlist_item_id_fkey"
            columns: ["punchlist_item_id"]
            isOneToOne: false
            referencedRelation: "punchlist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      punchlist_exports: {
        Row: {
          created_at: string
          created_by: string | null
          export_type: string
          file_url: string | null
          filters_applied: Json | null
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_url?: string | null
          filters_applied?: Json | null
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_url?: string | null
          filters_applied?: Json | null
          id?: string
          project_id?: string
        }
        Relationships: []
      }
      punchlist_items: {
        Row: {
          after_photos: Json | null
          assigned_to_user_id: string | null
          assigned_to_vendor: string | null
          before_photos: Json | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          created_via_mobile: boolean | null
          description: string
          due_date: string | null
          gps_coordinates: Json | null
          id: string
          last_comment_at: string | null
          location: string
          offline_created: boolean | null
          overdue_notification_sent: boolean | null
          photo_url: string | null
          photos: Json | null
          priority: string
          project_id: string
          source: string
          status: string
          sync_status: string | null
          updated_at: string
          voice_note_url: string | null
        }
        Insert: {
          after_photos?: Json | null
          assigned_to_user_id?: string | null
          assigned_to_vendor?: string | null
          before_photos?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          created_via_mobile?: boolean | null
          description: string
          due_date?: string | null
          gps_coordinates?: Json | null
          id?: string
          last_comment_at?: string | null
          location: string
          offline_created?: boolean | null
          overdue_notification_sent?: boolean | null
          photo_url?: string | null
          photos?: Json | null
          priority?: string
          project_id: string
          source?: string
          status?: string
          sync_status?: string | null
          updated_at?: string
          voice_note_url?: string | null
        }
        Update: {
          after_photos?: Json | null
          assigned_to_user_id?: string | null
          assigned_to_vendor?: string | null
          before_photos?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          created_via_mobile?: boolean | null
          description?: string
          due_date?: string | null
          gps_coordinates?: Json | null
          id?: string
          last_comment_at?: string | null
          location?: string
          offline_created?: boolean | null
          overdue_notification_sent?: boolean | null
          photo_url?: string | null
          photos?: Json | null
          priority?: string
          project_id?: string
          source?: string
          status?: string
          sync_status?: string | null
          updated_at?: string
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "punchlist_items_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punchlist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      punchlist_notification_settings: {
        Row: {
          created_at: string
          customer_email: string | null
          email_frequency: string
          id: string
          is_active: boolean
          notification_types: Json
          project_id: string
          updated_at: string
          vendor_emails: Json | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          email_frequency?: string
          id?: string
          is_active?: boolean
          notification_types?: Json
          project_id: string
          updated_at?: string
          vendor_emails?: Json | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          email_frequency?: string
          id?: string
          is_active?: boolean
          notification_types?: Json
          project_id?: string
          updated_at?: string
          vendor_emails?: Json | null
        }
        Relationships: []
      }
      punchlist_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          notification_type: string
          project_id: string
          recipient_email: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_type: string
          project_id: string
          recipient_email: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_type?: string
          project_id?: string
          recipient_email?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      punchlist_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          project_id: string | null
          template_items: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          project_id?: string | null
          template_items?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          project_id?: string | null
          template_items?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      punchlist_time_tracking: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          punchlist_item_id: string
          started_at: string | null
          time_spent_minutes: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          punchlist_item_id: string
          started_at?: string | null
          time_spent_minutes?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          punchlist_item_id?: string
          started_at?: string | null
          time_spent_minutes?: number | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          attachments: Json | null
          body: string | null
          code: string
          created_at: string
          id: string
          object_alias: string | null
          project_id: string | null
          rfq_id: string | null
          status: string
          subject: string
          subtotal: number | null
          target_delivery: string | null
          tax: number | null
          total: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          actual_delivery?: string | null
          attachments?: Json | null
          body?: string | null
          code: string
          created_at?: string
          id?: string
          object_alias?: string | null
          project_id?: string | null
          rfq_id?: string | null
          status?: string
          subject: string
          subtotal?: number | null
          target_delivery?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          actual_delivery?: string | null
          attachments?: Json | null
          body?: string | null
          code?: string
          created_at?: string
          id?: string
          object_alias?: string | null
          project_id?: string | null
          rfq_id?: string | null
          status?: string
          subject?: string
          subtotal?: number | null
          target_delivery?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_estimate_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      quick_estimates: {
        Row: {
          breakdown_data: Json | null
          build_type: string
          created_at: string | null
          created_by: string | null
          estimated_high: number
          estimated_low: number
          id: string
          include_site_utilities: boolean | null
          lead_id: string | null
          lead_name: string
          living_sqft: number
          shop_sqft: number | null
          stories: string | null
        }
        Insert: {
          breakdown_data?: Json | null
          build_type: string
          created_at?: string | null
          created_by?: string | null
          estimated_high: number
          estimated_low: number
          id?: string
          include_site_utilities?: boolean | null
          lead_id?: string | null
          lead_name: string
          living_sqft: number
          shop_sqft?: number | null
          stories?: string | null
        }
        Update: {
          breakdown_data?: Json | null
          build_type?: string
          created_at?: string | null
          created_by?: string | null
          estimated_high?: number
          estimated_low?: number
          id?: string
          include_site_utilities?: boolean | null
          lead_id?: string | null
          lead_name?: string
          living_sqft?: number
          shop_sqft?: number | null
          stories?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_blackouts: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string | null
          resource_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          resource_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          resource_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_blackouts_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          capacity_per_day: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          team_member_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          capacity_per_day?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          team_member_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          capacity_per_day?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          team_member_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          attachments: Json | null
          body: string | null
          code: string
          created_at: string
          due_date: string | null
          id: string
          object_alias: string | null
          project_id: string | null
          quote_amount: number | null
          quote_notes: string | null
          status: string
          subject: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          attachments?: Json | null
          body?: string | null
          code: string
          created_at?: string
          due_date?: string | null
          id?: string
          object_alias?: string | null
          project_id?: string | null
          quote_amount?: number | null
          quote_notes?: string | null
          status?: string
          subject: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string | null
          code?: string
          created_at?: string
          due_date?: string | null
          id?: string
          object_alias?: string | null
          project_id?: string | null
          quote_amount?: number | null
          quote_notes?: string | null
          status?: string
          subject?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_requests: {
        Row: {
          body: string | null
          code: string
          confirmed_date: string | null
          created_at: string
          crew_notes: string | null
          id: string
          object_alias: string | null
          project_id: string | null
          status: string
          subject: string
          updated_at: string
          vendor_id: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          body?: string | null
          code: string
          confirmed_date?: string | null
          created_at?: string
          crew_notes?: string | null
          id?: string
          object_alias?: string | null
          project_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          vendor_id: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          body?: string | null
          code?: string
          confirmed_date?: string | null
          created_at?: string
          crew_notes?: string | null
          id?: string
          object_alias?: string | null
          project_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
          vendor_id?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      statement_versions: {
        Row: {
          created_at: string
          created_by: string | null
          file_path: string | null
          id: string
          project_id: string
          statement_data: Json
          statement_name: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          project_id: string
          statement_data: Json
          statement_name: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          project_id?: string
          statement_data?: Json
          statement_name?: string
          version_number?: number
        }
        Relationships: []
      }
      sticky_notes: {
        Row: {
          attached_to_id: string | null
          attached_to_type: string | null
          color: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          position_x: number | null
          position_y: number | null
          updated_at: string
        }
        Insert: {
          attached_to_id?: string | null
          attached_to_type?: string | null
          color?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
        }
        Update: {
          attached_to_id?: string | null
          attached_to_type?: string | null
          color?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_user_id: string | null
          created_at: string
          due_date: string | null
          id: string
          phase_id: string | null
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_user_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          phase_id?: string | null
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_user_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          phase_id?: string | null
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          name: string
          password_hash: string | null
          role: string
          roles: string[] | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          password_hash?: string | null
          role?: string
          roles?: string[] | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string | null
          role?: string
          roles?: string[] | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendor_compliance: {
        Row: {
          created_at: string
          expires_on: string | null
          file_url: string | null
          id: string
          notes: string | null
          status: string
          type: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          expires_on?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string
          type: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          expires_on?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_compliance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string | null
          title: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          title?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          title?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_email_templates: {
        Row: {
          body_html_template: string
          body_text_template: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          updated_at: string
        }
        Insert: {
          body_html_template: string
          body_text_template: string
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          updated_at?: string
        }
        Update: {
          body_html_template?: string
          body_text_template?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendor_mail_events: {
        Row: {
          event: string
          id: string
          message_id: string
          meta: Json | null
          occurred_at: string
        }
        Insert: {
          event: string
          id?: string
          message_id: string
          meta?: Json | null
          occurred_at?: string
        }
        Update: {
          event?: string
          id?: string
          message_id?: string
          meta?: Json | null
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_mail_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "vendor_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          created_at: string
          delivered_at: string | null
          direction: string
          from_email: string | null
          id: string
          in_reply_to: string | null
          message_id: string | null
          object_id: string
          object_type: string
          parsed_commands: Json | null
          status: string | null
          subject: string | null
          to_emails: string[] | null
          vendor_id: string
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          delivered_at?: string | null
          direction: string
          from_email?: string | null
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
          object_id: string
          object_type: string
          parsed_commands?: Json | null
          status?: string | null
          subject?: string | null
          to_emails?: string[] | null
          vendor_id: string
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          from_email?: string | null
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
          object_id?: string
          object_type?: string
          parsed_commands?: Json | null
          status?: string | null
          subject?: string | null
          to_emails?: string[] | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_price_items: {
        Row: {
          base_cost: number | null
          category: string
          created_at: string
          effective_date: string | null
          id: string
          is_active: boolean | null
          item_name: string
          lead_time_days: number | null
          notes: string | null
          region: string | null
          sku: string | null
          uom: string
          vendor_id: string
        }
        Insert: {
          base_cost?: number | null
          category: string
          created_at?: string
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name: string
          lead_time_days?: number | null
          notes?: string | null
          region?: string | null
          sku?: string | null
          uom: string
          vendor_id: string
        }
        Update: {
          base_cost?: number | null
          category?: string
          created_at?: string
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          lead_time_days?: number | null
          notes?: string | null
          region?: string | null
          sku?: string | null
          uom?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_price_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors_new: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          email_prefs: Json | null
          id: string
          inbound_alias: string | null
          name: string
          notes: string | null
          phone: string | null
          primary_contact_name: string | null
          primary_email: string | null
          rating: number | null
          regions: string[] | null
          state: string | null
          status: string
          trade: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          email_prefs?: Json | null
          id?: string
          inbound_alias?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          primary_contact_name?: string | null
          primary_email?: string | null
          rating?: number | null
          regions?: string[] | null
          state?: string | null
          status?: string
          trade?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          email_prefs?: Json | null
          id?: string
          inbound_alias?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          primary_contact_name?: string | null
          primary_email?: string | null
          rating?: number | null
          regions?: string[] | null
          state?: string | null
          status?: string
          trade?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      video_calls: {
        Row: {
          builder_id: string | null
          call_description: string | null
          call_title: string
          created_at: string
          created_by: string
          customer_id: string
          duration_minutes: number | null
          id: string
          meeting_url: string | null
          project_id: string
          reminder_sent: boolean | null
          scheduled_for: string
          status: string | null
          updated_at: string
        }
        Insert: {
          builder_id?: string | null
          call_description?: string | null
          call_title: string
          created_at?: string
          created_by: string
          customer_id: string
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          project_id: string
          reminder_sent?: boolean | null
          scheduled_for: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          builder_id?: string | null
          call_description?: string | null
          call_title?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          project_id?: string
          reminder_sent?: boolean | null
          scheduled_for?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      warranty_tickets: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          object_alias: string | null
          po_id: string | null
          priority: string | null
          project_id: string | null
          resolution_notes: string | null
          status: string
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          object_alias?: string | null
          po_id?: string | null
          priority?: string | null
          project_id?: string | null
          resolution_notes?: string | null
          status?: string
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          object_alias?: string | null
          po_id?: string | null
          priority?: string | null
          project_id?: string | null
          resolution_notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_tickets_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_tickets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_new"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_snapshots: {
        Row: {
          captured_at: string
          created_at: string
          forecast_json: Json
          id: string
          notes: string | null
          project_id: string
          risk_flag: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          forecast_json: Json
          id?: string
          notes?: string | null
          project_id: string
          risk_flag?: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          forecast_json?: Json
          id?: string
          notes?: string | null
          project_id?: string
          risk_flag?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_new"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      team_member_auth: {
        Row: {
          auth_status: string | null
          auth_user_id: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          roles: string[] | null
        }
        Insert: {
          auth_status?: never
          auth_user_id?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          roles?: string[] | null
        }
        Update: {
          auth_status?: never
          auth_user_id?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          roles?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_critical_path: {
        Args: { project_id_param: string }
        Returns: Json
      }
      create_project_baseline: {
        Args: { baseline_name_param?: string; project_id_param: string }
        Returns: string
      }
      create_team_member_auth_user: {
        Args: {
          member_email: string
          member_name?: string
          member_password: string
        }
        Returns: string
      }
      days_since_quote: {
        Args: { quote_date: string }
        Returns: number
      }
      generate_vendor_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      upsert_faq: {
        Args: {
          p_bot_long_answer: string
          p_bot_short_answer: string
          p_category: string
          p_escalation_hint?: string
          p_is_active?: boolean
          p_keywords: string[]
          p_question: string
        }
        Returns: string
      }
    }
    Enums: {
      cadence_name_enum:
        | "Quoted-3-touch"
        | "Follow-up-2-3-days"
        | "Decision-weekly"
        | "Budget-monthly"
        | "Customer-quarterly"
      lead_stage:
        | "New"
        | "Working"
        | "Quoted"
        | "Negotiating"
        | "Committed"
        | "Won"
        | "Lost"
      lead_sub_status:
        | "Recently Quoted"
        | "Follow Up"
        | "In Decision Making"
        | "Pending Land/Budget"
        | "Current Customer"
        | "Move to Lost"
        | "Not Qualified"
      lost_reason_enum:
        | "Budget"
        | "Timeline"
        | "Location"
        | "DIY"
        | "Competitor"
        | "No Response"
        | "Other"
      timeline_enum: "0-3 Months" | "3-6 Months" | "6-12 Months" | "12+ Months"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cadence_name_enum: [
        "Quoted-3-touch",
        "Follow-up-2-3-days",
        "Decision-weekly",
        "Budget-monthly",
        "Customer-quarterly",
      ],
      lead_stage: [
        "New",
        "Working",
        "Quoted",
        "Negotiating",
        "Committed",
        "Won",
        "Lost",
      ],
      lead_sub_status: [
        "Recently Quoted",
        "Follow Up",
        "In Decision Making",
        "Pending Land/Budget",
        "Current Customer",
        "Move to Lost",
        "Not Qualified",
      ],
      lost_reason_enum: [
        "Budget",
        "Timeline",
        "Location",
        "DIY",
        "Competitor",
        "No Response",
        "Other",
      ],
      timeline_enum: ["0-3 Months", "3-6 Months", "6-12 Months", "12+ Months"],
    },
  },
} as const
