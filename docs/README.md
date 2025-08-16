# 📚 Documentação Completa - Trato de Barbados

Sistema completo de gestão para barbearias com Next.js 15, React 19, TypeScript, Chakra UI 3, Supabase, integrações ASAAS e sistema de filas robusto com BullMQ.

---

## 🗂️ **Índice da Documentação**

### **📋 Visão Geral**

- [**Overview do Produto**](./Overview_Produto.md) - Visão de negócio, fluxos principais e funcionalidades
- [**Arquitetura do Sistema**](./Arquitetura.md) - Camadas, serviços, padrões e diagramas
- [**Glossário**](./Glossario.md) - Termos de negócio e técnicos

### **🖥️ Frontend**

- [**Frontend - React/Next.js**](./FrontEnd.md) - Estrutura, páginas, componentes, estados
- [**Design System**](./DesignSystem.md) - Chakra UI, tokens, componentes e padrões visuais

### **🔧 Backend**

- [**Backend - API e Serviços**](./BackEnd.md) - Controllers, middlewares, integrações
- [**API - Especificação OpenAPI**](./API_OpenAPI.yaml) - Documentação completa da API REST
- [**API - Exemplos de Uso**](./API_Examples.http) - Coleção de requests para testes

### **💾 Banco de Dados**

- [**Database - Estrutura e DER**](./Database.md) - Tabelas, relacionamentos, políticas RLS
- [**Supabase - Configuração**](./Supabase.md) - Setup, migrações, views e funções

### **⚙️ Infraestrutura**

- [**Ambiente e Deploy**](./Env_Deploy.md) - Variáveis, build, deploy, scripts
- [**Segurança e Privacidade**](./Seguranca_Privacidade.md) - Auth, RLS, CORS, logs

### **🚀 Sistema de Filas (Queue System)**

- [**Sistema de Filas - BullMQ**](./SISTEMA_FILAS_IMPLEMENTADO.md) - Sistema completo de filas assíncronas
- [**Server Actions - Filas**](./SERVER_ACTIONS_QUEUE.md) - Integração com Server Actions
- [**Integrações Críticas**](./INTEGRACOES_CRITICAS.md) - APIs externas e webhooks

### **🧪 Desenvolvimento**

- [**Contribuição**](./Contribuicao.md) - Como desenvolver, padrões, workflow
- [**Testes**](./Testes.md) - Estratégia, execução, casos críticos
- [**Changelog**](./Changelog.md) - Histórico de versões e mudanças

### **📐 Decisões Arquiteturais**

- [**ADR-0001**](./ADRs/ADR-0001.md) - Escolha do Stack (Next.js + Supabase + Chakra UI)
- [**ADR-0002**](./ADRs/ADR-0002.md) - Arquitetura Multi-unidade com RLS
- [**ADR-0003**](./ADRs/ADR-0003.md) - Sistema de Agenda com AgendaGrid
- [**ADR-0004**](./ADRs/ADR-0004.md) - Integração ASAAS para Pagamentos
- [**ADR-0005**](./ADRs/ADR-0005.md) - Sistema de Filas com BullMQ

---

## 🎯 **Funcionalidades Principais**

### **🔐 Autenticação & Autorização**

- Login/cadastro com Supabase Auth
- Roles: admin, barbershop_owner, professional, recepcionista, client
- Row Level Security (RLS) por unidade
- Proteção de rotas e componentes

### **👥 Gestão de Usuários**

- Perfis de clientes, barbeiros e recepcionistas
- Cadastro de profissionais com especialidades
- Sistema multi-unidade (Trato + BarberBeer)

### **📅 Sistema de Agendamentos**

- AgendaGrid estilo AppBarber com drag & drop
- Slots de 10 minutos com quantização
- Validação de conflitos por barbeiro
- Notificações automáticas (24h, 1h, 15min)
- Períodos bloqueados e linha do "agora"

### **💰 Gestão Financeira**

- Integração ASAAS (pagamentos e assinaturas)
- Sistema de comissões por barbeiro
- Metas de vendas com bonificações
- Relatórios financeiros e dashboards

### **📊 Fila de Atendimento**

- Lista da vez inteligente com reorganização
- Drag & drop para reordenação manual
- Sistema de "passou a vez" automático
- Interface real-time para recepção

### **🎯 Sistema de Metas**

- Metas por unidade e barbeiro
- Bonificações fixas e percentuais
- Integração com vendas de produtos
- Fechamento mensal automatizado

### **🚀 Sistema de Filas Assíncronas**

- **4 Filas Especializadas** com BullMQ
- **Processamento de Notificações** (WhatsApp, SMS, Email)
- **Geração Automática de Relatórios** (diário, semanal, mensal)
- **Limpeza Programada** de logs e cache
- **Sincronização Externa** com APIs (Google Calendar, ASAAS)
- **Dashboard de Monitoramento** em tempo real
- **Retry Inteligente** com backoff exponencial
- **Agendamento de Tarefas** recorrentes

---

## 🛠️ **Stack Tecnológico**

### **Frontend**

- **Next.js 15** (App Router)
- **React 19** com TypeScript 5
- **Chakra UI 3** + Tailwind CSS
- **Radix UI** (componentes pontuais)
- **DnD Kit** (drag & drop)
- **Day.js** (manipulação de datas)
- **React Hook Form + Zod** (formulários)

### **Backend**

- **Supabase** (Database + Auth + Storage)
- **PostgreSQL** com Row Level Security
- **Server Actions** (Next.js)
- **Webhooks** ASAAS

### **Sistema de Filas**

- **BullMQ** (Redis-based job queue)
- **Redis** (message broker)
- **Hooks React** especializados
- **Dashboard** de monitoramento

### **Ferramentas**

- **ESLint** + **TypeScript** (qualidade)
- **Tailwind CSS** (estilização)
- **Chart.js/Recharts** (gráficos)
- **React Hot Toast** (notificações)

---

## 🚀 **Quick Start**

```bash
# 1. Clone e instale
cd trato
npm install

# 2. Configure .env.local
cp env-exemplo.txt .env.local
# Preencha com suas chaves Supabase, ASAAS e Redis

# 3. Configure Redis (para sistema de filas)
# Instale Redis localmente ou use Redis Cloud
# Configure as variáveis REDIS_HOST, REDIS_PORT, etc.

# 4. Execute as migrações
# Acesse Supabase Dashboard > SQL Editor
# Execute os arquivos em supabase/migrations/

# 5. Inicie o desenvolvimento
npm run dev

# 6. Acesse o dashboard de filas
# http://localhost:3000/admin/queues
```

---

## 📝 **Convenções de Documentação**

- **✅** = Implementado e testado
- **🚧** = Em desenvolvimento
- **⚠️** = Ponto de atenção ou débito técnico
- **📍** = Localização no código
- **(⚠️ inferido)** = Comportamento inferido do código

---

## 🔗 **Links Importantes**

- **Repositório**: [GitHub](.)
- **Deploy**: [Vercel/Production](#)
- **Supabase**: [Dashboard](https://supabase.com/dashboard)
- **ASAAS**: [Dashboard](https://www.asaas.com)
- **Dashboard de Filas**: `/admin/queues`

---

## 📞 **Suporte**

Para dúvidas sobre a documentação ou sistema:

1. Consulte o [Glossário](./Glossario.md) para termos técnicos
2. Verifique os [ADRs](./ADRs/) para decisões arquiteturais
3. Consulte o [Troubleshooting](#) para problemas comuns
4. Acesse o [Dashboard de Filas](./SISTEMA_FILAS_IMPLEMENTADO.md) para monitoramento

---

**Última atualização**: Dezembro 2024  
**Versão da documentação**: 2.0  
**Status**: ✅ Completa e atualizada com Sistema de Filas
