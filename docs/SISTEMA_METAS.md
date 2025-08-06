# Sistema de Metas - Documentação

## 📋 Visão Geral

O sistema de Metas permite definir metas individuais para cada barbeiro, com bonificações automáticas quando as metas são atingidas. O sistema é separado por unidade (BarberBeer e Trato de Barbados).

## 🏗️ Estrutura do Sistema

### 1. Tabelas no Supabase

#### `metas_barberbeer`

- Armazena metas dos barbeiros da BarberBeer
- Campos: id, barbeiro_id, mes, ano, meta_venda_produto, meta_faturamento, tipo_bonificacao, valor_bonificacao, foi_batida, criado_em, atualizado_em

#### `metas_trato`

- Armazena metas dos barbeiros da Trato de Barbados
- Campos: id, barbeiro_id, mes, ano, meta_venda_produto, meta_faturamento, tipo_bonificacao, valor_bonificacao, foi_batida, criado_em, atualizado_em

### 2. Páginas do Sistema

#### `/cadastros/metas-barberbeer`

- Interface para gerenciar metas da BarberBeer
- Filtra automaticamente barbeiros da unidade BarberBeer

#### `/cadastros/metas-trato`

- Interface para gerenciar metas da Trato de Barbados
- Filtra automaticamente barbeiros da unidade Trato de Barbados

## 🎯 Funcionalidades

### 1. Cadastro de Metas

- **Barbeiro**: Seleção dinâmica baseada na unidade
- **Período**: Mês e ano da meta
- **Meta de Venda de Produtos**: Valor em R$
- **Meta de Faturamento**: Valor em R$ (serviços)
- **Tipo de Bonificação**: Valor Fixo (R$) ou Porcentagem (%)
- **Valor da Bonificação**: Valor fixo ou percentual

### 2. Visualização de Metas

- Tabela organizada por barbeiro e período
- Status visual: "Meta Batida ✅" ou "Em Andamento"
- Ações: Editar e Excluir

### 3. Cálculo Automático

- Verificação automática se metas foram batidas
- Cálculo de bonificações baseado em vendas reais
- Integração com fechamento mensal

## 🔧 Como Usar

### 1. Criar uma Meta

1. Acesse **Cadastros > Metas** (filtrado por unidade)
2. Clique em **"Adicionar Meta"**
3. Preencha os campos:
   - **Barbeiro**: Selecione o barbeiro
   - **Mês/Ano**: Período da meta
   - **Meta Produtos**: Valor em R$ para vendas de produtos
   - **Meta Faturamento**: Valor em R$ para faturamento total
   - **Tipo de Bonificação**: Fixo ou Percentual
   - **Valor da Bonificação**: Valor da bonificação
4. Clique em **"Salvar"**

### 2. Editar Meta

1. Na tabela de metas, clique no ícone de **editar**
2. Modifique os campos desejados
3. Clique em **"Atualizar"**

### 3. Excluir Meta

1. Na tabela de metas, clique no ícone de **excluir**
2. Confirme a exclusão

## 💰 Sistema de Bonificações

### Tipos de Bonificação

#### 1. Valor Fixo (R$)

- Bonificação de valor fixo quando meta é batida
- Exemplo: R$ 500,00 de bonificação

#### 2. Porcentagem (%)

- Bonificação percentual sobre o faturamento total
- Exemplo: 5% sobre o faturamento do mês

### Cálculo Automático

O sistema calcula automaticamente:

1. **Vendas de Produtos**: Soma todas as vendas de produtos do barbeiro no mês
2. **Faturamento de Serviços**: Soma todos os serviços concluídos do barbeiro no mês
3. **Verificação de Meta**: Compara valores reais com as metas definidas
4. **Aplicação de Bonificação**: Adiciona automaticamente ao fechamento mensal

## 🔄 Integração com Fechamento Mensal

### 1. Componente de Bonificação

Use o componente `BonificacaoMetas` no fechamento mensal:

```tsx
import BonificacaoMetas from "@/components/BonificacaoMetas";

// No seu componente de fechamento
<BonificacaoMetas
  barbeiroId={barbeiro.id}
  barbeiroNome={barbeiro.nome}
  mes="12"
  ano="2024"
  unidade="barberbeer" // ou "trato"
  comissaoBase={comissaoBase}
/>;
```

### 2. Aplicação Automática

Para aplicar bonificações automaticamente:

```tsx
import { aplicarBonificacoesFechamento } from "@/utils/metasUtils";

// No fechamento do mês
await aplicarBonificacoesFechamento("12", "2024", "barberbeer");
```

## 📊 Relatórios e Auditoria

### 1. Metas Batidas

- Visualização de todas as metas que foram atingidas
- Histórico de bonificações aplicadas
- Relatórios por período

### 2. Performance por Barbeiro

- Comparação entre metas e resultados reais
- Análise de tendências
- Identificação de oportunidades de melhoria

## ⚙️ Configurações

### 1. Variáveis de Ambiente

Certifique-se de que as variáveis do Supabase estão configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 2. IDs das Unidades

- **BarberBeer**: `87884040-cafc-4625-857b-6e0402ede7d7`
- **Trato de Barbados**: Outros IDs (configurar conforme necessário)

## 🚀 Próximos Passos

### 1. Implementações Futuras

- Relatórios detalhados de performance
- Notificações automáticas quando metas são batidas
- Dashboard de metas em tempo real
- Integração com sistema de comissões existente

### 2. Melhorias Sugeridas

- Filtros avançados por período
- Exportação de relatórios
- Gráficos de progresso
- Metas em grupo/equipe

## 🐛 Troubleshooting

### Problemas Comuns

1. **Metas não aparecem**: Verificar se o barbeiro está na unidade correta
2. **Bonificação não aplica**: Verificar se as vendas estão sendo registradas corretamente
3. **Erro de cálculo**: Verificar se as tabelas de vendas existem e estão corretas

### Logs e Debug

Use o console do navegador para verificar:

- Erros de conexão com Supabase
- Valores calculados incorretamente
- Problemas de permissões

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do console
2. Confirmar configurações do Supabase
3. Testar com dados de exemplo
4. Contatar equipe de desenvolvimento

---

**Versão**: 1.0  
**Última atualização**: Dezembro 2024  
**Responsável**: Sistema de Metas
