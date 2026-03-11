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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      creche_membros: {
        Row: {
          created_at: string
          creche_id: string
          id: string
          is_diretor: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          creche_id: string
          id?: string
          is_diretor?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          creche_id?: string
          id?: string
          is_diretor?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creche_membros_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
      creches: {
        Row: {
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crianca_responsaveis: {
        Row: {
          created_at: string
          crianca_id: string
          id: string
          parentesco: string
          responsavel_user_id: string
        }
        Insert: {
          created_at?: string
          crianca_id: string
          id?: string
          parentesco?: string
          responsavel_user_id: string
        }
        Update: {
          created_at?: string
          crianca_id?: string
          id?: string
          parentesco?: string
          responsavel_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crianca_responsaveis_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      criancas: {
        Row: {
          created_at: string
          data_nascimento: string
          foto_url: string | null
          id: string
          nome: string
          observacoes: string | null
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento: string
          foto_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "criancas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string
          crianca_id: string
          data_fim: string | null
          data_inicio: string
          educador_user_id: string | null
          id: string
          observacao: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          crianca_id: string
          data_fim?: string | null
          data_inicio?: string
          educador_user_id?: string | null
          id?: string
          observacao?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          crianca_id?: string
          data_fim?: string | null
          data_inicio?: string
          educador_user_id?: string | null
          id?: string
          observacao?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          crianca_id: string | null
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crianca_id?: string | null
          id?: string
          lida?: boolean
          mensagem: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          crianca_id?: string | null
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      turma_educadores: {
        Row: {
          created_at: string
          educador_user_id: string
          id: string
          turma_id: string
        }
        Insert: {
          created_at?: string
          educador_user_id: string
          id?: string
          turma_id: string
        }
        Update: {
          created_at?: string
          educador_user_id?: string
          id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_educadores_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          created_at: string
          creche_id: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creche_id: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creche_id?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_creche_id_from_turma: { Args: { _turma_id: string }; Returns: string }
      get_crianca_ids_for_responsavel: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_turma_ids_for_responsavel: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_diretor_of_creche: {
        Args: { _creche_id: string; _user_id: string }
        Returns: boolean
      }
      is_educador_of_turma: {
        Args: { _turma_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_of_turma_creche: {
        Args: { _turma_id: string; _user_id: string }
        Returns: boolean
      }
      is_responsavel_of_crianca: {
        Args: { _crianca_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "educador" | "responsavel"
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
      app_role: ["admin", "educador", "responsavel"],
    },
  },
} as const
