export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: "assinante" | "avulso";
  cpf_cnpj?: string;
  endereco?: string;
  data_nascimento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
} 