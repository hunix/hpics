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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_type: string
          generated_at: string
          id: string
          profile_id: string
          result: Json
          user_id: string
        }
        Insert: {
          analysis_type: string
          generated_at?: string
          id?: string
          profile_id: string
          result: Json
          user_id: string
        }
        Update: {
          analysis_type?: string
          generated_at?: string
          id?: string
          profile_id?: string
          result?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          linkedin_id: string | null
          name: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          linkedin_id?: string | null
          name: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          linkedin_id?: string | null
          name?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          channel: Database["public"]["Enums"]["communication_channel"]
          content: string | null
          created_at: string
          direction: Database["public"]["Enums"]["communication_direction"]
          duration_minutes: number | null
          id: string
          occurred_at: string
          profile_id: string
          sentiment_score: number | null
          subject: string | null
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["communication_channel"]
          content?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["communication_direction"]
          duration_minutes?: number | null
          id?: string
          occurred_at?: string
          profile_id: string
          sentiment_score?: number | null
          subject?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["communication_channel"]
          content?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["communication_direction"]
          duration_minutes?: number | null
          id?: string
          occurred_at?: string
          profile_id?: string
          sentiment_score?: number | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_group_members: {
        Row: {
          added_at: string
          group_id: string
          id: string
          profile_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          profile_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_interests: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          interest_type: string
          name: string
          notes: string | null
          profile_id: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          interest_type: string
          name: string
          notes?: string | null
          profile_id: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          interest_type?: string
          name?: string
          notes?: string | null
          profile_id?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_methods: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          id: string
          is_primary: boolean | null
          label: string | null
          profile_id: string
          value: string
        }
        Insert: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          profile_id: string
          value: string
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          profile_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_skills: {
        Row: {
          created_at: string
          endorsement_count: number | null
          id: string
          linkedin_id: string | null
          proficiency_level: string | null
          profile_id: string
          skill_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endorsement_count?: number | null
          id?: string
          linkedin_id?: string | null
          proficiency_level?: string | null
          profile_id: string
          skill_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          endorsement_count?: number | null
          id?: string
          linkedin_id?: string | null
          proficiency_level?: string | null
          profile_id?: string
          skill_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number | null
          platform: Database["public"]["Enums"]["message_platform"]
          profile_id: string
          started_at: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          platform: Database["public"]["Enums"]["message_platform"]
          profile_id: string
          started_at?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          platform?: Database["public"]["Enums"]["message_platform"]
          profile_id?: string
          started_at?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          profile_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          activities: string | null
          created_at: string
          degree_type: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade_or_gpa: string | null
          id: string
          institution_name: string
          is_current: boolean | null
          linkedin_id: string | null
          profile_id: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activities?: string | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_or_gpa?: string | null
          id?: string
          institution_name: string
          is_current?: boolean | null
          linkedin_id?: string | null
          profile_id: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activities?: string | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_or_gpa?: string | null
          id?: string
          institution_name?: string
          is_current?: boolean | null
          linkedin_id?: string | null
          profile_id?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_active: boolean | null
          profile_id: string | null
          reminder_days_before: number | null
          reminder_frequency:
            | Database["public"]["Enums"]["reminder_frequency"]
            | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          reminder_days_before?: number | null
          reminder_frequency?:
            | Database["public"]["Enums"]["reminder_frequency"]
            | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          reminder_days_before?: number | null
          reminder_frequency?:
            | Database["public"]["Enums"]["reminder_frequency"]
            | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_ideas: {
        Row: {
          ai_reasoning: string | null
          category: string | null
          created_at: string
          description: string | null
          given_date: string | null
          id: string
          is_given: boolean | null
          occasion: string | null
          price_range: string | null
          profile_id: string
          source: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          given_date?: string | null
          id?: string
          is_given?: boolean | null
          occasion?: string | null
          price_range?: string | null
          profile_id: string
          source?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          given_date?: string | null
          id?: string
          is_given?: boolean | null
          occasion?: string | null
          price_range?: string | null
          profile_id?: string
          source?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_ideas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          profile_id: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_from_contact: boolean
          metadata: Json | null
          sent_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_from_contact?: boolean
          metadata?: Json | null
          sent_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_from_contact?: boolean
          metadata?: Json | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_name: string
          id: string
          is_favorite: boolean | null
          job_title: string | null
          last_contact_date: string | null
          last_name: string | null
          linkedin_url: string | null
          nickname: string | null
          notes: string | null
          organization: string | null
          relationship_type:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name: string
          id?: string
          is_favorite?: boolean | null
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          notes?: string | null
          organization?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string
          id?: string
          is_favorite?: boolean | null
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          notes?: string | null
          organization?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      relationship_goals: {
        Row: {
          created_at: string
          current_streak: number | null
          description: string | null
          frequency: string
          goal_type: string
          id: string
          is_active: boolean | null
          last_completed_at: string | null
          longest_streak: number | null
          next_due_at: string | null
          profile_id: string | null
          target_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          next_due_at?: string | null
          profile_id?: string | null
          target_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          next_due_at?: string | null
          profile_id?: string | null
          target_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_trends: {
        Row: {
          communication_count: number | null
          created_at: string
          health_score: number
          id: string
          profile_id: string
          recorded_at: string
          sentiment_avg: number | null
          user_id: string
        }
        Insert: {
          communication_count?: number | null
          created_at?: string
          health_score: number
          id?: string
          profile_id: string
          recorded_at?: string
          sentiment_avg?: number | null
          user_id: string
        }
        Update: {
          communication_count?: number | null
          created_at?: string
          health_score?: number
          id?: string
          profile_id?: string
          recorded_at?: string
          sentiment_avg?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_trends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_experiences: {
        Row: {
          created_at: string
          description: string | null
          experience_date: string | null
          experience_type: string
          id: string
          location: string | null
          media_urls: string[] | null
          profile_id: string
          sentiment: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          experience_date?: string | null
          experience_type: string
          id?: string
          location?: string | null
          media_urls?: string[] | null
          profile_id: string
          sentiment?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          experience_date?: string | null
          experience_type?: string
          id?: string
          location?: string | null
          media_urls?: string[] | null
          profile_id?: string
          sentiment?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          email_reminders: boolean | null
          id: string
          reminder_email: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_reminders?: boolean | null
          id?: string
          reminder_email?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_reminders?: boolean | null
          id?: string
          reminder_email?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          generated_at: string
          highlights: string[] | null
          id: string
          recommendations: string[] | null
          summary_data: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          generated_at?: string
          highlights?: string[] | null
          id?: string
          recommendations?: string[] | null
          summary_data: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          generated_at?: string
          highlights?: string[] | null
          id?: string
          recommendations?: string[] | null
          summary_data?: Json
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      communication_channel:
        | "email"
        | "phone"
        | "video_call"
        | "in_person"
        | "message"
        | "social_media"
        | "other"
      communication_direction: "inbound" | "outbound"
      contact_type:
        | "email"
        | "phone"
        | "linkedin"
        | "twitter"
        | "facebook"
        | "instagram"
        | "website"
        | "other"
      document_type:
        | "resume"
        | "contract"
        | "presentation"
        | "notes"
        | "article"
        | "other"
      event_type:
        | "birthday"
        | "anniversary"
        | "milestone"
        | "meeting"
        | "follow_up"
        | "other"
      message_platform:
        | "sms"
        | "whatsapp"
        | "linkedin"
        | "telegram"
        | "messenger"
        | "imessage"
        | "slack"
        | "discord"
        | "email_thread"
        | "other"
      relationship_type:
        | "family"
        | "friend"
        | "colleague"
        | "client"
        | "mentor"
        | "mentee"
        | "acquaintance"
        | "other"
      reminder_frequency: "once" | "daily" | "weekly" | "monthly" | "yearly"
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
      communication_channel: [
        "email",
        "phone",
        "video_call",
        "in_person",
        "message",
        "social_media",
        "other",
      ],
      communication_direction: ["inbound", "outbound"],
      contact_type: [
        "email",
        "phone",
        "linkedin",
        "twitter",
        "facebook",
        "instagram",
        "website",
        "other",
      ],
      document_type: [
        "resume",
        "contract",
        "presentation",
        "notes",
        "article",
        "other",
      ],
      event_type: [
        "birthday",
        "anniversary",
        "milestone",
        "meeting",
        "follow_up",
        "other",
      ],
      message_platform: [
        "sms",
        "whatsapp",
        "linkedin",
        "telegram",
        "messenger",
        "imessage",
        "slack",
        "discord",
        "email_thread",
        "other",
      ],
      relationship_type: [
        "family",
        "friend",
        "colleague",
        "client",
        "mentor",
        "mentee",
        "acquaintance",
        "other",
      ],
      reminder_frequency: ["once", "daily", "weekly", "monthly", "yearly"],
    },
  },
} as const
