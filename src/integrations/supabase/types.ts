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
      asaas_webhook_logs: {
        Row: {
          asaas_payment_id: string | null
          creche_id: string | null
          error: string | null
          event: string
          id: string
          payload: Json
          processed: boolean
          received_at: string
        }
        Insert: {
          asaas_payment_id?: string | null
          creche_id?: string | null
          error?: string | null
          event: string
          id?: string
          payload: Json
          processed?: boolean
          received_at?: string
        }
        Update: {
          asaas_payment_id?: string | null
          creche_id?: string | null
          error?: string | null
          event?: string
          id?: string
          payload?: Json
          processed?: boolean
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_webhook_logs_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
      atividade_entregas: {
        Row: {
          aluno_crianca_id: string
          atividade_id: string
          created_at: string
          feedback_educador: string | null
          id: string
          nota: number | null
          status: string
          updated_at: string
        }
        Insert: {
          aluno_crianca_id: string
          atividade_id: string
          created_at?: string
          feedback_educador?: string | null
          id?: string
          nota?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          aluno_crianca_id?: string
          atividade_id?: string
          created_at?: string
          feedback_educador?: string | null
          id?: string
          nota?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_entregas_aluno_crianca_id_fkey"
            columns: ["aluno_crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_entregas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades_pedagogicas"
            referencedColumns: ["id"]
          },
        ]
      }
      atividade_opcoes: {
        Row: {
          created_at: string
          id: string
          is_correta: boolean
          ordem: number
          questao_id: string
          texto: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correta?: boolean
          ordem?: number
          questao_id: string
          texto: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correta?: boolean
          ordem?: number
          questao_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_opcoes_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "atividade_questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      atividade_questoes: {
        Row: {
          atividade_id: string
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          ordem: number
          pontuacao: number | null
          tipo: string
          titulo: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number
          pontuacao?: number | null
          tipo?: string
          titulo: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number
          pontuacao?: number | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_questoes_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades_pedagogicas"
            referencedColumns: ["id"]
          },
        ]
      }
      atividade_respostas: {
        Row: {
          created_at: string
          entrega_id: string
          foto_url: string | null
          id: string
          opcao_selecionada_id: string | null
          questao_id: string
          resposta_texto: string | null
        }
        Insert: {
          created_at?: string
          entrega_id: string
          foto_url?: string | null
          id?: string
          opcao_selecionada_id?: string | null
          questao_id: string
          resposta_texto?: string | null
        }
        Update: {
          created_at?: string
          entrega_id?: string
          foto_url?: string | null
          id?: string
          opcao_selecionada_id?: string | null
          questao_id?: string
          resposta_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividade_respostas_entrega_id_fkey"
            columns: ["entrega_id"]
            isOneToOne: false
            referencedRelation: "atividade_entregas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_respostas_opcao_selecionada_id_fkey"
            columns: ["opcao_selecionada_id"]
            isOneToOne: false
            referencedRelation: "atividade_opcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_respostas_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "atividade_questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_pedagogicas: {
        Row: {
          created_at: string
          data_entrega: string
          descricao: string | null
          educador_user_id: string
          id: string
          instrucoes: string | null
          tipo: string
          titulo: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_entrega: string
          descricao?: string | null
          educador_user_id: string
          id?: string
          instrucoes?: string | null
          tipo?: string
          titulo: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_entrega?: string
          descricao?: string | null
          educador_user_id?: string
          id?: string
          instrucoes?: string | null
          tipo?: string
          titulo?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_pedagogicas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
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
      blog_categorias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          autor_nome: string | null
          autor_user_id: string | null
          capa_alt: string | null
          capa_url: string | null
          categoria_id: string | null
          conteudo: string
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          palavra_chave_principal: string | null
          palavras_chave_secundarias: string[]
          published_at: string | null
          reading_time: number
          resumo: string | null
          slug: string
          status: string
          titulo: string
          updated_at: string
          views: number
        }
        Insert: {
          autor_nome?: string | null
          autor_user_id?: string | null
          capa_alt?: string | null
          capa_url?: string | null
          categoria_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          palavra_chave_principal?: string | null
          palavras_chave_secundarias?: string[]
          published_at?: string | null
          reading_time?: number
          resumo?: string | null
          slug: string
          status?: string
          titulo: string
          updated_at?: string
          views?: number
        }
        Update: {
          autor_nome?: string | null
          autor_user_id?: string | null
          capa_alt?: string | null
          capa_url?: string | null
          categoria_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          palavra_chave_principal?: string | null
          palavras_chave_secundarias?: string[]
          published_at?: string | null
          reading_time?: number
          resumo?: string | null
          slug?: string
          status?: string
          titulo?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "blog_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
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
          atividades_avaliacoes_ativo: boolean
          boletim_ativo: boolean
          created_at: string
          creche_id: string
          gestao_materias_ativo: boolean
          grade_aulas_ativo: boolean
          id: string
          modulo_boletos_ativo: boolean
          modulo_secretaria_ativo: boolean
          relatorio_desempenho_ativo: boolean
          updated_at: string
        }
        Insert: {
          atividades_avaliacoes_ativo?: boolean
          boletim_ativo?: boolean
          created_at?: string
          creche_id: string
          gestao_materias_ativo?: boolean
          grade_aulas_ativo?: boolean
          id?: string
          modulo_boletos_ativo?: boolean
          modulo_secretaria_ativo?: boolean
          relatorio_desempenho_ativo?: boolean
          updated_at?: string
        }
        Update: {
          atividades_avaliacoes_ativo?: boolean
          boletim_ativo?: boolean
          created_at?: string
          creche_id?: string
          gestao_materias_ativo?: boolean
          grade_aulas_ativo?: boolean
          id?: string
          modulo_boletos_ativo?: boolean
          modulo_secretaria_ativo?: boolean
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
          email_aluno: string | null
          foto_url: string | null
          id: string
          nome: string
          observacoes: string | null
          turma_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_nascimento: string
          email_aluno?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          turma_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_nascimento?: string
          email_aluno?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          turma_id?: string
          updated_at?: string
          user_id?: string | null
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
          creche_id: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          nome: string
          turma_id: string | null
        }
        Insert: {
          created_at?: string
          creche_id: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          nome: string
          turma_id?: string | null
        }
        Update: {
          created_at?: string
          creche_id?: string
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
          creche_id: string | null
          data: string
          id: string
          nome: string
          recorrente: boolean
        }
        Insert: {
          created_at?: string
          creche_id?: string | null
          data: string
          id?: string
          nome: string
          recorrente?: boolean
        }
        Update: {
          created_at?: string
          creche_id?: string | null
          data?: string
          id?: string
          nome?: string
          recorrente?: boolean
        }
        Relationships: []
      }
      financial_customers: {
        Row: {
          asaas_customer_id: string
          cpf_cnpj: string | null
          created_at: string
          creche_id: string
          crianca_id: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          responsavel_user_id: string | null
          updated_at: string
        }
        Insert: {
          asaas_customer_id: string
          cpf_cnpj?: string | null
          created_at?: string
          creche_id: string
          crianca_id?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          responsavel_user_id?: string | null
          updated_at?: string
        }
        Update: {
          asaas_customer_id?: string
          cpf_cnpj?: string | null
          created_at?: string
          creche_id?: string
          crianca_id?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          responsavel_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_customers_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_customers_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_settings: {
        Row: {
          asaas_account_email: string | null
          asaas_account_name: string | null
          asaas_api_key_encrypted: string | null
          asaas_api_key_iv: string | null
          asaas_api_key_last4: string | null
          asaas_api_key_tag: string | null
          asaas_connected: boolean
          asaas_environment: string
          asaas_last_validation: string | null
          asaas_webhook_id: string | null
          asaas_webhook_token: string
          created_at: string
          creche_id: string
          id: string
          updated_at: string
        }
        Insert: {
          asaas_account_email?: string | null
          asaas_account_name?: string | null
          asaas_api_key_encrypted?: string | null
          asaas_api_key_iv?: string | null
          asaas_api_key_last4?: string | null
          asaas_api_key_tag?: string | null
          asaas_connected?: boolean
          asaas_environment?: string
          asaas_last_validation?: string | null
          asaas_webhook_id?: string | null
          asaas_webhook_token?: string
          created_at?: string
          creche_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          asaas_account_email?: string | null
          asaas_account_name?: string | null
          asaas_api_key_encrypted?: string | null
          asaas_api_key_iv?: string | null
          asaas_api_key_last4?: string | null
          asaas_api_key_tag?: string | null
          asaas_connected?: boolean
          asaas_environment?: string
          asaas_last_validation?: string | null
          asaas_webhook_id?: string | null
          asaas_webhook_token?: string
          created_at?: string
          creche_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_settings_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: true
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
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
      invoices: {
        Row: {
          asaas_payment_id: string
          bank_slip_url: string | null
          created_at: string
          creche_id: string
          crianca_id: string | null
          customer_id: string
          description: string | null
          due_date: string
          external_reference: string | null
          id: string
          invoice_url: string | null
          net_value: number | null
          payment_method: string
          pix_copy_paste: string | null
          pix_expires_at: string | null
          pix_qrcode: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          value: number
        }
        Insert: {
          asaas_payment_id: string
          bank_slip_url?: string | null
          created_at?: string
          creche_id: string
          crianca_id?: string | null
          customer_id: string
          description?: string | null
          due_date: string
          external_reference?: string | null
          id?: string
          invoice_url?: string | null
          net_value?: number | null
          payment_method?: string
          pix_copy_paste?: string | null
          pix_expires_at?: string | null
          pix_qrcode?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          asaas_payment_id?: string
          bank_slip_url?: string | null
          created_at?: string
          creche_id?: string
          crianca_id?: string | null
          customer_id?: string
          description?: string | null
          due_date?: string
          external_reference?: string | null
          id?: string
          invoice_url?: string | null
          net_value?: number | null
          payment_method?: string
          pix_copy_paste?: string | null
          pix_expires_at?: string | null
          pix_qrcode?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "financial_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
      payments: {
        Row: {
          created_at: string
          creche_id: string
          id: string
          invoice_id: string
          net_value: number | null
          paid_at: string
          payment_method: string | null
          status: string
          transaction_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          creche_id: string
          id?: string
          invoice_id: string
          net_value?: number | null
          paid_at?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          creche_id?: string
          id?: string
          invoice_id?: string
          net_value?: number | null
          paid_at?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
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
      pickup_photo_audit: {
        Row: {
          action: string
          authorized_pickup_id: string | null
          created_at: string
          crianca_id: string
          foto_path: string | null
          id: string
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          authorized_pickup_id?: string | null
          created_at?: string
          crianca_id: string
          foto_path?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          authorized_pickup_id?: string | null
          created_at?: string
          crianca_id?: string
          foto_path?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
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
      sidebar_config: {
        Row: {
          config: Json
          created_at: string
          creche_id: string
          id: string
          perfil: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          creche_id: string
          id?: string
          perfil: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          creche_id?: string
          id?: string
          perfil?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidebar_config_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_subscription_id: string
          billing_type: string
          created_at: string
          creche_id: string
          crianca_id: string | null
          customer_id: string
          cycle: string
          description: string | null
          id: string
          next_due_date: string | null
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          asaas_subscription_id: string
          billing_type?: string
          created_at?: string
          creche_id: string
          crianca_id?: string | null
          customer_id: string
          cycle: string
          description?: string | null
          id?: string
          next_due_date?: string | null
          status?: string
          updated_at?: string
          value: number
        }
        Update: {
          asaas_subscription_id?: string
          billing_type?: string
          created_at?: string
          creche_id?: string
          crianca_id?: string | null
          customer_id?: string
          cycle?: string
          description?: string | null
          id?: string
          next_due_date?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: false
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "financial_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suporte_mensagens: {
        Row: {
          assunto: string
          created_at: string
          email: string
          id: string
          mensagem: string
          nome: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assunto: string
          created_at?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assunto?: string
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      financial_settings_safe: {
        Row: {
          asaas_account_email: string | null
          asaas_account_name: string | null
          asaas_api_key_last4: string | null
          asaas_connected: boolean | null
          asaas_environment: string | null
          asaas_last_validation: string | null
          created_at: string | null
          creche_id: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          asaas_account_email?: string | null
          asaas_account_name?: string | null
          asaas_api_key_last4?: string | null
          asaas_connected?: boolean | null
          asaas_environment?: string | null
          asaas_last_validation?: string | null
          created_at?: string | null
          creche_id?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          asaas_account_email?: string | null
          asaas_account_name?: string | null
          asaas_api_key_last4?: string | null
          asaas_connected?: boolean | null
          asaas_environment?: string | null
          asaas_last_validation?: string | null
          created_at?: string | null
          creche_id?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_settings_creche_id_fkey"
            columns: ["creche_id"]
            isOneToOne: true
            referencedRelation: "creches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_crianca: {
        Args: { _crianca_id: string; _user_id: string }
        Returns: boolean
      }
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
      get_opcoes_for_quiz: {
        Args: { _questao_id: string }
        Returns: {
          id: string
          ordem: number
          questao_id: string
          texto: string
        }[]
      }
      get_turma_ids_for_responsavel: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_user_creche_id: { Args: { _user_id: string }; Returns: string }
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
      is_financeiro_admin: {
        Args: { _creche_id: string; _user_id: string }
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
      log_pickup_photo_view: {
        Args: {
          _authorized_pickup_id: string
          _crianca_id: string
          _foto_path: string
        }
        Returns: undefined
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
      send_suporte_reply: {
        Args: { _conteudo: string; _suporte_id: string; _titulo: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "educador"
        | "responsavel"
        | "diretor"
        | "aluno"
        | "secretaria"
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
      app_role: [
        "admin",
        "educador",
        "responsavel",
        "diretor",
        "aluno",
        "secretaria",
      ],
    },
  },
} as const
