# 📋 DOCUMENTAÇÃO DAS SERVER ACTIONS FINANCEIRAS

## 📋 Visão Geral

Este documento descreve todas as Server Actions implementadas para o módulo financeiro do sistema Trato de Barbados, incluindo parâmetros, retornos e funcionalidades.

---

## 🏗️ Estrutura das Server Actions

### **Padrão de Implementação**

Todas as Server Actions seguem o padrão estabelecido:

- **Retorno**: `ActionResult<T>` para consistência
- **Validação**: Schemas Zod para validação de entrada
- **Tratamento de Erros**: Blocos try/catch robustos
- **Auditoria**: Logs automáticos de todas as operações
- **Cache**: Revalidação automática das páginas relevantes

---

## 📊 Server Actions de Relatórios Financeiros

### **1. `getDREData` - Geração de DRE**

**Arquivo**: `app/actions/reports.ts`

**Objetivo**: Busca e processa dados do DRE (Demonstrativo de Resultado do Exercício) para um período específico.

**Parâmetros**:

```typescript
{
  period: {
    from: string;    // Data de início (YYYY-MM-DD)
    to: string;      // Data de fim (YYYY-MM-DD)
  };
  unidade_id?: string;           // ID da unidade (opcional, padrão: 'trato')
  include_audit_trail?: boolean; // Incluir trilha de auditoria (opcional)
}
```

**Funcionalidades**:

- ✅ Validação de entrada com Zod
- ✅ Autenticação de usuário
- ✅ Chamada da função SQL `calculate_dre`
- ✅ Processamento e formatação dos dados
- ✅ Cálculo de margens e indicadores
- ✅ Log de auditoria automático
- ✅ Revalidação de cache

**Retorno**:

```typescript
ActionResult<DREData> = {
  success: true;
  data: {
    periodo: { data_inicio: string; data_fim: string; unidade_id: string };
    receitas: { receita_bruta: number; receita_liquida: number; deducoes: number };
    custos: { custos_servicos: number; outros_custos: number };
    despesas: { despesas_operacionais: number; despesas_financeiras: number };
    resultado: { lucro_bruto: number; lucro_operacional: number; lucro_liquido: number };
    margens: { margem_bruta: number; margem_operacional: number; margem_liquida: number };
    audit_trail?: DREAuditDetail[];
  };
}
```

**Exemplo de Uso**:

```typescript
import { getDREData } from "@/app/actions/reports";

const dreResult = await getDREData({
  period: { from: "2024-01-01", to: "2024-01-31" },
  unidade_id: "trato",
  include_audit_trail: true,
});

if (dreResult.success) {
  console.log("Receita Líquida:", dreResult.data.receitas.receita_liquida);
  console.log("Lucro Líquido:", dreResult.data.resultado.lucro_liquido);
}
```

---

### **2. `getDREComparison` - Comparação de Períodos**

**Objetivo**: Compara DRE de dois períodos diferentes, calculando variações absolutas e percentuais.

**Parâmetros**:

```typescript
{
  current: Period;   // Período atual
  previous: Period;  // Período anterior
  unidade_id?: string;
}
```

**Funcionalidades**:

- ✅ Comparação de todos os indicadores financeiros
- ✅ Cálculo de variações absolutas e percentuais
- ✅ Identificação de tendências de crescimento
- ✅ Análise de sazonalidade

**Retorno**:

```typescript
ActionResult<DREComparison> = {
  success: true;
  data: {
    current_period: DREData;
    previous_period: DREData;
    variations: {
      receitas: { absolute: number; percentage: number };
      custos: { absolute: number; percentage: number };
      despesas: { absolute: number; percentage: number };
      resultado: { absolute: number; percentage: number };
    };
    trends: { growth: boolean; strength: 'weak' | 'moderate' | 'strong' };
  };
}
```

---

### **3. `exportDREReport` - Exportação de Relatórios**

**Objetivo**: Exporta dados do DRE em formatos JSON ou CSV para análise externa.

**Parâmetros**:

```typescript
{
  period: Period;
  format: 'json' | 'csv';
  unidade_id?: string;
}
```

**Funcionalidades**:

- ✅ Exportação em formato JSON estruturado
- ✅ Exportação em formato CSV com headers
- ✅ Nomes de arquivo com convenção de período
- ✅ Validação de formato de saída

**Retorno**:

```typescript
ActionResult<{ content: string; filename: string; format: string }>;
```

---

### **4. `getFinancialSummary` - Resumo Financeiro**

**Objetivo**: Retorna resumo financeiro rápido com indicadores de crescimento.

**Parâmetros**:

```typescript
{
  period: Period;
  unidade_id?: string;
}
```

**Funcionalidades**:

- ✅ Resumo consolidado de receitas e despesas
- ✅ Comparação com período anterior
- ✅ Indicadores de crescimento percentual
- ✅ Métricas de lucratividade

---

### **5. `getCashFlow` - Análise de Fluxo de Caixa**

**Objetivo**: Analisa entradas e saídas de caixa ao longo do período.

**Parâmetros**:

```typescript
{
  period: Period;
  unidade_id?: string;
  group_by: 'day' | 'week' | 'month';
}
```

**Funcionalidades**:

- ✅ Agrupamento por dia, semana ou mês
- ✅ Análise de sazonalidade
- ✅ Identificação de padrões de fluxo
- ✅ Projeções baseadas em histórico

---

### **6. `getProfitabilityAnalysis` - Análise de Lucratividade**

**Objetivo**: Calcula métricas chave de lucratividade e eficiência operacional.

**Parâmetros**:

```typescript
{
  period: Period;
  unidade_id?: string;
}
```

**Funcionalidades**:

- ✅ Margens de lucratividade
- ✅ Indicadores de eficiência operacional
- ✅ Análise de custos por serviço
- ✅ Benchmarking com períodos anteriores

---

## 🔍 Server Actions de Validação e Auditoria

### **7. `validateFinancialData` - Validação Completa**

**Objetivo**: Executa validação completa de dados financeiros com 6 tipos de verificação.

**Parâmetros**:

```typescript
{
  period: Period;
  unidade_id?: string;
  include_detailed_audit?: boolean;
}
```

**Tipos de Validação**:

1. **Integridade Referencial** - Verifica relacionamentos entre tabelas
2. **Balanceamento Contábil** - Valida débitos = créditos
3. **Consistência de Valores** - Detecta valores anômalos
4. **Consistência de Datas** - Valida períodos e sequências
5. **Detecção de Anomalias** - Identifica padrões suspeitos
6. **Completude dos Dados** - Verifica dados obrigatórios

**Retorno**:

```typescript
ActionResult<DataValidationResult> = {
  success: true;
  data: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: {
      total_checks: number;
      passed_checks: number;
      failed_checks: number;
      warning_checks: number;
    };
    data_quality_score: number;
  };
}
```

---

### **8. `generateAuditReport` - Relatório de Auditoria**

**Objetivo**: Gera relatório completo de auditoria com todas as validações e análises.

**Parâmetros**:

```typescript
{
  period: Period;
  unidade_id?: string;
}
```

**Funcionalidades**:

- ✅ Execução de todas as validações
- ✅ Cálculo de scores de qualidade
- ✅ Reconciliação contábil
- ✅ Detecção de lançamentos suspeitos
- ✅ Relatório consolidado em formato estruturado

---

## 💰 Server Actions de Processamento Financeiro

### **9. `processAutomaticRevenue` - Processamento de Receitas**

**Arquivo**: `app/actions/financial.ts`

**Objetivo**: Processa receita automática a partir de webhook de pagamento ASAAS.

**Parâmetros**:

```typescript
PaymentWebhookData = {
  event: string;
  payment: {
    id: string;
    customer: string;
    value: number;        // Em centavos
    description: string;
    billingType: string;
    // ... outros campos
  };
  timestamp: string;
  webhookId: string;
}
```

**Funcionalidades**:

- ✅ Verificação de duplicatas
- ✅ Busca de contas contábeis padrão
- ✅ Criação de lançamento contábil
- ✅ Registro de receita automática
- ✅ Log de auditoria completo
- ✅ Revalidação de cache

**Retorno**:

```typescript
ActionResult<AutomaticRevenueResult> = {
  success: true;
  data: {
    id: string;
    payment_id: string;
    customer_id: string;
    value: number;
    description: string;
    lancamento_id: string;
    created_at: string;
  };
}
```

---

### **10. `getAutomaticRevenues` - Busca de Receitas**

**Objetivo**: Busca receitas automáticas processadas com filtros e paginação.

**Parâmetros**:

```typescript
{
  filters: {
    payment_id?: string;
    customer_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    unidade_id?: string;
  };
  page: number;
  limit: number;
}
```

**Funcionalidades**:

- ✅ Filtros múltiplos
- ✅ Paginação configurável
- ✅ Ordenação por data
- ✅ Contagem total de registros

---

### **11. `recalculateAutomaticRevenues` - Reprocessamento**

**Objetivo**: Reprocessa lote de receitas automáticas para correções.

**Parâmetros**:

```typescript
{
  filters: {
    payment_id?: string;
    customer_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  };
}
```

**Funcionalidades**:

- ✅ Reprocessamento em lote
- ✅ Controle de erros individual
- ✅ Atualização de status
- ✅ Log de auditoria de reprocessamento

---

### **12. `getAutomaticRevenueStats` - Estatísticas**

**Objetivo**: Obtém estatísticas das receitas automáticas processadas.

**Parâmetros**:

```typescript
{
  unidade_id: string;
}
```

**Funcionalidades**:

- ✅ Contagem por status
- ✅ Totais por período
- ✅ Métricas de processamento
- ✅ Análise de performance

---

## 🔧 Server Actions de Utilitários

### **13. `validateReferentialIntegrity` - Validação Referencial**

**Função Interna**: Valida integridade referencial entre tabelas financeiras.

**Verificações**:

- ✅ Lançamentos contábeis → Contas contábeis
- ✅ Receitas automáticas → Lançamentos contábeis
- ✅ Centros de custo → Unidades
- ✅ Clientes → Unidades

---

### **14. `validateAccountingBalance` - Balanceamento Contábil**

**Função Interna**: Verifica se débitos = créditos em todos os períodos.

**Validações**:

- ✅ Soma de débitos = soma de créditos
- ✅ Tolerância de 1 centavo
- ✅ Verificação por período
- ✅ Identificação de desbalanceamentos

---

### **15. `detectAnomalies` - Detecção de Anomalias**

**Função Interna**: Identifica padrões suspeitos nos dados financeiros.

**Detecções**:

- ✅ Valores extremamente altos/baixos
- ✅ Padrões de transações suspeitas
- ✅ Inconsistências de datas
- ✅ Valores negativos inesperados

---

## 📊 Schemas de Validação Zod

### **Schemas Principais**

```typescript
// Período
const periodSchema = z.object({
  from: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Data de início inválida"),
  to: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Data de fim inválida"),
});

// Requisição DRE
const dreRequestSchema = z.object({
  period: periodSchema,
  unidade_id: z.string().min(1, "ID da unidade é obrigatório").optional(),
  include_audit_trail: z.boolean().default(false),
});

// Comparação DRE
const dreComparisonSchema = z.object({
  current: periodSchema,
  previous: periodSchema,
  unidade_id: z.string().min(1, "ID da unidade é obrigatório").optional(),
});
```

---

## 🚀 Como Usar as Server Actions

### **1. Importação**

```typescript
import {
  getDREData,
  getDREComparison,
  processAutomaticRevenue,
} from "@/app/actions/reports";
import { getAutomaticRevenues } from "@/app/actions/financial";
```

### **2. Exemplo de Uso Completo**

```typescript
// Gerar DRE mensal
const dreResult = await getDREData({
  period: { from: "2024-01-01", to: "2024-01-31" },
  unidade_id: "trato",
  include_audit_trail: true,
});

if (dreResult.success) {
  const dre = dreResult.data;

  // Usar dados do DRE
  console.log(`Receita Líquida: R$ ${dre.receitas.receita_liquida}`);
  console.log(`Lucro Líquido: R$ ${dre.resultado.lucro_liquido}`);
  console.log(`Margem Líquida: ${dre.margens.margem_liquida}%`);

  // Exportar relatório
  const exportResult = await exportDREReport({
    period: { from: "2024-01-01", to: "2024-01-31" },
    format: "csv",
  });
}
```

### **3. Validação de Dados**

```typescript
// Validar dados financeiros
const validationResult = await validateFinancialData({
  period: { from: "2024-01-01", to: "2024-01-31" },
  unidade_id: "trato",
  include_detailed_audit: true,
});

if (validationResult.success) {
  const validation = validationResult.data;

  if (validation.isValid) {
    console.log(`✅ Dados válidos - Score: ${validation.data_quality_score}%`);
  } else {
    console.log(`❌ ${validation.errors.length} erros encontrados`);
    validation.errors.forEach((error) => {
      console.log(`  - ${error.message} (${error.severity})`);
    });
  }
}
```

---

## 🔒 Segurança e Auditoria

### **Autenticação**

- ✅ Todas as Server Actions verificam autenticação
- ✅ Verificação de permissões por unidade
- ✅ Controle de acesso baseado em roles

### **Validação de Entrada**

- ✅ Schemas Zod para validação robusta
- ✅ Sanitização de dados de entrada
- ✅ Prevenção de SQL injection
- ✅ Validação de tipos TypeScript

### **Logs de Auditoria**

- ✅ Todas as operações são registradas
- ✅ Contexto completo (usuário, timestamp, dados)
- ✅ Rastreabilidade de mudanças
- ✅ Compliance e debugging

---

## 📈 Performance e Otimização

### **Índices de Banco**

- ✅ 11 índices críticos implementados
- ✅ Otimização para consultas DRE
- ✅ Cache materializado para relatórios frequentes
- ✅ Monitoramento automático de performance

### **Processamento Assíncrono**

- ✅ Webhook ASAAS → Fila BullMQ → Worker
- ✅ Processamento paralelo de validações
- ✅ Retry automático com backoff exponencial
- ✅ Concorrência configurável

---

## 🎯 Status de Implementação

### **✅ Concluído**

- Todas as Server Actions principais implementadas
- Sistema de validação robusto
- Auditoria completa
- Otimizações de performance
- Testes abrangentes

### **🚀 Pronto para Deploy**

- Código validado e testado
- Documentação completa
- Configurações de ambiente
- Scripts de migração
- Monitoramento implementado

---

**📋 Esta documentação garante que todas as Server Actions financeiras estejam prontas para deploy em produção, com funcionalidades robustas, validação completa e auditoria integrada.**
