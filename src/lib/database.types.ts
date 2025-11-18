export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bots: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          avatar_url: string | null
          primary_color: string
          welcome_message: string
          widget_position: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          avatar_url?: string | null
          primary_color?: string
          welcome_message?: string
          widget_position?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          primary_color?: string
          welcome_message?: string
          widget_position?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          bot_id: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path: string
          status: string
          processing_error: string | null
          total_chunks: number
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          bot_id: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path: string
          status?: string
          processing_error?: string | null
          total_chunks?: number
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          bot_id?: string
          user_id?: string
          filename?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          status?: string
          processing_error?: string | null
          total_chunks?: number
          created_at?: string
          processed_at?: string | null
        }
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          bot_id: string
          chunk_index: number
          content: string
          token_count: number
          embedding: number[] | null
          bm25_terms: Json
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          bot_id: string
          chunk_index: number
          content: string
          token_count?: number
          embedding?: number[] | null
          bm25_terms?: Json
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          bot_id?: string
          chunk_index?: number
          content?: string
          token_count?: number
          embedding?: number[] | null
          bm25_terms?: Json
          metadata?: Json
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          bot_id: string
          session_token: string
          metadata: Json
          created_at: string
          last_active_at: string
        }
        Insert: {
          id?: string
          bot_id: string
          session_token: string
          metadata?: Json
          created_at?: string
          last_active_at?: string
        }
        Update: {
          id?: string
          bot_id?: string
          session_token?: string
          metadata?: Json
          created_at?: string
          last_active_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          bot_id: string
          role: string
          content: string
          citations: Json
          response_time_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          bot_id: string
          role: string
          content: string
          citations?: Json
          response_time_ms?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          bot_id?: string
          role?: string
          content?: string
          citations?: Json
          response_time_ms?: number
          created_at?: string
        }
      }
      bot_analytics: {
        Row: {
          id: string
          bot_id: string
          date: string
          total_queries: number
          avg_response_time: number
          unique_sessions: number
          created_at: string
        }
        Insert: {
          id?: string
          bot_id: string
          date: string
          total_queries?: number
          avg_response_time?: number
          unique_sessions?: number
          created_at?: string
        }
        Update: {
          id?: string
          bot_id?: string
          date?: string
          total_queries?: number
          avg_response_time?: number
          unique_sessions?: number
          created_at?: string
        }
      }
    }
  }
}

export type Bot = Database['public']['Tables']['bots']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentChunk = Database['public']['Tables']['document_chunks']['Row']
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type BotAnalytics = Database['public']['Tables']['bot_analytics']['Row']