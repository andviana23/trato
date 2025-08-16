# 🏗️ Arquitetura do Sistema - Trato de Barbados

## 🎯 **Visão Arquitetural**

O sistema Trato de Barbados segue uma arquitetura **serverless híbrida** baseada em Next.js com Supabase como Backend-as-a-Service, utilizando padrões modernos de desenvolvimento React e um sistema robusto de filas assíncronas com BullMQ.

---

## 📐 **Diagrama C4 - Nível 1 (Context)**

```mermaid
C4Context
    title Context Diagram - Trato de Barbados

    Person(cliente, "Cliente", "Usuário final que agenda serviços")
    Person(barbeiro, "Barbeiro", "Profissional que atende clientes")
    Person(recepcionista, "Recepcionista", "Gerencia agenda e fila")
    Person(proprietario, "Proprietário", "Administra negócio e relatórios")

    System(trato, "Trato de Barbados", "Sistema de gestão para barbearias")

    System_Ext(asaas, "ASAAS", "Gateway de pagamentos")
    System_Ext(whatsapp, "WhatsApp API", "Notificações")
    System_Ext(supabase, "Supabase", "Backend-as-a-Service")
    System_Ext(redis, "Redis", "Message Broker para filas")
    System_Ext(google, "Google Calendar", "Sincronização de agenda")

    Rel(cliente, trato, "Agenda serviços", "HTTPS")
    Rel(barbeiro, trato, "Consulta agenda e metas", "HTTPS")
    Rel(recepcionista, trato, "Gerencia fila e agenda", "HTTPS")
    Rel(proprietario, trato, "Visualiza relatórios", "HTTPS")

    Rel(trato, asaas, "Processa pagamentos", "REST API")
    Rel(trato, whatsapp, "Envia notificações", "REST API")
    Rel(trato, supabase, "Persiste dados", "PostgREST")
    Rel(trato, redis, "Gerencia filas assíncronas", "Redis Protocol")
    Rel(trato, google, "Sincroniza agenda", "REST API")

    Rel(asaas, trato, "Webhooks pagamento", "HTTPS")
    Rel(redis, trato, "Processa jobs", "Redis Protocol")
```

---

## 📐 **Diagrama C4 - Nível 2 (Container)**

```mermaid
C4Container
    title Container Diagram - Trato de Barbados

    Person(users, "Usuários", "Clientes, barbeiros, recepcionistas")

    Container_Boundary(app, "Aplicação Trato de Barbados") {
        Container(web, "Web Application", "Next.js 15, React 19", "Interface do usuário")
        Container(api, "API Routes", "Next.js Server Actions", "Lógica de negócio")
        Container(auth, "Authentication", "Supabase Auth", "Autenticação e autorização")
        Container(queues, "Queue System", "BullMQ + Redis", "Processamento assíncrono")
        Container(dashboard, "Queue Dashboard", "React Components", "Monitoramento de filas")
    }

    ContainerDb(db, "Database", "PostgreSQL", "Dados do sistema")
    Container(storage, "File Storage", "Supabase Storage", "Arquivos e imagens")
    ContainerDb(redis, "Redis", "Redis", "Message broker e cache")

    System_Ext(asaas, "ASAAS API", "Pagamentos e assinaturas")
    System_Ext(notifications, "WhatsApp/SMS", "Serviços de notificação")
    System_Ext(google, "Google Calendar", "Sincronização de agenda")

    Rel(users, web, "Usa", "HTTPS")
    Rel(web, api, "Chama", "HTTP/JSON")
    Rel(web, auth, "Autentica", "JWT")
    Rel(web, dashboard, "Monitora", "React Components")

    Rel(api, db, "Lê/Escreve", "PostgREST")
    Rel(api, storage, "Upload/Download", "REST API")
    Rel(api, asaas, "Integra", "REST API")
    Rel(api, notifications, "Envia", "REST API")
    Rel(api, queues, "Adiciona jobs", "BullMQ API")
    Rel(api, google, "Sincroniza", "REST API")

    Rel(queues, redis, "Persiste jobs", "Redis Protocol")
    Rel(queues, notifications, "Processa", "REST API")
    Rel(queues, google, "Sincroniza", "REST API")

    Rel(asaas, api, "Webhooks", "HTTPS")
    Rel(redis, queues, "Processa", "Redis Protocol")
```

---

## 📐 **Diagrama C4 - Nível 3 (Component) - Frontend**

```mermaid
C4Component
    title Component Diagram - Frontend

    Container_Boundary(web, "Web Application") {
        Component(pages, "App Router Pages", "Next.js", "Roteamento e layouts")
        Component(components, "UI Components", "Chakra UI + React", "Componentes reutilizáveis")
        Component(agenda, "AgendaGrid", "React + DnD Kit", "Sistema de agenda")
        Component(forms, "Forms", "React Hook Form + Zod", "Formulários validados")
        Component(charts, "Charts", "Chart.js + Recharts", "Gráficos e relatórios")
        Component(contexts, "Contexts", "React Context", "Estado global")
        Component(hooks, "Custom Hooks", "React Hooks", "Lógica reutilizável")
        Component(queueDashboard, "Queue Dashboard", "React + BullMQ Hooks", "Monitoramento de filas")
    }

    ContainerDb(db, "Supabase", "PostgreSQL + Auth")
    ContainerDb(redis, "Redis", "Message Broker")

    Rel(pages, components, "Renderiza")
    Rel(pages, agenda, "Usa")
    Rel(pages, forms, "Inclui")
    Rel(pages, charts, "Exibe")
    Rel(pages, queueDashboard, "Monitora")

    Rel(components, contexts, "Consome")
    Rel(agenda, hooks, "Usa")
    Rel(forms, hooks, "Usa")
    Rel(queueDashboard, hooks, "Usa")

    Rel(hooks, redis, "Monitora", "BullMQ API")
```

---

## 📐 **Diagrama C4 - Nível 3 (Component) - Backend**

```mermaid
C4Component
    title Component Diagram - Backend

    Container_Boundary(api, "API Layer") {
        Component(serverActions, "Server Actions", "Next.js", "Lógica de negócio")
        Component(validators, "Validators", "Zod", "Validação de dados")
        Component(errorHandler, "Error Handler", "Custom", "Tratamento de erros")
        Component(services, "Services", "Business Logic", "Camada de serviços")
        Component(queueService, "Queue Service", "BullMQ", "Gestão de filas")
        Component(workers, "Queue Workers", "BullMQ", "Processamento de jobs")
    }

    ContainerDb(db, "Supabase", "PostgreSQL")
    ContainerDb(redis, "Redis", "Message Broker")
    System_Ext(asaas, "ASAAS", "Pagamentos")
    System_Ext(whatsapp, "WhatsApp", "Notificações")

    Rel(serverActions, validators, "Valida")
    Rel(serverActions, errorHandler, "Trata erros")
    Rel(serverActions, services, "Chama")
    Rel(serverActions, queueService, "Adiciona jobs")

    Rel(services, db, "Persiste")
    Rel(services, asaas, "Integra")
    Rel(services, whatsapp, "Notifica")

    Rel(queueService, redis, "Persiste jobs")
    Rel(workers, redis, "Consome jobs")
    Rel(workers, whatsapp, "Processa")
    Rel(workers, asaas, "Sincroniza")
```

---

## 🏗️ **Arquitetura de Camadas**

### **1. Camada de Apresentação (Presentation Layer)**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│ • Pages (App Router)                                       │
│ • Components (Chakra UI + React)                           │
│ • Hooks Customizados                                       │
│ • Contexts (Estado Global)                                 │
│ • Queue Dashboard (Monitoramento)                          │
└─────────────────────────────────────────────────────────────┘
```

### **2. Camada de API (API Layer)**

```
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions                           │
├─────────────────────────────────────────────────────────────┤
│ • Controllers de Negócio                                   │
│ • Validação com Zod                                        │
│ • Tratamento de Erros                                      │
│ • Autenticação/Autorização                                 │
└─────────────────────────────────────────────────────────────┘
```

### **3. Camada de Serviços (Service Layer)**

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Services                       │
├─────────────────────────────────────────────────────────────┤
│ • AppointmentService (Agendamentos)                       │
│ • PaymentService (Pagamentos ASAAS)                       │
│ • NotificationService (Notificações)                      │
│ • ReportService (Relatórios)                              │
│ • QueueService (Sistema de Filas)                         │
└─────────────────────────────────────────────────────────────┘
```

### **4. Camada de Dados (Data Layer)**

```
┌─────────────────────────────────────────────────────────────┐
│                      Data Access                          │
├─────────────────────────────────────────────────────────────┤
│ • Supabase Client (PostgreSQL)                            │
│ • Redis Client (Message Broker)                           │
│ • Storage Client (Arquivos)                               │
│ • Queue Client (BullMQ)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Sistema de Filas (Queue System)**

### **Arquitetura das Filas**

```
┌─────────────────────────────────────────────────────────────┐
│                    Queue System                            │
├─────────────────────────────────────────────────────────────┤
│ • Notification Queue (Alta Prioridade)                     │
│ • Report Queue (Média Prioridade)                          │
│ • Cleanup Queue (Baixa Prioridade)                         │
│ • Sync Queue (Média Prioridade)                            │
└─────────────────────────────────────────────────────────────┘
```

### **Fluxo de Processamento**

```
1. Job Creation → 2. Queue Storage → 3. Worker Processing → 4. Result Storage
     ↓                    ↓                    ↓                    ↓
Server Action         Redis (BullMQ)      Queue Workers        Database/Logs
```

### **Componentes das Filas**

- **Queues**: Instâncias BullMQ para diferentes tipos de tarefas
- **Workers**: Processadores de jobs com retry automático
- **Scheduler**: Agendamento de tarefas recorrentes
- **Dashboard**: Interface de monitoramento em tempo real
- **Hooks**: Integração React com o sistema de filas

---

## 🔐 **Segurança e Autenticação**

### **Row Level Security (RLS)**

```
┌─────────────────────────────────────────────────────────────┐
│                    RLS Policies                           │
├─────────────────────────────────────────────────────────────┤
│ • users: can_read_own_profile()                           │
│ • appointments: can_manage_own_unit()                      │
│ • payments: can_access_own_unit()                          │
│ • reports: can_view_own_unit()                             │
└─────────────────────────────────────────────────────────────┘
```

### **Autenticação Multi-nível**

```
┌─────────────────────────────────────────────────────────────┐
│                  Auth Levels                               │
├─────────────────────────────────────────────────────────────┤
│ • Public Routes (Landing, Login)                          │
│ • Protected Routes (Dashboard, Agenda)                     │
│ • Role-based Routes (Admin, Reports)                       │
│ • Unit-based Access (Multi-tenant)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **Monitoramento e Observabilidade**

### **Sistema de Logs**

```
┌─────────────────────────────────────────────────────────────┐
│                    Logging Strategy                        │
├─────────────────────────────────────────────────────────────┤
│ • Application Logs (Console + File)                        │
│ • Error Logs (Structured + Context)                        │
│ • Queue Logs (Job processing + Metrics)                    │
│ • Audit Logs (User actions + Changes)                      │
└─────────────────────────────────────────────────────────────┘
```

### **Métricas de Performance**

```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Metrics                     │
├─────────────────────────────────────────────────────────────┤
│ • Queue Health (Jobs waiting, active, failed)              │
│ • Response Times (API endpoints)                           │
│ • Database Performance (Query times)                       │
│ • User Experience (Page load times)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Padrões Arquiteturais**

### **1. Server Actions Pattern**

```typescript
// Exemplo de Server Action
export async function createAppointment(formData: FormData) {
  try {
    // 1. Validação
    const data = appointmentSchema.parse(Object.fromEntries(formData));

    // 2. Lógica de negócio
    const appointment = await appointmentService.create(data);

    // 3. Adicionar à fila de notificações
    await addNotificationJob({
      type: "whatsapp",
      recipient: appointment.clientPhone,
      message: `Agendamento confirmado para ${appointment.date}`,
    });

    return { success: true, appointment };
  } catch (error) {
    return handleError(error);
  }
}
```

### **2. Service Layer Pattern**

```typescript
// Exemplo de Service Layer
export class AppointmentService {
  async create(data: CreateAppointmentData) {
    // Validações de negócio
    await this.validateAvailability(data);

    // Persistência
    const appointment = await this.repository.create(data);

    // Eventos de domínio
    await this.eventBus.emit("appointment.created", appointment);

    return appointment;
  }
}
```

### **3. Queue Pattern**

```typescript
// Exemplo de Queue Pattern
export async function addNotificationJob(data: NotificationJob) {
  return await notificationQueue.add("notification", data, {
    priority: 1, // Alta prioridade
    attempts: 3, // Retry automático
    backoff: { type: "exponential", delay: 2000 },
  });
}
```

---

## 🚀 **Escalabilidade e Performance**

### **Estratégias de Cache**

- **React Query**: Cache de dados do servidor
- **Redis**: Cache de sessões e filas
- **Browser Cache**: Assets estáticos e dados locais

### **Otimizações de Banco**

- **Índices otimizados** para consultas frequentes
- **RLS policies** para segurança e performance
- **Connection pooling** para Supabase

### **Processamento Assíncrono**

- **Filas de jobs** para tarefas pesadas
- **Workers distribuídos** para processamento paralelo
- **Retry inteligente** com backoff exponencial

---

## 🔮 **Roadmap Arquitetural**

### **Fase 1: ✅ Implementado**

- Arquitetura base Next.js + Supabase
- Sistema de autenticação e autorização
- RLS policies e segurança
- Sistema de filas com BullMQ

### **Fase 2: 🚧 Em Desenvolvimento**

- Microserviços para funcionalidades críticas
- API Gateway para roteamento
- Load balancing e auto-scaling

### **Fase 3: 📋 Planejado**

- Arquitetura de eventos (Event Sourcing)
- CQRS para separação de leitura/escrita
- Monitoramento avançado com APM

---

**Status**: ✅ **Arquitetura Atualizada com Sistema de Filas**  
**Última Revisão**: Dezembro 2024  
**Próxima Revisão**: Janeiro 2025
