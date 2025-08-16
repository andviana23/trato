# Testes de Qualidade - Sistema de Gestão

Este diretório contém os testes de qualidade para as funcionalidades críticas do sistema, garantindo segurança e comportamento correto da aplicação.

## 📋 Visão Geral dos Testes

### 🗓️ Testes de Agendamentos (`appointments.test.ts`)

**Objetivo**: Garantir que o sistema de agendamentos lida corretamente com conflitos e validações.

**Cenários testados**:

- **Validação de Dados**: Testa se a função retorna erro ao receber dados inválidos (data no passado, campos ausentes) antes de tentar acessar o banco de dados.
- **Conflito de Horário**: Testa se a função retorna erro de conflito ao tentar agendar um horário já ocupado por outro agendamento ou por um horário bloqueado.
- **Sucesso**: Testa criação bem-sucedida de agendamento e revalidação de cache.

**Por que é importante**: A validação de conflitos é uma funcionalidade crítica que previne agendamentos duplicados e garante a integridade do calendário.

### 💳 Testes de Pagamentos (`asaas-webhook.test.ts`)

**Objetivo**: Validar o processamento dos webhooks do ASAAS.

**Cenários testados**:

- **Assinatura Inválida**: Testa se a rota retorna HTTP 401 (Unauthorized) para webhooks com assinatura de segurança inválida.
- **Eventos Válidos**: Testa se eventos de pagamento bem-sucedidos (ex: `PAYMENT_CONFIRMED`) são processados corretamente.
- **Logs de Auditoria**: Testa se todos os webhooks recebidos são registrados no sistema de logs, independentemente do resultado.

**Por que é importante**: A segurança dos webhooks é crítica para o fluxo de pagamentos, e os logs de auditoria garantem rastreabilidade completa.

### 🎯 Testes de Metas (`metas.test.ts`)

**Objetivo**: Garantir que os cálculos de bonificação estão corretos.

**Cenários testados**:

- **Bônus Total**: Testa meta com 100%+ de progresso, verificando se o valor do bônus é o esperado.
- **Bônus Parcial**: Testa se o cálculo de bônus para progresso incompleto (ex: 80%) está correto.
- **Sem Bônus**: Testa se a função retorna zero para metas com baixo progresso que não atingiram o critério mínimo.

**Por que é importante**: Os cálculos de bônus afetam diretamente a remuneração e motivação dos profissionais.

### 🚶 Testes de Fila de Atendimento (`queue.test.ts`)

**Objetivo**: Garantir que a fila de atendimento se reorganiza de forma correta.

**Cenários testados**:

- **Passar a Vez**: Testa se um cliente "passando a vez" é movido para a última posição da fila, mantendo a ordem dos outros clientes.
- **Reorganização Manual**: Testa se a reorganização da fila com uma nova ordem de IDs é refletida corretamente no banco de dados.

**Por que é importante**: A ordem da fila afeta diretamente a experiência do cliente e a eficiência do atendimento.

## 🚀 Como Executar os Testes

### Pré-requisitos

- Node.js 18+ instalado
- Dependências do projeto instaladas (`npm install`)

### Comandos Disponíveis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (recomendado para desenvolvimento)
npm run test:watch

# Executar testes com cobertura de código
npm run test:coverage

# Executar testes específicos
npm test -- --testNamePattern="createAppointment"
npm test -- --testPathPattern="appointments"
```

### Estrutura de Diretórios

```
__tests__/
├── README.md                           # Esta documentação
├── actions/                            # Testes das Server Actions
│   ├── appointments.test.ts            # Testes de agendamentos
│   ├── metas.test.ts                   # Testes de metas
│   └── queue.test.ts                   # Testes de fila de atendimento
└── api/                                # Testes das API Routes
    └── asaas-webhook.test.ts           # Testes do webhook ASAAS
```

## 🔧 Configuração dos Testes

### Jest Configuration

Os testes usam Jest com as seguintes configurações:

- **Environment**: `jsdom` para simular ambiente de navegador
- **Setup**: `jest.setup.js` com mocks globais
- **Coverage**: Configurado para cobrir arquivos em `app/**/*`
- **Mocks**: Supabase, Next.js cache e APIs externas são mockados

### Mocks Implementados

- **Supabase Client**: Simula operações de banco de dados
- **Next.js Cache**: Mocka `revalidatePath` para verificar revalidação
- **Google Calendar API**: Mocka funções de sincronização
- **APIs Externas**: WhatsApp, SMS, Email são mockados

## 📊 Interpretando os Resultados

### Exemplo de Saída de Sucesso

```bash
 PASS  __tests__/actions/appointments.test.ts
  createAppointment
    Validação de Dados
      ✓ deve retornar erro ao receber dados inválidos (data no passado) (3ms)
      ✓ deve retornar erro ao receber campos obrigatórios ausentes (1ms)
    Conflito de Horário
      ✓ deve retornar erro ao tentar agendar horário já ocupado (2ms)
    Sucesso
      ✓ deve criar agendamento com sucesso e revalidar cache (4ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

### Exemplo de Falha

```bash
 FAIL  __tests__/actions/appointments.test.ts
  createAppointment
    Validação de Dados
      ✕ deve retornar erro ao receber dados inválidos (data no passado) (5ms)
      ✓ deve retornar erro ao receber campos obrigatórios ausentes (1ms)

  ● createAppointment › Validação de Dados › deve retornar erro ao receber dados inválidos (data no passado)

    expect(received).toBe(expected)
    Expected: false
    Received: true

      45 |       // Assert: Verificar que retornou erro de validação
    > 46 |       expect(result.success).toBe(false)
      47 |       expect(result.error).toContain('Data de início deve ser no futuro')
```

## 🐛 Solução de Problemas

### Erro: "Cannot find module '@/actions/appointments'"

**Solução**: Verifique se o alias `@` está configurado corretamente no `tsconfig.json` e `jest.config.js`.

### Erro: "FormData is not defined"

**Solução**: Jest não tem `FormData` nativo. Use o polyfill ou mock apropriado.

### Erro: "revalidatePath is not a function"

**Solução**: Verifique se o mock de `next/cache` está configurado corretamente no `jest.setup.js`.

### Testes Falhando Inesperadamente

**Solução**:

1. Verifique se todos os mocks estão configurados
2. Limpe o cache do Jest: `npm test -- --clearCache`
3. Verifique se as dependências estão atualizadas

## 📈 Próximos Passos

### Testes Adicionais Recomendados

- **Testes de Integração**: Testar fluxos completos entre múltiplas Server Actions
- **Testes de Performance**: Verificar tempo de resposta das operações críticas
- **Testes de Segurança**: Validar permissões e autenticação
- **Testes de UI**: Testar componentes React com React Testing Library

### Cobertura de Código

- **Meta**: Manter cobertura acima de 80%
- **Foco**: Funcionalidades críticas devem ter 100% de cobertura
- **Relatórios**: Gerar relatórios de cobertura para análise

## 🤝 Contribuindo

### Adicionando Novos Testes

1. Crie o arquivo de teste no diretório apropriado
2. Siga o padrão de nomenclatura: `*.test.ts`
3. Use a estrutura `describe` > `it` para organizar os testes
4. Implemente mocks apropriados para dependências externas
5. Documente o que cada teste verifica e por que é importante

### Padrões de Teste

- **Arrange**: Preparar dados e mocks
- **Act**: Executar a função sendo testada
- **Assert**: Verificar resultados esperados
- **Cleanup**: Limpar mocks e estado entre testes

### Boas Práticas

- Teste cenários de sucesso e falha
- Verifique comportamento de borda
- Use dados realistas mas controlados
- Mantenha testes independentes e isolados
- Documente casos de teste complexos
