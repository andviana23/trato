import { z } from "zod";
import type { Database } from "./database";

// Tipos base do banco de dados
type Tables = Database["public"]["Tables"];

// Tipos das tabelas financeiras
export type ContaContabil = Tables["contas_contabeis"]["Row"];
export type ContaContabilInsert = Tables["contas_contabeis"]["Insert"];
export type ContaContabilUpdate = Tables["contas_contabeis"]["Update"];

export type LancamentoContabil = Tables["lancamentos_contabeis"]["Row"];
export type LancamentoContabilInsert = Tables["lancamentos_contabeis"]["Insert"];
export type LancamentoContabilUpdate = Tables["lancamentos_contabeis"]["Update"];

export type CentroCusto = Tables["centros_custo"]["Row"];
export type CentroCustoInsert = Tables["centros_custo"]["Insert"];
export type CentroCustoUpdate = Tables["centros_custo"]["Update"];

export type DRE = Tables["dre"]["Row"];
export type DREInsert = Tables["dre"]["Insert"];
export type DREUpdate = Tables["dre"]["Update"];

// Interfaces específicas para formulários e respostas de API
export interface NovaContaContabil {
  codigo: string;
  nome: string;
  tipo: "ativo" | "passivo" | "patrimonio_liquido" | "receita" | "despesa";
  categoria?: string;
  conta_pai_id?: string;
  nivel?: number;
  ativo?: boolean;
}

export interface NovoLancamentoContabil {
  data_lancamento: string;
  data_competencia: string;
  numero_documento?: string;
  historico: string;
  valor: number;
  tipo_lancamento: "debito" | "credito";
  conta_debito_id: string;
  conta_credito_id: string;
  unidade_id: string;
  profissional_id?: string;
  cliente_id?: string;
  servico_id?: string;
  assinatura_id?: string;
  produto_id?: string;
  status?: "pendente" | "confirmado" | "cancelado";
  created_by: string;
}

export interface NovoCentroCusto {
  codigo: string;
  nome: string;
  descricao?: string;
  unidade_id: string;
  ativo?: boolean;
}

export interface NovoDRE {
  data_inicio: string;
  data_fim: string;
  unidade_id: string;
  created_by: string;
}

// Schemas Zod para validação
export const contaContabilSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(20, "Código muito longo"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255, "Nome muito longo"),
  tipo: z.enum(["ativo", "passivo", "patrimonio_liquido", "receita", "despesa"], {
    errorMap: () => ({ message: "Tipo deve ser: ativo, passivo, patrimonio_liquido, receita ou despesa" })
  }),
  categoria: z.string().max(100, "Categoria muito longa").optional(),
  conta_pai_id: z.string().uuid("ID da conta pai deve ser um UUID válido").optional(),
  nivel: z.number().int().min(1, "Nível deve ser pelo menos 1").max(10, "Nível muito alto").optional(),
  ativo: z.boolean().optional()
});

export const lancamentoContabilSchema = z.object({
  data_lancamento: z.string().refine((val) => !isNaN(Date.parse(val)), "Data de lançamento inválida"),
  data_competencia: z.string().refine((val) => !isNaN(Date.parse(val)), "Data de competência inválida"),
  numero_documento: z.string().max(100, "Número do documento muito longo").optional(),
  historico: z.string().min(3, "Histórico deve ter pelo menos 3 caracteres").max(1000, "Histórico muito longo"),
  valor: z.coerce.number().positive("Valor deve ser positivo").max(999999999.99, "Valor muito alto"),
  tipo_lancamento: z.enum(["debito", "credito"], {
    errorMap: () => ({ message: "Tipo de lançamento deve ser: debito ou credito" })
  }),
  conta_debito_id: z.string().uuid("ID da conta de débito deve ser um UUID válido"),
  conta_credito_id: z.string().uuid("ID da conta de crédito deve ser um UUID válido"),
  unidade_id: z.string().min(1, "ID da unidade é obrigatório"),
  profissional_id: z.string().uuid("ID do profissional deve ser um UUID válido").optional(),
  cliente_id: z.string().uuid("ID do cliente deve ser um UUID válido").optional(),
  servico_id: z.string().uuid("ID do serviço deve ser um UUID válido").optional(),
  assinatura_id: z.string().uuid("ID da assinatura deve ser um UUID válido").optional(),
  produto_id: z.string().uuid("ID do produto deve ser um UUID válido").optional(),
  status: z.enum(["pendente", "confirmado", "cancelado"], {
    errorMap: () => ({ message: "Status deve ser: pendente, confirmado ou cancelado" })
  }).optional(),
  created_by: z.string().uuid("ID do usuário criador deve ser um UUID válido")
});

export const centroCustoSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(20, "Código muito longo"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255, "Nome muito longo"),
  descricao: z.string().max(1000, "Descrição muito longa").optional(),
  unidade_id: z.string().min(1, "ID da unidade é obrigatório"),
  ativo: z.boolean().optional()
});

export const dreSchema = z.object({
  data_inicio: z.string().refine((val) => !isNaN(Date.parse(val)), "Data de início inválida"),
  data_fim: z.string().refine((val) => !isNaN(Date.parse(val)), "Data de fim inválida"),
  unidade_id: z.string().min(1, "ID da unidade é obrigatório"),
  created_by: z.string().uuid("ID do usuário criador deve ser um UUID válido")
});

// Schemas para atualizações (campos opcionais)
export const contaContabilUpdateSchema = contaContabilSchema.partial().extend({
  id: z.string().uuid("ID deve ser um UUID válido")
});

export const lancamentoContabilUpdateSchema = lancamentoContabilSchema.partial().extend({
  id: z.string().uuid("ID deve ser um UUID válido")
});

export const centroCustoUpdateSchema = centroCustoSchema.partial().extend({
  id: z.string().uuid("ID deve ser um UUID válido")
});

export const dreUpdateSchema = dreSchema.partial().extend({
  id: z.string().uuid("ID deve ser um UUID válido")
});

// Tipos para respostas de API
export interface ContaContabilResponse {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  categoria?: string;
  nivel: number;
  ativo: boolean;
  saldo_atual?: number;
}

export interface LancamentoContabilResponse {
  id: string;
  data_lancamento: string;
  data_competencia: string;
  historico: string;
  valor: number;
  tipo_lancamento: string;
  conta_debito: string;
  conta_credito: string;
  status: string;
  unidade_id: string;
}

export interface CentroCustoResponse {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  unidade_id: string;
  ativo: boolean;
}

export interface DREResponse {
  id: string;
  data_inicio: string;
  data_fim: string;
  unidade_id: string;
  receita_bruta: number;
  receita_liquida: number;
  lucro_bruto: number;
  lucro_operacional: number;
  lucro_liquido: number;
  status: string;
}

// Tipos para filtros e consultas
export interface FiltroContasContabeis {
  tipo?: string;
  categoria?: string;
  ativo?: boolean;
  unidade_id?: string;
}

export interface FiltroLancamentosContabeis {
  data_inicio?: string;
  data_fim?: string;
  tipo_lancamento?: string;
  conta_id?: string;
  unidade_id?: string;
  status?: string;
}

export interface FiltroCentrosCusto {
  ativo?: boolean;
  unidade_id?: string;
}

export interface FiltroDRE {
  data_inicio?: string;
  data_fim?: string;
  unidade_id?: string;
  status?: string;
}

// Tipos para cálculos e relatórios
export interface SaldoConta {
  conta_id: string;
  conta_codigo: string;
  conta_nome: string;
  saldo_debito: number;
  saldo_credito: number;
  saldo_final: number;
}

export interface ResultadoDRE {
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  custos_servicos: number;
  lucro_bruto: number;
  despesas_operacionais: number;
  lucro_operacional: number;
  receitas_financeiras: number;
  despesas_financeiras: number;
  lucro_antes_ir: number;
  provisao_ir: number;
  lucro_liquido: number;
}

// Os tipos já estão sendo exportados acima, não é necessário re-exportar
