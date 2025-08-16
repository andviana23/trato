# 🔒 Melhorias de RLS (Row Level Security) Implementadas

## 📋 Visão Geral

Este documento descreve as melhorias implementadas no sistema de Row Level Security (RLS) do sistema Trato de Barbados, visando reforçar a segurança dos dados e garantir o isolamento adequado entre unidades.

---

## 🎯 Objetivos das Melhorias

### 1. **Isolamento de Dados por Unidade**

- Garantir que usuários só possam acessar dados de sua própria unidade
- Prevenir vazamento de informações entre diferentes barbearias
- Manter confidencialidade dos dados de cada unidade

### 2. **Controle de Acesso Baseado em Roles**

- Implementar diferentes níveis de acesso baseados no role do usuário
- Restringir operações sensíveis apenas para usuários autorizados
- Permitir acesso granular por tipo de operação

### 3. **Proteção de Recursos Pessoais**

- Usuários só podem gerenciar seus próprios recursos
- Proteção contra acesso não autorizado a dados pessoais
- Auditoria de todas as operações críticas

---

## 🏗️ Arquitetura Implementada

### **Funções Auxiliares para RLS**

#### `is_admin_or_owner()`

```sql
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'barbershop_owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Propósito**: Verifica se o usuário tem privilégios administrativos

#### `is_professional()`

```sql
CREATE OR REPLACE FUNCTION is_professional()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('professional', 'barbeiro')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Propósito**: Verifica se o usuário é um profissional

#### `is_recepcionista()`

```sql
CREATE OR REPLACE FUNCTION is_recepcionista()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'recepcionista'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Propósito**: Verifica se o usuário é um recepcionista

#### `has_unit_access(unidade_id_param UUID)`

```sql
CREATE OR REPLACE FUNCTION has_unit_access(unidade_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admins e proprietários têm acesso a todas as unidades
    IF is_admin_or_owner() THEN
        RETURN TRUE;
    END IF;

    -- Profissionais e recepcionistas só têm acesso à sua unidade
    RETURN EXISTS (
        SELECT 1 FROM professionals
        WHERE user_id = auth.uid()
        AND unidade_id = unidade_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Propósito**: Verifica se o usuário tem acesso à unidade especificada

#### `is_own_resource(resource_user_id UUID)`

```sql
CREATE OR REPLACE FUNCTION is_own_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Propósito**: Verifica se o usuário é o dono do recurso

---

## 📊 Tabelas Protegidas por RLS

### **1. Tabelas de Autenticação e Usuários**

#### `profiles`

- **SELECT**: Usuários podem ver apenas seu próprio perfil
- **UPDATE**: Usuários podem atualizar apenas seu próprio perfil
- **INSERT**: Apenas admins podem inserir novos perfis
- **DELETE**: Apenas admins podem deletar perfis

#### `google_auth_tokens`

- **SELECT**: Usuários podem ver apenas seus próprios tokens
- **INSERT**: Sistema pode inserir tokens
- **UPDATE**: Usuários podem atualizar apenas seus próprios tokens
- **DELETE**: Usuários podem deletar apenas seus próprios tokens

### **2. Tabelas de Estrutura Organizacional**

#### `unidades`

- **SELECT**: Todos os usuários autenticados podem ver unidades
- **ALL**: Apenas admins podem gerenciar unidades

#### `categorias`

- **SELECT**: Todos os usuários autenticados podem ver categorias
- **ALL**: Apenas admins podem gerenciar categorias

#### `marcas`

- **SELECT**: Todos os usuários autenticados podem ver marcas
- **ALL**: Apenas admins podem gerenciar marcas

#### `planos`

- **SELECT**: Todos os usuários autenticados podem ver planos
- **ALL**: Apenas admins podem gerenciar planos

### **3. Tabelas de Usuários e Profissionais**

#### `profissionais`

- **SELECT**: Usuários podem ver profissionais de sua unidade
- **INSERT**: Apenas admins podem inserir profissionais
- **UPDATE**: Apenas admins podem atualizar profissionais
- **DELETE**: Apenas admins podem deletar profissionais

#### `clients`

- **SELECT**: Usuários podem ver clientes de sua unidade
- **INSERT**: Usuários podem inserir clientes em sua unidade
- **UPDATE**: Usuários podem atualizar clientes de sua unidade
- **DELETE**: Usuários podem deletar clientes de sua unidade

### **4. Tabelas de Serviços e Agendamentos**

#### `servicos`

- **SELECT**: Usuários podem ver serviços de sua unidade
- **ALL**: Apenas admins podem gerenciar serviços

#### `servicos_avulsos`

- **SELECT**: Usuários podem ver serviços avulsos de sua unidade
- **ALL**: Apenas admins podem gerenciar serviços avulsos

#### `appointments`

- **SELECT**: Usuários podem ver agendamentos de sua unidade
- **INSERT**: Usuários podem criar agendamentos em sua unidade
- **UPDATE**: Usuários podem atualizar agendamentos de sua unidade
- **DELETE**: Usuários podem deletar agendamentos de sua unidade

#### `agendamentos`

- **SELECT**: Usuários podem ver agendamentos de sua unidade
- **INSERT**: Usuários autenticados podem criar agendamentos
- **UPDATE**: Usuários podem atualizar agendamentos de sua unidade
- **DELETE**: Usuários podem deletar agendamentos de sua unidade

### **5. Tabelas de Produtos**

#### `produtos_trato_de_barbados`

- **SELECT**: Usuários podem ver produtos de sua unidade
- **ALL**: Admins e recepcionistas podem gerenciar produtos

#### `produtos_barberbeer`

- **SELECT**: Usuários podem ver produtos de sua unidade
- **ALL**: Admins e recepcionistas podem gerenciar produtos

### **6. Tabelas de Vendas e Financeiro**

#### `vendas_produtos`

- **SELECT**: Usuários podem ver vendas de sua unidade
- **INSERT**: Admins, recepcionistas e profissionais podem criar vendas
- **UPDATE**: Apenas admins podem atualizar vendas
- **DELETE**: Apenas admins podem deletar vendas

#### `faturamento_assinatura`

- **SELECT**: Usuários podem ver faturamento de sua unidade
- **ALL**: Apenas admins podem gerenciar faturamento

#### `subscriptions`

- **SELECT**: Usuários podem ver assinaturas de sua unidade + clientes veem suas próprias
- **ALL**: Admins e recepcionistas podem gerenciar assinaturas

### **7. Tabelas de Metas e Comissões**

#### `metas`

- **SELECT**: Usuários podem ver metas de sua unidade
- **INSERT**: Admins e profissionais podem criar metas
- **UPDATE**: Admins e o profissional dono podem atualizar metas
- **DELETE**: Apenas admins podem deletar metas

#### `bonus`

- **SELECT**: Usuários podem ver bônus de sua unidade
- **ALL**: Apenas admins podem gerenciar bônus

#### `comissoes_avulses`

- **SELECT**: Usuários podem ver comissões de sua unidade + profissionais veem suas próprias
- **ALL**: Apenas admins podem gerenciar comissões

#### `metas_barberbeer`

- **SELECT**: Usuários podem ver metas de sua unidade
- **ALL**: Apenas admins podem gerenciar metas

#### `metas_trato`

- **SELECT**: Usuários podem ver metas de sua unidade
- **ALL**: Apenas admins podem gerenciar metas

### **8. Tabelas de Agenda e Horários**

#### `expedientes`

- **SELECT**: Usuários podem ver expedientes de sua unidade
- **ALL**: Admins e recepcionistas podem gerenciar expedientes

#### `excecoes_agenda`

- **SELECT**: Usuários podem ver exceções de sua unidade
- **ALL**: Admins e recepcionistas podem gerenciar exceções

#### `bloqueios_horarios`

- **SELECT**: Usuários podem ver bloqueios de sua unidade
- **ALL**: Admins e recepcionistas podem gerenciar bloqueios

#### `time_blocks`

- **SELECT**: Usuários podem ver bloqueios de tempo de sua unidade
- **ALL**: Admins e recepcionistas podem gerenciar bloqueios

### **9. Tabelas de Fila**

#### `barber_queue`

- **SELECT**: Usuários podem ver fila de sua unidade
- **ALL**: Admins podem gerenciar fila + profissionais podem atualizar sua própria linha

#### `queue`

- **SELECT**: Usuários podem ver fila de sua unidade
- **ALL**: Usuários autenticados podem gerenciar fila de sua unidade

### **10. Tabelas de Receita e Metas Mensais**

#### `monthly_revenue`

- **SELECT**: Usuários podem ver receita de sua unidade
- **ALL**: Apenas admins podem gerenciar receita mensal

#### `monthly_goals`

- **SELECT**: Usuários podem ver metas mensais de sua unidade
- **ALL**: Apenas admins podem gerenciar metas mensais

### **11. Tabelas de Integração**

#### `webhook_logs`

- **SELECT**: Apenas admins podem ver logs de webhook
- **INSERT**: Sistema pode inserir logs
- **ALL**: Apenas admins podem modificar logs

#### `notification_logs`

- **SELECT**: Usuários podem ver logs de notificação de sua unidade
- **INSERT**: Sistema pode inserir logs
- **ALL**: Apenas admins podem modificar logs

#### `integration_settings`

- **SELECT**: Apenas admins podem ver configurações de integração
- **INSERT**: Sistema pode inserir configurações
- **ALL**: Apenas admins podem modificar configurações

---

## 🔍 Políticas de Segurança Implementadas

### **1. Isolamento por Unidade**

```sql
-- Exemplo para tabela clientes
CREATE POLICY "Users can view clients in their unit" ON clientes
    FOR SELECT USING (
        has_unit_access(
            (SELECT id FROM unidades WHERE nome = clientes.unidade LIMIT 1)
        )
    );
```

### **2. Controle por Role**

```sql
-- Exemplo para tabela produtos
CREATE POLICY "Admins and recepcionistas can manage products" ON produtos_trato_de_barbados
    FOR ALL USING (
        is_admin_or_owner() OR is_recepcionista()
    );
```

### **3. Propriedade de Recursos**

```sql
-- Exemplo para tabela profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (is_own_resource(id));
```

### **4. Políticas Granulares**

```sql
-- Exemplo para tabela vendas
CREATE POLICY "Authorized users can create sales" ON vendas_produtos
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR is_recepcionista() OR is_professional()
    );

CREATE POLICY "Only admins can modify sales" ON vendas_produtos
    FOR UPDATE USING (is_admin_or_owner());
```

---

## 🧪 Testes de Isolamento Implementados

### **Script de Teste: `test-rls-isolation.js`**

O script implementa testes abrangentes para verificar:

1. **Testes de Isolamento por Unidade**

   - Verificação de acesso a clientes
   - Verificação de acesso a profissionais
   - Verificação de acesso a agendamentos

2. **Testes de Controle de Acesso por Role**

   - Acesso a categorias (visível para todos autenticados)
   - Acesso a produtos (isolado por unidade)
   - Acesso a metas (isolado por unidade)

3. **Testes de Propriedade de Recursos**

   - Acesso ao próprio perfil
   - Acesso a tokens de autenticação próprios

4. **Testes de Auditoria**

   - Verificação da tabela de auditoria
   - Teste de inserção de logs

5. **Testes de Políticas Específicas**

   - Políticas de fila de barbeiros
   - Políticas de notificações
   - Políticas de vendas

6. **Testes de Funções Auxiliares**
   - `is_admin_or_owner()`
   - `is_professional()`
   - `has_unit_access()`

---

## 📈 Benefícios das Melhorias

### **1. Segurança**

- ✅ Isolamento completo de dados entre unidades
- ✅ Controle granular de acesso baseado em roles
- ✅ Proteção contra acesso não autorizado
- ✅ Auditoria de todas as operações críticas

### **2. Compliance**

- ✅ Conformidade com regulamentações de proteção de dados
- ✅ Rastreabilidade completa de operações
- ✅ Separação adequada de responsabilidades

### **3. Manutenibilidade**

- ✅ Funções auxiliares reutilizáveis
- ✅ Políticas centralizadas e consistentes
- ✅ Fácil manutenção e atualização

### **4. Performance**

- ✅ Políticas otimizadas para consultas
- ✅ Índices apropriados para verificações de segurança
- ✅ Mínimo impacto no desempenho das consultas

---

## 🚀 Como Executar as Melhorias

### **1. Aplicar a Migração SQL**

```bash
# Executar no Supabase Dashboard > SQL Editor
# Arquivo: supabase/migrations/20241224000002_improve_rls_policies.sql
```

### **2. Executar Testes de Isolamento**

```bash
# Instalar dependências
npm install dotenv @supabase/supabase-js

# Executar testes
node scripts/test-rls-isolation.js
```

### **3. Verificar Logs de Auditoria**

```sql
-- Verificar logs recentes
SELECT * FROM audit_logs
ORDER BY timestamp DESC
LIMIT 10;
```

---

## 🔧 Configuração e Personalização

### **1. Ajustar Políticas por Unidade**

```sql
-- Exemplo: Política específica para unidade Trato
CREATE POLICY "Trato specific policy" ON clientes
    FOR SELECT USING (
        clientes.unidade = 'Trato' AND has_unit_access(
            (SELECT id FROM unidades WHERE nome = 'Trato' LIMIT 1)
        )
    );
```

### **2. Adicionar Novos Roles**

```sql
-- Exemplo: Adicionar role 'gerente'
CREATE POLICY "Managers can manage their unit" ON clientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'gerente'
        )
    );
```

### **3. Políticas Temporárias**

```sql
-- Exemplo: Política para manutenção
CREATE POLICY "Maintenance access" ON clientes
    FOR ALL USING (
        current_setting('app.maintenance_mode') = 'true'
    );
```

---

## 📊 Monitoramento e Manutenção

### **1. Verificar Políticas Ativas**

```sql
-- Listar todas as políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### **2. Monitorar Logs de Auditoria**

```sql
-- Logs por ação
SELECT
    action,
    COUNT(*) as total,
    COUNT(CASE WHEN success THEN 1 END) as successful,
    COUNT(CASE WHEN NOT success THEN 1 END) as failed
FROM audit_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY total DESC;
```

### **3. Verificar Performance das Políticas**

```sql
-- Consulta para analisar performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM clientes
WHERE has_unit_access(
    (SELECT id FROM unidades WHERE nome = clientes.unidade LIMIT 1)
);
```

---

## ⚠️ Considerações Importantes

### **1. Backup e Rollback**

- Sempre faça backup antes de aplicar políticas RLS
- Mantenha scripts de rollback para cada migração
- Teste em ambiente de desenvolvimento primeiro

### **2. Performance**

- Monitore o impacto das políticas no desempenho
- Use índices apropriados para consultas frequentes
- Considere cache para operações repetitivas

### **3. Usabilidade**

- Treine usuários sobre as novas restrições
- Documente mudanças no comportamento do sistema
- Forneça feedback claro sobre operações negadas

---

## 🔮 Próximos Passos

### **1. Implementação Imediata**

- [x] Aplicar migração SQL de RLS
- [x] Executar testes de isolamento
- [x] Verificar políticas em ambiente de produção
- [ ] Monitorar logs de auditoria
- [ ] Treinar usuários sobre as novas restrições

### **2. Melhorias Futuras**

- [ ] Implementar cache para verificações de permissão
- [ ] Adicionar métricas de performance das políticas
- [ ] Criar dashboard de monitoramento de segurança
- [ ] Implementar alertas para tentativas de acesso não autorizado

### **3. Documentação e Treinamento**

- [ ] Criar guia de usuário para as novas restrições
- [ ] Documentar casos de uso comuns
- [ ] Treinar equipe de suporte
- [ ] Criar FAQ sobre problemas comuns

---

## 📞 Suporte e Contato

Para dúvidas sobre as implementações de RLS:

- **Documentação**: Este arquivo e arquivos relacionados
- **Scripts de Teste**: `scripts/test-rls-isolation.js`
- **Migrações SQL**: `supabase/migrations/20241224000002_improve_rls_policies.sql`
- **Logs de Auditoria**: Tabela `audit_logs`

---

_Última atualização: 2024-12-24_
_Versão: 1.0_
_Status: Implementado e Testado_
