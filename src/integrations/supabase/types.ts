export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          area_id: string
          created_at: string
          debt_balance: number
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          area_id: string
          created_at?: string
          debt_balance?: number
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          area_id?: string
          created_at?: string
          debt_balance?: number
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_closings: {
        Row: {
          area_id: string
          cash_sales: number
          closed_at: string | null
          closed_by: string | null
          closing_date: string
          created_at: string
          debt_collections: number
          debt_sales: number
          expenses_total: number
          id: string
          profit_estimate: number
          reconciled_at: string | null
          reconciled_by: string | null
          status: string
          supplier_payable: number
          total_assigned: number
          total_returned: number
          total_sold: number
        }
        Insert: {
          area_id: string
          cash_sales?: number
          closed_at?: string | null
          closed_by?: string | null
          closing_date: string
          created_at?: string
          debt_collections?: number
          debt_sales?: number
          expenses_total?: number
          id?: string
          profit_estimate?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string
          supplier_payable?: number
          total_assigned?: number
          total_returned?: number
          total_sold?: number
        }
        Update: {
          area_id?: string
          cash_sales?: number
          closed_at?: string | null
          closed_by?: string | null
          closing_date?: string
          created_at?: string
          debt_collections?: number
          debt_sales?: number
          expenses_total?: number
          id?: string
          profit_estimate?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string
          supplier_payable?: number
          total_assigned?: number
          total_returned?: number
          total_sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_closings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_closings_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_closings_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      debt_collection: {
        Row: {
          amount: number
          collection_date: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          staff_id: string
        }
        Insert: {
          amount: number
          collection_date: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          staff_id: string
        }
        Update: {
          amount?: number
          collection_date?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_collection_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_collection_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      debt_ledger: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          created_by: string
          customer_id: string
          entry_type: string
          id: string
          reference_id: string
          reference_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          created_by: string
          customer_id: string
          entry_type: string
          id?: string
          reference_id: string
          reference_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          created_by?: string
          customer_id?: string
          entry_type?: string
          id?: string
          reference_id?: string
          reference_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "debt_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          expense_date: string
          id: string
          notes: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          expense_date: string
          id?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          expense_date?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          area_id: string
          created_at: string
          customer_id: string
          distribution_id: string | null
          id: string
          notes: string | null
          payment_type: string
          quantity: number
          sale_date: string
          selling_price: number
          staff_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          customer_id: string
          distribution_id?: string | null
          id?: string
          notes?: string | null
          payment_type: string
          quantity: number
          sale_date: string
          selling_price: number
          staff_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          customer_id?: string
          distribution_id?: string | null
          id?: string
          notes?: string | null
          payment_type?: string
          quantity?: number
          sale_date?: string
          selling_price?: number
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "stock_distribution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      staff_area_assignments: {
        Row: {
          area_id: string
          assigned_date: string
          created_at: string
          ended_date: string | null
          id: string
          staff_id: string
        }
        Insert: {
          area_id: string
          assigned_date?: string
          created_at?: string
          ended_date?: string | null
          id?: string
          staff_id: string
        }
        Update: {
          area_id?: string
          assigned_date?: string
          created_at?: string
          ended_date?: string | null
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_area_assignments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stock_distribution: {
        Row: {
          area_id: string
          created_at: string
          created_by: string
          id: string
          intake_id: string
          quantity_assigned: number
        }
        Insert: {
          area_id: string
          created_at?: string
          created_by: string
          id?: string
          intake_id: string
          quantity_assigned: number
        }
        Update: {
          area_id?: string
          created_at?: string
          created_by?: string
          id?: string
          intake_id?: string
          quantity_assigned?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_distribution_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_distribution_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_distribution_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "stock_intake"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_intake: {
        Row: {
          cost_per_pax: number
          created_at: string
          created_by: string
          id: string
          intake_date: string
          notes: string | null
          quantity_received: number
          supplier_id: string
        }
        Insert: {
          cost_per_pax: number
          created_at?: string
          created_by: string
          id?: string
          intake_date: string
          notes?: string | null
          quantity_received: number
          supplier_id: string
        }
        Update: {
          cost_per_pax?: number
          created_at?: string
          created_by?: string
          id?: string
          intake_date?: string
          notes?: string | null
          quantity_received?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_intake_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_intake_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_return: {
        Row: {
          area_id: string
          created_at: string
          created_by: string
          distribution_id: string
          id: string
          quantity_returned: number
          return_date: string
        }
        Insert: {
          area_id: string
          created_at?: string
          created_by: string
          distribution_id: string
          id?: string
          quantity_returned: number
          return_date: string
        }
        Update: {
          area_id?: string
          created_at?: string
          created_by?: string
          distribution_id?: string
          id?: string
          quantity_returned?: number
          return_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_return_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_return_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_return_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "stock_distribution"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_price_history: {
        Row: {
          cost_per_pax: number
          created_at: string
          effective_date: string
          id: string
          supplier_id: string
        }
        Insert: {
          cost_per_pax: number
          created_at?: string
          effective_date: string
          id?: string
          supplier_id: string
        }
        Update: {
          cost_per_pax?: number
          created_at?: string
          effective_date?: string
          id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_settlements: {
        Row: {
          cost_per_pax: number
          created_at: string
          id: string
          intake_id: string
          payable_amount: number
          payable_quantity: number
          settled_by: string | null
          settlement_date: string | null
          status: string
          total_received: number
          total_returned: number
          total_sold: number
          updated_at: string
        }
        Insert: {
          cost_per_pax?: number
          created_at?: string
          id?: string
          intake_id: string
          payable_amount?: number
          payable_quantity?: number
          settled_by?: string | null
          settlement_date?: string | null
          status?: string
          total_received?: number
          total_returned?: number
          total_sold?: number
          updated_at?: string
        }
        Update: {
          cost_per_pax?: number
          created_at?: string
          id?: string
          intake_id?: string
          payable_amount?: number
          payable_quantity?: number
          settled_by?: string | null
          settlement_date?: string | null
          status?: string
          total_received?: number
          total_returned?: number
          total_sold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_settlements_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "stock_intake"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_settlements_settled_by_fkey"
            columns: ["settled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
      get_my_area_ids: { Args: never; Returns: string[] }
      get_total_returned_for_intake: {
        Args: { p_intake_id: string }
        Returns: number
      }
      get_total_sold_for_intake: {
        Args: { p_intake_id: string }
        Returns: number
      }
      perform_daily_closing: {
        Args: {
          p_action?: string
          p_area_id: string
          p_closing_date: string
          p_user_id: string
        }
        Returns: Json
      }
      recalculate_customer_balance: {
        Args: { p_customer_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

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
    Enums: {},
  },
} as const
