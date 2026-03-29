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
      authorized_pickups: {
        Row: {
          created_at: string
          crianca_id: string
          documento: string | null
          foto_url: string | null
          id: string
          nome: string
          parentesco: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          crianca_id: string
          documento?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          parentesco?: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          crianca_id?: string
          documento?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          parentesco?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorized_pickups_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      boletins: {
        Row: {
          avaliacao: number | null
          created_at: string
          crianca_id: string
          data_registro: string
          educador_user_id: string
          id: string
          materia_id: string
          observacoes: string | null
          periodo_letivo: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          avaliacao?: number | null
          created_at?: string
          crianca_id: string
          data_registro?: string
          educador_user_id: string
          id?: string
          materia_id: string
          observacoes?: string | null
          periodo_letivo: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          avaliacao?: number | null
          created_at?: string
          crianca_id?: string
          data_registro?: string
          educador_user_id?: string
          id?: string
          materia_id?: string
          observacoes?: string | null
          periodo_letivo?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boletins_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletins_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletins_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_pedagogicas: {
        Row: {
          boletim_ativo: boolean
          created_at: string
          creche_id: string
          gestao_materias_ativo: boolean
          grade_aulas_ativo: boolean
          id: string
          relatorio_desempenho_ativo: boolean
          updated_at: string
        }
        Insert: {
          boletim_ativo?: boolean
          created_at?: string
          creche_id: string
          gestao_materias_ativo?: boolean
          grade_aulas_ativo?: boolean
          id?: string
          relatorio_desempenho_ativo?: boolean
          updated_at?: string
        }
        Update: {
          boletim_ativo?: boolean
          created_at?: string
          creche_id?: string
          gestao_materias_ativo?: boolean
          grade_aulas_ativo?: boolean
          id?: string
          relatorio_desempenho_ativo?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_pedagogicas_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: true
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
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
          logo_url: string | null
          nome: string
          telefone: string | null
          tipo_periodo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          telefone?: string | null
          tipo_periodo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          telefone?: string | null
          tipo_periodo?: string
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
          ativo: boolean
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
          ativo?: boolean
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
          ativo?: boolean
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      eventos: {
        Row: {
          administrado: boolean | null
          authorized_person_id: string | null
          created_at: string
          crianca_id: string
          data_fim: string | null
          data_inicio: string
          dosagem: string | null
          educador_user_id: string | null
          horario_administracao: string | null
          horario_administrado: string | null
          id: string
          nome_medicamento: string | null
          observacao: string | null
          resultado_refeicao: string | null
          tipo: string
          tipo_higiene: string | null
          tipo_refeicao: string | null
        }
        Insert: {
          administrado?: boolean | null
          authorized_person_id?: string | null
          created_at?: string
          crianca_id: string
          data_fim?: string | null
          data_inicio?: string
          dosagem?: string | null
          educador_user_id?: string | null
          horario_administracao?: string | null
          horario_administrado?: string | null
          id?: string
          nome_medicamento?: string | null
          observacao?: string | null
          resultado_refeicao?: string | null
          tipo: string
          tipo_higiene?: string | null
          tipo_refeicao?: string | null
        }
        Update: {
          administrado?: boolean | null
          authorized_person_id?: string | null
          created_at?: string
          crianca_id?: string
          data_fim?: string | null
          data_inicio?: string
          dosagem?: string | null
          educador_user_id?: string | null
          horario_administracao?: string | null
          horario_administrado?: string | null
          id?: string
          nome_medicamento?: string | null
          observacao?: string | null
          resultado_refeicao?: string | null
          tipo?: string
          tipo_higiene?: string | null
          tipo_refeicao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_authorized_person_id_fkey"
            columns: ["authorized_person_id"]
            isOneToOne: false
            referencedRelation: "authorized_pickups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_futuros: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          nome: string
          turma_id: string | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          nome: string
          turma_id?: string | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          nome?: string
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_futuros_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          created_at: string
          data: string
          id: string
          nome: string
          recorrente: boolean
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          nome: string
          recorrente?: boolean
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          nome?: string
          recorrente?: boolean
        }
        Relationships: []
      }
      grade_aulas: {
        Row: {
          created_at: string
          dia_semana: number
          educador_user_id: string
          horario_fim: string
          horario_inicio: string
          id: string
          materia_id: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dia_semana: number
          educador_user_id: string
          horario_fim: string
          horario_inicio: string
          id?: string
          materia_id: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dia_semana?: number
          educador_user_id?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          materia_id?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_aulas_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_aulas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      materias: {
        Row: {
          ativo: boolean
          created_at: string
          creche_id: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          creche_id: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          creche_id?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materias_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
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
      orcamento_respostas: {
        Row: {
          admin_user_id: string
          conteudo: string
          created_at: string
          id: string
          orcamento_id: string
        }
        Insert: {
          admin_user_id: string
          conteudo: string
          created_at?: string
          id?: string
          orcamento_id: string
        }
        Update: {
          admin_user_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          orcamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_respostas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cidade: string
          created_at: string
          email: string
          escola: string
          id: string
          nome: string
          num_alunos: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cidade: string
          created_at?: string
          email: string
          escola: string
          id?: string
          nome: string
          num_alunos?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string
          created_at?: string
          email?: string
          escola?: string
          id?: string
          nome?: string
          num_alunos?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      permissoes_perfil: {
        Row: {
          created_at: string
          creche_id: string
          id: string
          modulo: string
          perfil: string
          pode_criar: boolean
          pode_editar: boolean
          pode_excluir: boolean
          pode_visualizar: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          creche_id: string
          id?: string
          modulo: string
          perfil: string
          pode_criar?: boolean
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_visualizar?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          creche_id?: string
          id?: string
          modulo?: string
          perfil?: string
          pode_criar?: boolean
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_visualizar?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_perfil_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          created_at: string
          crianca_id: string
          data: string
          educador_user_id: string | null
          hora_chegada: string | null
          hora_saida: string | null
          id: string
          observacao: string | null
          pickup_person_id: string | null
          pickup_person_name: string | null
          pickup_person_type: string | null
          pickup_registered_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crianca_id: string
          data?: string
          educador_user_id?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          id?: string
          observacao?: string | null
          pickup_person_id?: string | null
          pickup_person_name?: string | null
          pickup_person_type?: string | null
          pickup_registered_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crianca_id?: string
          data?: string
          educador_user_id?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          id?: string
          observacao?: string | null
          pickup_person_id?: string | null
          pickup_person_name?: string | null
          pickup_person_type?: string | null
          pickup_registered_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
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
          ativo?: boolean
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
          ativo?: boolean
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
      recados: {
        Row: {
          anexo_tipo: string | null
          anexo_url: string | null
          conteudo: string
          created_at: string
          crianca_id: string | null
          id: string
          lido: boolean
          parent_id: string | null
          remetente_nome: string | null
          remetente_user_id: string
          titulo: string
          turma_id: string | null
          updated_at: string
        }
        Insert: {
          anexo_tipo?: string | null
          anexo_url?: string | null
          conteudo: string
          created_at?: string
          crianca_id?: string | null
          id?: string
          lido?: boolean
          parent_id?: string | null
          remetente_nome?: string | null
          remetente_user_id: string
          titulo?: string
          turma_id?: string | null
          updated_at?: string
        }
        Update: {
          anexo_tipo?: string | null
          anexo_url?: string | null
          conteudo?: string
          created_at?: string
          crianca_id?: string | null
          id?: string
          lido?: boolean
          parent_id?: string | null
          remetente_nome?: string | null
          remetente_user_id?: string
          titulo?: string
          turma_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recados_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recados_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recados_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorio_alunos: {
        Row: {
          created_at: string
          crianca_id: string
          educador_user_id: string
          id: string
          modelo_id: string
          periodo_letivo: string
          status: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crianca_id: string
          educador_user_id: string
          id?: string
          modelo_id: string
          periodo_letivo: string
          status?: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crianca_id?: string
          educador_user_id?: string
          id?: string
          modelo_id?: string
          periodo_letivo?: string
          status?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_alunos_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorio_alunos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "relatorio_modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorio_alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorio_campos: {
        Row: {
          created_at: string
          id: string
          obrigatorio: boolean
          opcoes: Json | null
          ordem: number
          secao_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          id?: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          secao_id: string
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string
          id?: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          secao_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_campos_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "relatorio_secoes"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorio_modelos: {
        Row: {
          ativo: boolean
          created_at: string
          creche_id: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          creche_id: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          creche_id?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_modelos_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorio_respostas: {
        Row: {
          campo_id: string
          created_at: string
          id: string
          relatorio_aluno_id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          campo_id: string
          created_at?: string
          id?: string
          relatorio_aluno_id: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          campo_id?: string
          created_at?: string
          id?: string
          relatorio_aluno_id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_respostas_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "relatorio_campos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorio_respostas_relatorio_aluno_id_fkey"
            columns: ["relatorio_aluno_id"]
            isOneToOne: false
            referencedRelation: "relatorio_alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorio_secoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          modelo_id: string
          ordem: number
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          modelo_id: string
          ordem?: number
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          modelo_id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_secoes_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "relatorio_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
          faixa_etaria: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creche_id: string
          descricao?: string | null
          faixa_etaria?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creche_id?: string
          descricao?: string | null
          faixa_etaria?: string | null
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      is_in_same_creche: {
        Args: { _other_user_id: string; _user_id: string }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "educador" | "responsavel" | "diretor"
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
      app_role: ["admin", "educador", "responsavel", "diretor"],
    },
  },
} as const
