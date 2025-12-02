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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allowance_summary: {
        Row: {
          allowance_amount: number | null
          category_name: string
          created_at: string | null
          id: string
          over_under_amount: number | null
          project_id: string
          selected_amount: number | null
          updated_at: string | null
        }
        Insert: {
          allowance_amount?: number | null
          category_name: string
          created_at?: string | null
          id?: string
          over_under_amount?: number | null
          project_id: string
          selected_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          allowance_amount?: number | null
          category_name?: string
          created_at?: string | null
          id?: string
          over_under_amount?: number | null
          project_id?: string
          selected_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowance_summary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinet_products: {
        Row: {
          created_at: string | null
          description: string | null
          door_style: string | null
          finish_options: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_tier: string | null
          sort_order: number | null
          style: string | null
          updated_at: string | null
          wood_species: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          door_style?: string | null
          finish_options?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_tier?: string | null
          sort_order?: number | null
          style?: string | null
          updated_at?: string | null
          wood_species?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          door_style?: string | null
          finish_options?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_tier?: string | null
          sort_order?: number | null
          style?: string | null
          updated_at?: string | null
          wood_species?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      design_packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          package_data: Json
          sort_order: number | null
          style_category: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          package_data: Json
          sort_order?: number | null
          style_category?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          package_data?: Json
          sort_order?: number | null
          style_category?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      door_products: {
        Row: {
          color_options: string[] | null
          created_at: string | null
          description: string | null
          door_type: string
          glass_options: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          material: string | null
          name: string
          price_tier: string | null
          sort_order: number | null
          style: string | null
          updated_at: string | null
        }
        Insert: {
          color_options?: string[] | null
          created_at?: string | null
          description?: string | null
          door_type: string
          glass_options?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          name: string
          price_tier?: string | null
          sort_order?: number | null
          style?: string | null
          updated_at?: string | null
        }
        Update: {
          color_options?: string[] | null
          created_at?: string | null
          description?: string | null
          door_type?: string
          glass_options?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          name?: string
          price_tier?: string | null
          sort_order?: number | null
          style?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fixture_products: {
        Row: {
          brand: string | null
          created_at: string | null
          description: string | null
          finish: string | null
          fixture_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          model: string | null
          name: string
          price_tier: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          description?: string | null
          finish?: string | null
          fixture_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          model?: string | null
          name: string
          price_tier?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          description?: string | null
          finish?: string | null
          fixture_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          model?: string | null
          name?: string
          price_tier?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      flooring_products: {
        Row: {
          brand: string | null
          color_family: string | null
          created_at: string | null
          description: string | null
          finish_type: string | null
          id: string
          is_active: boolean | null
          material_type: string | null
          name: string
          price_tier: string | null
          product_line: string | null
          room_image_url: string | null
          sort_order: number | null
          texture_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          color_family?: string | null
          created_at?: string | null
          description?: string | null
          finish_type?: string | null
          id?: string
          is_active?: boolean | null
          material_type?: string | null
          name: string
          price_tier?: string | null
          product_line?: string | null
          room_image_url?: string | null
          sort_order?: number | null
          texture_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          color_family?: string | null
          created_at?: string | null
          description?: string | null
          finish_type?: string | null
          id?: string
          is_active?: boolean | null
          material_type?: string | null
          name?: string
          price_tier?: string | null
          product_line?: string | null
          room_image_url?: string | null
          sort_order?: number | null
          texture_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      master_exterior_selections: {
        Row: {
          concrete_finish_type: string | null
          created_at: string | null
          exterior_door_color: string | null
          exterior_door_style: string | null
          exterior_lighting_finish: string | null
          exterior_lighting_style: string | null
          garage_door_color: string | null
          garage_door_style: string | null
          id: string
          metal_roof_color: string | null
          metal_roof_type: string | null
          metal_siding_color: string | null
          metal_siding_type: string | null
          metal_trim_color: string | null
          notes: string | null
          porch_ceiling_color: string | null
          porch_ceiling_material: string | null
          porch_post_color: string | null
          porch_post_style: string | null
          project_id: string
          stone_wainscot_color: string | null
          stone_wainscot_type: string | null
          updated_at: string | null
          window_color: string | null
          window_style: string | null
        }
        Insert: {
          concrete_finish_type?: string | null
          created_at?: string | null
          exterior_door_color?: string | null
          exterior_door_style?: string | null
          exterior_lighting_finish?: string | null
          exterior_lighting_style?: string | null
          garage_door_color?: string | null
          garage_door_style?: string | null
          id?: string
          metal_roof_color?: string | null
          metal_roof_type?: string | null
          metal_siding_color?: string | null
          metal_siding_type?: string | null
          metal_trim_color?: string | null
          notes?: string | null
          porch_ceiling_color?: string | null
          porch_ceiling_material?: string | null
          porch_post_color?: string | null
          porch_post_style?: string | null
          project_id: string
          stone_wainscot_color?: string | null
          stone_wainscot_type?: string | null
          updated_at?: string | null
          window_color?: string | null
          window_style?: string | null
        }
        Update: {
          concrete_finish_type?: string | null
          created_at?: string | null
          exterior_door_color?: string | null
          exterior_door_style?: string | null
          exterior_lighting_finish?: string | null
          exterior_lighting_style?: string | null
          garage_door_color?: string | null
          garage_door_style?: string | null
          id?: string
          metal_roof_color?: string | null
          metal_roof_type?: string | null
          metal_siding_color?: string | null
          metal_siding_type?: string | null
          metal_trim_color?: string | null
          notes?: string | null
          porch_ceiling_color?: string | null
          porch_ceiling_material?: string | null
          porch_post_color?: string | null
          porch_post_style?: string | null
          project_id?: string
          stone_wainscot_color?: string | null
          stone_wainscot_type?: string | null
          updated_at?: string | null
          window_color?: string | null
          window_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_exterior_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      master_interior_selections: {
        Row: {
          created_at: string | null
          default_baseboard_style: string | null
          default_ceiling_paint_brand: string | null
          default_ceiling_paint_color: string | null
          default_door_color: string | null
          default_door_hardware_finish: string | null
          default_door_style: string | null
          default_flooring_color: string | null
          default_flooring_finish: string | null
          default_flooring_material: string | null
          default_flooring_product_id: string | null
          default_outlet_switch_color: string | null
          default_trim_color: string | null
          default_trim_style: string | null
          default_wall_paint_brand: string | null
          default_wall_paint_color: string | null
          id: string
          notes: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_baseboard_style?: string | null
          default_ceiling_paint_brand?: string | null
          default_ceiling_paint_color?: string | null
          default_door_color?: string | null
          default_door_hardware_finish?: string | null
          default_door_style?: string | null
          default_flooring_color?: string | null
          default_flooring_finish?: string | null
          default_flooring_material?: string | null
          default_flooring_product_id?: string | null
          default_outlet_switch_color?: string | null
          default_trim_color?: string | null
          default_trim_style?: string | null
          default_wall_paint_brand?: string | null
          default_wall_paint_color?: string | null
          id?: string
          notes?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_baseboard_style?: string | null
          default_ceiling_paint_brand?: string | null
          default_ceiling_paint_color?: string | null
          default_door_color?: string | null
          default_door_hardware_finish?: string | null
          default_door_style?: string | null
          default_flooring_color?: string | null
          default_flooring_finish?: string | null
          default_flooring_material?: string | null
          default_flooring_product_id?: string | null
          default_outlet_switch_color?: string | null
          default_trim_color?: string | null
          default_trim_style?: string | null
          default_wall_paint_brand?: string | null
          default_wall_paint_color?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_interior_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      metal_color_products: {
        Row: {
          category: string | null
          color_name: string
          created_at: string | null
          finish_type: string | null
          hex_color: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price_tier: string | null
          product_code: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color_name: string
          created_at?: string | null
          finish_type?: string | null
          hex_color?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price_tier?: string | null
          product_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color_name?: string
          created_at?: string | null
          finish_type?: string | null
          hex_color?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price_tier?: string | null
          product_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_allowances: {
        Row: {
          actual_amount: number | null
          allowance_amount: number | null
          category: string
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          allowance_amount?: number | null
          category: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          allowance_amount?: number | null
          category?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_allowances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "titan_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string
          id: string
          ip_address: string | null
          notes: string | null
          project_id: string
          signature_data: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          project_id: string
          signature_data?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          project_id?: string
          signature_data?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "titan_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_attachments: {
        Row: {
          category: string | null
          created_at: string | null
          file_name: string | null
          file_url: string
          id: string
          notes: string | null
          project_id: string
          room_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          notes?: string | null
          project_id: string
          room_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          project_id?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "titan_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          build_type: string | null
          city: string | null
          client_email: string | null
          client_name: string
          created_at: string | null
          created_by: string | null
          garage_sq_ft: number | null
          house_sq_ft: number | null
          id: string
          lot_size: number | null
          phone: string | null
          project_name: string
          project_number: string | null
          running_total_estimate: number | null
          site_address: string | null
          state: string | null
          status: string | null
          stories: number | null
          total_allowance_cabinets: number | null
          total_allowance_countertops: number | null
          total_allowance_electrical: number | null
          total_allowance_flooring: number | null
          total_allowance_lighting: number | null
          total_allowance_misc: number | null
          total_allowance_paint: number | null
          total_allowance_plumbing: number | null
          total_allowance_windows_doors: number | null
          total_square_footage: number | null
          updated_at: string | null
          wall_height: number | null
          zip: string | null
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          build_type?: string | null
          city?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string | null
          created_by?: string | null
          garage_sq_ft?: number | null
          house_sq_ft?: number | null
          id?: string
          lot_size?: number | null
          phone?: string | null
          project_name: string
          project_number?: string | null
          running_total_estimate?: number | null
          site_address?: string | null
          state?: string | null
          status?: string | null
          stories?: number | null
          total_allowance_cabinets?: number | null
          total_allowance_countertops?: number | null
          total_allowance_electrical?: number | null
          total_allowance_flooring?: number | null
          total_allowance_lighting?: number | null
          total_allowance_misc?: number | null
          total_allowance_paint?: number | null
          total_allowance_plumbing?: number | null
          total_allowance_windows_doors?: number | null
          total_square_footage?: number | null
          updated_at?: string | null
          wall_height?: number | null
          zip?: string | null
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          build_type?: string | null
          city?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          garage_sq_ft?: number | null
          house_sq_ft?: number | null
          id?: string
          lot_size?: number | null
          phone?: string | null
          project_name?: string
          project_number?: string | null
          running_total_estimate?: number | null
          site_address?: string | null
          state?: string | null
          status?: string | null
          stories?: number | null
          total_allowance_cabinets?: number | null
          total_allowance_countertops?: number | null
          total_allowance_electrical?: number | null
          total_allowance_flooring?: number | null
          total_allowance_lighting?: number | null
          total_allowance_misc?: number | null
          total_allowance_paint?: number | null
          total_allowance_plumbing?: number | null
          total_allowance_windows_doors?: number | null
          total_square_footage?: number | null
          updated_at?: string | null
          wall_height?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      room_type_rules: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          json_rules: Json
          room_type: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          json_rules: Json
          room_type: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          json_rules?: Json
          room_type?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          ceiling_height_ft: number | null
          ceiling_type: string | null
          created_at: string | null
          id: string
          length_ft: number | null
          notes_general: string | null
          project_id: string
          room_name: string
          room_type: string | null
          sort_order: number | null
          updated_at: string | null
          width_ft: number | null
        }
        Insert: {
          ceiling_height_ft?: number | null
          ceiling_type?: string | null
          created_at?: string | null
          id?: string
          length_ft?: number | null
          notes_general?: string | null
          project_id: string
          room_name: string
          room_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
          width_ft?: number | null
        }
        Update: {
          ceiling_height_ft?: number | null
          ceiling_type?: string | null
          created_at?: string | null
          id?: string
          length_ft?: number | null
          notes_general?: string | null
          project_id?: string
          room_name?: string
          room_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
          width_ft?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      selection_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          trade: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          trade: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          trade?: string
        }
        Relationships: []
      }
      selection_items: {
        Row: {
          brand: string | null
          category_id: string
          color_name: string | null
          created_at: string | null
          description: string | null
          finish: string | null
          id: string
          image_url: string | null
          is_overridden: boolean | null
          is_standard_option: boolean | null
          is_upgrade: boolean | null
          label: string
          master_field_name: string | null
          material_type: string | null
          model_or_sku: string | null
          notes_for_sub: string | null
          override_reason: string | null
          product_id: string | null
          product_type: string | null
          project_id: string
          quantity: number | null
          room_id: string
          total_cost_allowance: number | null
          trade: string | null
          unit: string | null
          unit_cost_allowance: number | null
          updated_at: string | null
          upgrade_cost: number | null
          uses_master_default: boolean | null
        }
        Insert: {
          brand?: string | null
          category_id: string
          color_name?: string | null
          created_at?: string | null
          description?: string | null
          finish?: string | null
          id?: string
          image_url?: string | null
          is_overridden?: boolean | null
          is_standard_option?: boolean | null
          is_upgrade?: boolean | null
          label: string
          master_field_name?: string | null
          material_type?: string | null
          model_or_sku?: string | null
          notes_for_sub?: string | null
          override_reason?: string | null
          product_id?: string | null
          product_type?: string | null
          project_id: string
          quantity?: number | null
          room_id: string
          total_cost_allowance?: number | null
          trade?: string | null
          unit?: string | null
          unit_cost_allowance?: number | null
          updated_at?: string | null
          upgrade_cost?: number | null
          uses_master_default?: boolean | null
        }
        Update: {
          brand?: string | null
          category_id?: string
          color_name?: string | null
          created_at?: string | null
          description?: string | null
          finish?: string | null
          id?: string
          image_url?: string | null
          is_overridden?: boolean | null
          is_standard_option?: boolean | null
          is_upgrade?: boolean | null
          label?: string
          master_field_name?: string | null
          material_type?: string | null
          model_or_sku?: string | null
          notes_for_sub?: string | null
          override_reason?: string | null
          product_id?: string | null
          product_type?: string | null
          project_id?: string
          quantity?: number | null
          room_id?: string
          total_cost_allowance?: number | null
          trade?: string | null
          unit?: string | null
          unit_cost_allowance?: number | null
          updated_at?: string | null
          upgrade_cost?: number | null
          uses_master_default?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "selection_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "selection_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selection_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selection_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      selection_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          label: string | null
          locked: boolean | null
          project_id: string
          snapshot_json: Json | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label?: string | null
          locked?: boolean | null
          project_id: string
          snapshot_json?: Json | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label?: string | null
          locked?: boolean | null
          project_id?: string
          snapshot_json?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "selection_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tile_products: {
        Row: {
          color_family: string | null
          created_at: string | null
          description: string | null
          finish_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          material: string | null
          name: string
          price_tier: string | null
          size: string | null
          sort_order: number | null
          tile_type: string | null
          updated_at: string | null
        }
        Insert: {
          color_family?: string | null
          created_at?: string | null
          description?: string | null
          finish_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          name: string
          price_tier?: string | null
          size?: string | null
          sort_order?: number | null
          tile_type?: string | null
          updated_at?: string | null
        }
        Update: {
          color_family?: string | null
          created_at?: string | null
          description?: string | null
          finish_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          name?: string
          price_tier?: string | null
          size?: string | null
          sort_order?: number | null
          tile_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      titan_projects: {
        Row: {
          building_height: number | null
          building_length: number | null
          building_width: number | null
          city: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          garage_door_count: number | null
          id: string
          notes: string | null
          porch_type: string | null
          project_name: string
          project_number: string | null
          project_type: string | null
          roof_pitch: string | null
          scope: string | null
          site_address: string | null
          specs: Json | null
          state: string | null
          status: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          garage_door_count?: number | null
          id?: string
          notes?: string | null
          porch_type?: string | null
          project_name: string
          project_number?: string | null
          project_type?: string | null
          roof_pitch?: string | null
          scope?: string | null
          site_address?: string | null
          specs?: Json | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          garage_door_count?: number | null
          id?: string
          notes?: string | null
          porch_type?: string | null
          project_name?: string
          project_number?: string | null
          project_type?: string | null
          roof_pitch?: string | null
          scope?: string | null
          site_address?: string | null
          specs?: Json | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "titan_projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_admin_role: { Args: { user_email: string }; Returns: undefined }
      generate_project_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "builder_admin" | "client" | "subcontractor"
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
      app_role: ["builder_admin", "client", "subcontractor"],
    },
  },
} as const
