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
          is_standard_option: boolean | null
          is_upgrade: boolean | null
          label: string
          material_type: string | null
          model_or_sku: string | null
          notes_for_sub: string | null
          project_id: string
          quantity: number | null
          room_id: string
          total_cost_allowance: number | null
          trade: string | null
          unit: string | null
          unit_cost_allowance: number | null
          updated_at: string | null
          upgrade_cost: number | null
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
          is_standard_option?: boolean | null
          is_upgrade?: boolean | null
          label: string
          material_type?: string | null
          model_or_sku?: string | null
          notes_for_sub?: string | null
          project_id: string
          quantity?: number | null
          room_id: string
          total_cost_allowance?: number | null
          trade?: string | null
          unit?: string | null
          unit_cost_allowance?: number | null
          updated_at?: string | null
          upgrade_cost?: number | null
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
          is_standard_option?: boolean | null
          is_upgrade?: boolean | null
          label?: string
          material_type?: string | null
          model_or_sku?: string | null
          notes_for_sub?: string | null
          project_id?: string
          quantity?: number | null
          room_id?: string
          total_cost_allowance?: number | null
          trade?: string | null
          unit?: string | null
          unit_cost_allowance?: number | null
          updated_at?: string | null
          upgrade_cost?: number | null
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
