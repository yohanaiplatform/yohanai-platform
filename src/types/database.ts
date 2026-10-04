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
    PostgrestVersion: "14.17"
  }
  ai: {
    Tables: {
      agent_runs: {
        Row: {
          confidence: string | null
          conversation_id: string | null
          created_at: string
          decided_temperature: string | null
          error_message: string | null
          id: string
          input_snapshot: Json
          lead_id: string | null
          llm_raw_response: Json | null
          previous_temperature: string | null
          reply_message_id: string | null
          reply_sent: boolean
          reply_text: string | null
          status: string
          trigger_message_id: string | null
        }
        Insert: {
          confidence?: string | null
          conversation_id?: string | null
          created_at?: string
          decided_temperature?: string | null
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          lead_id?: string | null
          llm_raw_response?: Json | null
          previous_temperature?: string | null
          reply_message_id?: string | null
          reply_sent?: boolean
          reply_text?: string | null
          status?: string
          trigger_message_id?: string | null
        }
        Update: {
          confidence?: string | null
          conversation_id?: string | null
          created_at?: string
          decided_temperature?: string | null
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          lead_id?: string | null
          llm_raw_response?: Json | null
          previous_temperature?: string | null
          reply_message_id?: string | null
          reply_sent?: boolean
          reply_text?: string | null
          status?: string
          trigger_message_id?: string | null
        }
        Relationships: []
      }
      nurture_sends: {
        Row: {
          id: string
          lead_id: string
          conversation_id: string | null
          step: number
          template_name: string
          status: string
          wa_message_id: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          conversation_id?: string | null
          step: number
          template_name: string
          status: string
          wa_message_id?: string | null
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          conversation_id?: string | null
          step?: number
          template_name?: string
          status?: string
          wa_message_id?: string | null
          error?: string | null
          created_at?: string
        }
        Relationships: []
      }
      follow_up_queue: {
        Row: {
          id: string
          lead_id: string
          conversation_id: string | null
          note: string
          created_at: string
          flushed_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          conversation_id?: string | null
          note: string
          created_at?: string
          flushed_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          conversation_id?: string | null
          note?: string
          created_at?: string
          flushed_at?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  auth_ext: {
    Tables: {
      google_contacts_access_requests: {
        Row: {
          requested_at: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      google_contacts_connections: {
        Row: {
          connected_at: string
          google_email: string | null
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          google_email?: string | null
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          google_email?: string | null
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          daily_report_email: boolean
          marketing_email: boolean
          message_email: boolean
          message_inapp: boolean
          new_lead_email: boolean
          new_lead_inapp: boolean
          property_update_email: boolean
          property_update_inapp: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_report_email?: boolean
          marketing_email?: boolean
          message_email?: boolean
          message_inapp?: boolean
          new_lead_email?: boolean
          new_lead_inapp?: boolean
          property_update_email?: boolean
          property_update_inapp?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_report_email?: boolean
          marketing_email?: boolean
          message_email?: boolean
          message_inapp?: boolean
          new_lead_email?: boolean
          new_lead_inapp?: boolean
          property_update_email?: boolean
          property_update_inapp?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line: string | null
          avatar_url: string | null
          brand_name: string | null
          business_role_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          facebook_url: string | null
          first_name: string | null
          id: string
          instagram_url: string | null
          last_name: string | null
          linkedin_url: string | null
          notification_whatsapp_number: string | null
          role_details: Json
          role_id: string | null
          tiktok_url: string | null
          twitter_x_url: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
          website_url: string | null
          wilayah_desa_id: string | null
        }
        Insert: {
          address_line?: string | null
          avatar_url?: string | null
          brand_name?: string | null
          business_role_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          instagram_url?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          notification_whatsapp_number?: string | null
          role_details?: Json
          role_id?: string | null
          tiktok_url?: string | null
          twitter_x_url?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
          website_url?: string | null
          wilayah_desa_id?: string | null
        }
        Update: {
          address_line?: string | null
          avatar_url?: string | null
          brand_name?: string | null
          business_role_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          instagram_url?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          notification_whatsapp_number?: string | null
          role_details?: Json
          role_id?: string | null
          tiktok_url?: string | null
          twitter_x_url?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          website_url?: string | null
          wilayah_desa_id?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  chat: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          lead_id: string | null
          metadata: Json
          status: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          status?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          status?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          metadata: Json
          sender_id: string | null
          sender_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          metadata?: Json
          sender_id?: string | null
          sender_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          metadata?: Json
          sender_id?: string | null
          sender_type?: string
          updated_at?: string
          updated_by?: string | null
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
      whatsapp_numbers: {
        Row: {
          id: string
          phone_number_id: string
          label: string | null
          assigned_to: string
          webhook_secret: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          phone_number_id: string
          label?: string | null
          assigned_to: string
          webhook_secret?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          phone_number_id?: string
          label?: string | null
          assigned_to?: string
          webhook_secret?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      whatsapp_number_requests: {
        Row: {
          id: string
          user_id: string
          phone_number: string
          status: string
          requested_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          status?: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          status?: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  core: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      business_roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          permission_id: string
          role_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          permission_id: string
          role_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_authenticated: { Args: never; Returns: boolean }
      is_admin_or_above: { Args: never; Returns: boolean }
      get_platform_stats: {
        Args: never
        Returns: {
          db_size_bytes: number
          storage_size_bytes: number
          storage_object_count: number
        }[]
      }
      list_assignable_users: {
        Args: never
        Returns: {
          user_id: string
          display_name: string | null
          email: string | null
          role_name: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  customer: {
    Tables: {
      contacts: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_primary: boolean
          lead_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          lead_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          lead_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_label: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          lead_id: string
          note: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_label?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lead_id: string
          note: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_label?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lead_id?: string
          note?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_source_id: string | null
          metadata: Json
          phone: string | null
          slug: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_source_id?: string | null
          metadata?: Json
          phone?: string | null
          slug: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_source_id?: string | null
          metadata?: Json
          phone?: string | null
          slug?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  knowledge: {
    Tables: {
      entries: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          keywords: string[]
          related_listing_terms: string[]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          related_listing_terms?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          related_listing_terms?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  property: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          address: string | null
          assigned_to: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json
          price: number
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          price: number
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          price?: number
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      profile_completeness_rules: {
        Row: {
          business_role_id: string | null
          created_at: string
          depends_on_field_key: string | null
          depends_on_value: string | null
          field_key: string
          id: string
          is_active: boolean
          label: string
          source: string
          tier: number
          updated_at: string
        }
        Insert: {
          business_role_id?: string | null
          created_at?: string
          depends_on_field_key?: string | null
          depends_on_value?: string | null
          field_key: string
          id?: string
          is_active?: boolean
          label: string
          source: string
          tier: number
          updated_at?: string
        }
        Update: {
          business_role_id?: string | null
          created_at?: string
          depends_on_field_key?: string | null
          depends_on_value?: string | null
          field_key?: string
          id?: string
          is_active?: boolean
          label?: string
          source?: string
          tier?: number
          updated_at?: string
        }
        Relationships: []
      }
      wilayah_desa: {
        Row: {
          id: string
          kecamatan_id: string
          name: string
        }
        Insert: {
          id: string
          kecamatan_id: string
          name: string
        }
        Update: {
          id?: string
          kecamatan_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "wilayah_desa_kecamatan_id_fkey"
            columns: ["kecamatan_id"]
            isOneToOne: false
            referencedRelation: "wilayah_kecamatan"
            referencedColumns: ["id"]
          },
        ]
      }
      wilayah_kabupaten: {
        Row: {
          id: string
          name: string
          provinsi_id: string
        }
        Insert: {
          id: string
          name: string
          provinsi_id: string
        }
        Update: {
          id?: string
          name?: string
          provinsi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wilayah_kabupaten_provinsi_id_fkey"
            columns: ["provinsi_id"]
            isOneToOne: false
            referencedRelation: "wilayah_provinsi"
            referencedColumns: ["id"]
          },
        ]
      }
      wilayah_kecamatan: {
        Row: {
          id: string
          kabupaten_id: string
          name: string
        }
        Insert: {
          id: string
          kabupaten_id: string
          name: string
        }
        Update: {
          id?: string
          kabupaten_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "wilayah_kecamatan_kabupaten_id_fkey"
            columns: ["kabupaten_id"]
            isOneToOne: false
            referencedRelation: "wilayah_kabupaten"
            referencedColumns: ["id"]
          },
        ]
      }
      wilayah_provinsi: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_profile_completeness: {
        Args: { p_tier: number; p_user_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  ai: {
    Enums: {},
  },
  auth_ext: {
    Enums: {},
  },
  chat: {
    Enums: {},
  },
  core: {
    Enums: {},
  },
  customer: {
    Enums: {},
  },
  knowledge: {
    Enums: {},
  },
  property: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
