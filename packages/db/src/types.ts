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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ingestion_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          items_fetched: number
          items_new: number
          items_rephrased: number
          source_code: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          items_fetched?: number
          items_new?: number
          items_rephrased?: number
          source_code: string
          started_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          items_fetched?: number
          items_new?: number
          items_rephrased?: number
          source_code?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_runs_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["code"]
          },
        ]
      }
      news_items: {
        Row: {
          affects: string[]
          analysis: string
          author: string
          bias: string
          content_hash: string
          created_at: string
          fetched_at: string
          headline: string
          id: string
          impact: string
          published_at: string | null
          raw_text: string | null
          related_plan_ids: string[]
          rephrased: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_code: string
          source_url: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          affects?: string[]
          analysis: string
          author: string
          bias: string
          content_hash: string
          created_at?: string
          fetched_at?: string
          headline: string
          id?: string
          impact: string
          published_at?: string | null
          raw_text?: string | null
          related_plan_ids?: string[]
          rephrased?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_code: string
          source_url?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          affects?: string[]
          analysis?: string
          author?: string
          bias?: string
          content_hash?: string
          created_at?: string
          fetched_at?: string
          headline?: string
          id?: string
          impact?: string
          published_at?: string | null
          raw_text?: string | null
          related_plan_ids?: string[]
          rephrased?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_code?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_items_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_items_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          handle: string | null
          id: string
          is_admin: boolean
          joined_at: string
          package: string | null
          renews_at: string | null
          signed_liability: boolean
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          handle?: string | null
          id: string
          is_admin?: boolean
          joined_at?: string
          package?: string | null
          renews_at?: string | null
          signed_liability?: boolean
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          handle?: string | null
          id?: string
          is_admin?: boolean
          joined_at?: string
          package?: string | null
          renews_at?: string | null
          signed_liability?: boolean
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          adapter: string
          code: string
          created_at: string
          enabled: boolean
          last_error: string | null
          last_polled_at: string | null
          last_success_at: string | null
          name: string
          poll_minutes: number
          updated_at: string
          url: string
        }
        Insert: {
          adapter: string
          code: string
          created_at?: string
          enabled?: boolean
          last_error?: string | null
          last_polled_at?: string | null
          last_success_at?: string | null
          name: string
          poll_minutes?: number
          updated_at?: string
          url: string
        }
        Update: {
          adapter?: string
          code?: string
          created_at?: string
          enabled?: boolean
          last_error?: string | null
          last_polled_at?: string | null
          last_success_at?: string | null
          name?: string
          poll_minutes?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      telegram_admins: {
        Row: {
          active: boolean
          created_at: string
          label: string | null
          profile_id: string | null
          tg_user_id: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          label?: string | null
          profile_id?: string | null
          tg_user_id: number
        }
        Update: {
          active?: boolean
          created_at?: string
          label?: string | null
          profile_id?: string | null
          tg_user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "telegram_admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
