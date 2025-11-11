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
      image_library: {
        Row: {
          created_at: string
          file_size: number | null
          filename: string
          id: string
          image_url: string
          page_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          filename: string
          id?: string
          image_url: string
          page_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          filename?: string
          id?: string
          image_url?: string
          page_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_library_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_analytics_summary"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "image_library_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_library_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_analytics: {
        Row: {
          created_at: string | null
          element_id: string | null
          event_type: string
          id: string
          landing_page_url: string | null
          page_id: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string | null
          element_id?: string | null
          event_type: string
          id?: string
          landing_page_url?: string | null
          page_id: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string | null
          element_id?: string | null
          event_type?: string
          id?: string
          landing_page_url?: string | null
          page_id?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_analytics_summary"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sessions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          first_seen: string | null
          id: string
          landing_page_url: string | null
          last_seen: string | null
          page_id: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_seen?: string | null
          id?: string
          landing_page_url?: string | null
          last_seen?: string | null
          page_id: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_seen?: string | null
          id?: string
          landing_page_url?: string | null
          last_seen?: string | null
          page_id?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_sessions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_analytics_summary"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_sessions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_sessions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_tags: {
        Row: {
          created_at: string | null
          id: string
          page_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_tags_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_analytics_summary"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_tags_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_tags_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json
          created_at: string | null
          cta_style: string | null
          cta_text: string | null
          cta_url: string | null
          headline: string | null
          id: string
          image_url: string | null
          published_at: string | null
          slug: string
          status: string
          sticky_cta_threshold: number | null
          subtitle: string | null
          template: string | null
          title: string
          tracking_script_set_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          cta_style?: string | null
          cta_text?: string | null
          cta_url?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug: string
          status?: string
          sticky_cta_threshold?: number | null
          subtitle?: string | null
          template?: string | null
          title: string
          tracking_script_set_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          cta_style?: string | null
          cta_text?: string | null
          cta_url?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          sticky_cta_threshold?: number | null
          subtitle?: string | null
          template?: string | null
          title?: string
          tracking_script_set_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_tracking_script_set_id_fkey"
            columns: ["tracking_script_set_id"]
            isOneToOne: false
            referencedRelation: "tracking_script_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      snippets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sections: Json
          tags: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sections: Json
          tags?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sections?: Json
          tags?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_script_sets: {
        Row: {
          created_at: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          id: string
          microsoft_clarity_id: string | null
          name: string
          triplewhale_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          microsoft_clarity_id?: string | null
          name: string
          triplewhale_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          microsoft_clarity_id?: string | null
          name?: string
          triplewhale_token?: string | null
          updated_at?: string | null
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      page_analytics_summary: {
        Row: {
          ctr_percentage: number | null
          page_id: string | null
          slug: string | null
          title: string | null
          total_clicks: number | null
          total_views: number | null
          user_id: string | null
        }
        Relationships: []
      }
      published_pages: {
        Row: {
          content: Json | null
          created_at: string | null
          cta_style: string | null
          cta_text: string | null
          cta_url: string | null
          headline: string | null
          id: string | null
          image_url: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          sticky_cta_threshold: number | null
          subtitle: string | null
          template: string | null
          title: string | null
          tracking_script_set_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_published_page_with_scripts: {
        Args: { p_slug: string }
        Returns: {
          content: Json
          created_at: string
          cta_style: string
          cta_text: string
          cta_url: string
          facebook_pixel_id: string
          google_analytics_id: string
          headline: string
          id: string
          image_url: string
          microsoft_clarity_id: string
          published_at: string
          slug: string
          status: string
          sticky_cta_threshold: number
          subtitle: string
          template: string
          title: string
          tracking_set_name: string
          triplewhale_token: string
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
