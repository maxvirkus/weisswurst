/**
 * Supabase Database Types
 * 
 * Generated types for the Weißwurst Einstand database schema.
 * These provide type safety for all database operations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SessionStatus = 'OPEN' | 'CLOSED';
export type SessionMode = 'INVITE' | 'SPLIT';

export interface Database {
  public: {
    Tables: {
      einstand_sessions: {
        Row: {
          id: string;
          title: string | null;
          mode: SessionMode;
          price_wurst: number | null;
          price_pretzel: number | null;
          status: SessionStatus;
          admin_secret: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          mode?: SessionMode;
          price_wurst?: number | null;
          price_pretzel?: number | null;
          status?: SessionStatus;
          admin_secret: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          mode?: SessionMode;
          price_wurst?: number | null;
          price_pretzel?: number | null;
          status?: SessionStatus;
          admin_secret?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      einstand_entries: {
        Row: {
          id: string;
          session_id: string;
          display_name: string;
          wurst_count: number;
          pretzel_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          display_name: string;
          wurst_count?: number;
          pretzel_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          display_name?: string;
          wurst_count?: number;
          pretzel_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "einstand_entries_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "einstand_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      einstand_sessions_public: {
        Row: {
          id: string | null;
          title: string | null;
          mode: SessionMode | null;
          price_wurst: number | null;
          price_pretzel: number | null;
          status: SessionStatus | null;
          created_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      close_session: {
        Args: {
          p_session_id: string;
          p_admin_secret: string;
        };
        Returns: boolean;
      };
      delete_session: {
        Args: {
          p_session_id: string;
          p_admin_secret: string;
        };
        Returns: boolean;
      };
      reopen_session: {
        Args: {
          p_session_id: string;
          p_admin_secret: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      session_mode: SessionMode;
      session_status: SessionStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types for use in components
export type Session = Database['public']['Tables']['einstand_sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['einstand_sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['einstand_sessions']['Update'];

// SessionPublic view has nullable fields - provide non-null version for type safety after fetch
export type SessionPublicRow = Database['public']['Views']['einstand_sessions_public']['Row'];
export interface SessionPublic {
  id: string;
  title: string | null;
  mode: SessionMode;
  price_wurst: number | null;
  price_pretzel: number | null;
  status: SessionStatus;
  created_at: string;
}

export type Entry = Database['public']['Tables']['einstand_entries']['Row'];
export type EntryInsert = Database['public']['Tables']['einstand_entries']['Insert'];
export type EntryUpdate = Database['public']['Tables']['einstand_entries']['Update'];
