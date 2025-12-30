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
      caixa: {
        Row: {
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          id: string
          numero: number
          observacao: string | null
          saldo_final: number | null
          saldo_inicial: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          numero: number
          observacao?: string | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          numero?: number
          observacao?: string | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caixa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          observacao: string | null
          status: string | null
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          status?: string | null
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          status?: string | null
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          id: string
          observacao: string | null
          status: string | null
          user_id: string | null
          valor: number
          venda_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          status?: string | null
          user_id?: string | null
          valor: number
          venda_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          status?: string | null
          user_id?: string | null
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_config: {
        Row: {
          ambiente: Database["public"]["Enums"]["ambiente_fiscal"]
          bairro: string | null
          cep: string | null
          certificado_senha: string | null
          certificado_url: string | null
          certificado_validade: string | null
          cidade: string | null
          cnpj: string | null
          configuracao_completa: boolean
          created_at: string
          csc_id: string | null
          csc_token: string | null
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          nome_fantasia: string | null
          numero: string | null
          proximo_numero_nfce: number
          proximo_numero_nfe: number
          razao_social: string | null
          regime_tributario: Database["public"]["Enums"]["regime_tributario"]
          serie_nfce: number
          serie_nfe: number
          telefone: string | null
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["ambiente_fiscal"]
          bairro?: string | null
          cep?: string | null
          certificado_senha?: string | null
          certificado_url?: string | null
          certificado_validade?: string | null
          cidade?: string | null
          cnpj?: string | null
          configuracao_completa?: boolean
          created_at?: string
          csc_id?: string | null
          csc_token?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          proximo_numero_nfce?: number
          proximo_numero_nfe?: number
          razao_social?: string | null
          regime_tributario?: Database["public"]["Enums"]["regime_tributario"]
          serie_nfce?: number
          serie_nfe?: number
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["ambiente_fiscal"]
          bairro?: string | null
          cep?: string | null
          certificado_senha?: string | null
          certificado_url?: string | null
          certificado_validade?: string | null
          cidade?: string | null
          cnpj?: string | null
          configuracao_completa?: boolean
          created_at?: string
          csc_id?: string | null
          csc_token?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          proximo_numero_nfce?: number
          proximo_numero_nfe?: number
          razao_social?: string | null
          regime_tributario?: Database["public"]["Enums"]["regime_tributario"]
          serie_nfce?: number
          serie_nfe?: number
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_fantasia: string | null
          razao_social: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ambiente: Database["public"]["Enums"]["ambiente_fiscal"]
          chave_acesso: string | null
          cliente_cpf_cnpj: string | null
          cliente_nome: string | null
          codigo_status_sefaz: number | null
          created_at: string
          data_autorizacao: string | null
          id: string
          mensagem_sefaz: string | null
          numero: number
          pdf_url: string | null
          protocolo_autorizacao: string | null
          serie: number
          status: Database["public"]["Enums"]["invoice_status"]
          tipo: string
          updated_at: string
          user_id: string
          valor_total: number
          venda_id: string | null
          xml_url: string | null
        }
        Insert: {
          ambiente: Database["public"]["Enums"]["ambiente_fiscal"]
          chave_acesso?: string | null
          cliente_cpf_cnpj?: string | null
          cliente_nome?: string | null
          codigo_status_sefaz?: number | null
          created_at?: string
          data_autorizacao?: string | null
          id?: string
          mensagem_sefaz?: string | null
          numero: number
          pdf_url?: string | null
          protocolo_autorizacao?: string | null
          serie: number
          status?: Database["public"]["Enums"]["invoice_status"]
          tipo?: string
          updated_at?: string
          user_id: string
          valor_total?: number
          venda_id?: string | null
          xml_url?: string | null
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["ambiente_fiscal"]
          chave_acesso?: string | null
          cliente_cpf_cnpj?: string | null
          cliente_nome?: string | null
          codigo_status_sefaz?: number | null
          created_at?: string
          data_autorizacao?: string | null
          id?: string
          mensagem_sefaz?: string | null
          numero?: number
          pdf_url?: string | null
          protocolo_autorizacao?: string | null
          serie?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
          venda_id?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentos_caixa: {
        Row: {
          caixa_id: string | null
          created_at: string
          data_lancamento: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          observacao: string | null
          origem: string | null
          tipo: string
          user_id: string | null
          valor: number
        }
        Insert: {
          caixa_id?: string | null
          created_at?: string
          data_lancamento?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          origem?: string | null
          tipo: string
          user_id?: string | null
          valor: number
        }
        Update: {
          caixa_id?: string | null
          created_at?: string
          data_lancamento?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          origem?: string | null
          tipo?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_caixa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          cest: string | null
          cfop_padrao: string | null
          codigo: string | null
          created_at: string
          descricao: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          id: string
          ncm: string | null
          nome: string
          origem_mercadoria: number | null
          preco_custo: number | null
          preco_venda: number | null
          unidade: string | null
          unidade_comercial: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cest?: string | null
          cfop_padrao?: string | null
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          ncm?: string | null
          nome: string
          origem_mercadoria?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          unidade?: string | null
          unidade_comercial?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cest?: string | null
          cfop_padrao?: string | null
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          ncm?: string | null
          nome?: string
          origem_mercadoria?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          unidade?: string | null
          unidade_comercial?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          is_recurring: boolean
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description: string
          id?: string
          is_recurring?: boolean
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_venda: string
          desconto: number | null
          forma_pagamento: string | null
          id: string
          numero: number | null
          observacao: string | null
          status: string | null
          user_id: string | null
          valor_final: number | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_venda?: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          numero?: number | null
          observacao?: string | null
          status?: string | null
          user_id?: string | null
          valor_final?: number | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_venda?: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          numero?: number | null
          observacao?: string | null
          status?: string | null
          user_id?: string | null
          valor_final?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_itens: {
        Row: {
          created_at: string
          id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number | null
          subtotal: number
          venda_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          preco_unitario: number
          produto_id?: string | null
          quantidade?: number | null
          subtotal: number
          venda_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number | null
          subtotal?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
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
      ambiente_fiscal: "homologacao" | "producao"
      invoice_status:
        | "pendente"
        | "processando"
        | "autorizada"
        | "rejeitada"
        | "cancelada"
      regime_tributario: "simples_nacional" | "lucro_presumido" | "lucro_real"
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
      ambiente_fiscal: ["homologacao", "producao"],
      invoice_status: [
        "pendente",
        "processando",
        "autorizada",
        "rejeitada",
        "cancelada",
      ],
      regime_tributario: ["simples_nacional", "lucro_presumido", "lucro_real"],
    },
  },
} as const
