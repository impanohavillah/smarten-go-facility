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
      access_logs: {
        Row: {
          alert_reason: string | null
          created_at: string | null
          duration_minutes: number | null
          entry_time: string | null
          exit_time: string | null
          id: string
          payment_id: string | null
          security_alert: boolean | null
          toilet_id: string | null
        }
        Insert: {
          alert_reason?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          payment_id?: string | null
          security_alert?: boolean | null
          toilet_id?: string | null
        }
        Update: {
          alert_reason?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          payment_id?: string | null
          security_alert?: boolean | null
          toilet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_toilet_id_fkey"
            columns: ["toilet_id"]
            isOneToOne: false
            referencedRelation: "toilets"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string
          status: Database["public"]["Enums"]["payment_status"] | null
          toilet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          toilet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          toilet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_toilet_id_fkey"
            columns: ["toilet_id"]
            isOneToOne: false
            referencedRelation: "toilets"
            referencedColumns: ["id"]
          },
        ]
      }
      toilets: {
        Row: {
          created_at: string | null
          id: string
          is_occupied: boolean | null
          is_paid: boolean | null
          last_payment_time: string | null
          location: string | null
          manual_open_enabled: boolean | null
          name: string
          occupied_since: string | null
          status: Database["public"]["Enums"]["toilet_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_occupied?: boolean | null
          is_paid?: boolean | null
          last_payment_time?: string | null
          location?: string | null
          manual_open_enabled?: boolean | null
          name: string
          occupied_since?: string | null
          status?: Database["public"]["Enums"]["toilet_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_occupied?: boolean | null
          is_paid?: boolean | null
          last_payment_time?: string | null
          location?: string | null
          manual_open_enabled?: boolean | null
          name?: string
          occupied_since?: string | null
          status?: Database["public"]["Enums"]["toilet_status"] | null
          updated_at?: string | null
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      payment_method: "momo" | "rfid_card"
      payment_status: "pending" | "completed" | "failed"
      toilet_status: "available" | "occupied" | "maintenance"
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
      app_role: ["admin", "moderator", "user"],
      payment_method: ["momo", "rfid_card"],
      payment_status: ["pending", "completed", "failed"],
      toilet_status: ["available", "occupied", "maintenance"],
    },
  },
} as const
