# 📖 Glossário - Trato de Barbados

## 🎯 **Termos de Negócio**

### **A**

**AgendaGrid**  
Componente customizado para visualização e gerenciamento da agenda de agendamentos, inspirado na interface do AppBarber.

**ASAAS**  
Gateway de pagamentos brasileiro utilizado para processar assinaturas recorrentes e pagamentos avulsos.

**Assinante**  
Cliente que possui uma assinatura mensal ativa no sistema, com cobrança recorrente via ASAAS.

**Assinatura**  
Plano mensal recorrente que permite ao cliente utilizar os serviços da barbearia por um valor fixo mensal.

**Atendimento**  
Ação de um barbeiro começar a atender um cliente da fila, registrando o início do serviço.

### **B**

**BarberBeer**  
Uma das duas unidades do sistema, focada em um público diferenciado com temática de cervejaria.

**Barbeiro** / **Profissional**  
Funcionário habilitado a realizar cortes, barbas e outros serviços, com metas mensais de vendas.

**Bonificação**  
Valor adicional pago ao barbeiro quando atinge determinadas metas de venda de produtos.

**Bloqueado** / **Período Bloqueado**  
Horário em que a agenda não aceita agendamentos (ex: antes da abertura, almoço, feriados).

### **C**

**Cliente**  
Pessoa que utiliza os serviços da barbearia, podendo ser assinante ou avulso.

**Comissão**  
Percentual (40%) do faturamento mensal distribuído entre os barbeiros proporcionalmente aos minutos trabalhados.

**Comissão Avulsa**  
Valor adicional pago a um barbeiro fora do sistema de comissões regulares (vendas extras, bônus).

**Conflito**  
Situação onde dois agendamentos do mesmo barbeiro se sobrepõem no tempo, impedida pelo sistema.

**Current Unidade**  
Função PostgreSQL que retorna a unidade ativa no contexto atual, usada para RLS.

### **D**

**Drag & Drop**  
Funcionalidade que permite arrastar eventos na agenda para reagendar ou reorganizar a fila.

### **F**

**Fila da Vez** / **Barber Queue**  
Sistema de gerenciamento da ordem de atendimento dos clientes que chegam na barbearia.

**Faturamento**  
Receita total mensal, incluindo assinaturas ASAAS e pagamentos externos.

### **G**

**Gutter**  
Coluna lateral esquerda da agenda que exibe os horários (08:00, 08:10, 08:20, etc.).

### **L**

**Lista da Vez**  
Interface para gerenciar a fila de atendimento com funcionalidades de reorganização.

**Linha do Agora**  
Linha vermelha horizontal que atravessa a agenda indicando o horário atual.

### **M**

**Meta**  
Objetivo de vendas de produtos definido para cada barbeiro, com faixas: Bronze, Prata, Ouro, Diamante.

**Multi-unidade**  
Arquitetura que permite o sistema operar com dados completamente separados para Trato e BarberBeer.

### **N**

**Notificação**  
Lembretes automáticos enviados aos clientes via WhatsApp/SMS (24h, 1h, 15min antes do agendamento).

**No-show**  
Cliente que agendou mas não compareceu ao horário marcado.

### **P**

**Passou a Vez**  
Status aplicado quando um cliente da fila não está presente no momento de ser chamado.

**Pagamento Externo**  
Valor recebido fora do sistema ASAAS (dinheiro, cartão local, PIX direto).

**pxPerMinute**  
Constante que define quantos pixels na tela representam um minuto na agenda.

### **Q**

**Quantização**  
Processo de ajustar horários para os slots de 10 minutos mais próximos.

### **R**

**Recepcionista**  
Funcionário responsável por gerenciar agenda, fila de atendimento e cadastros de clientes.

**Resource** / **Recurso**  
Barbeiro ou profissional que pode ser agendado na agenda (cada coluna representa um resource).

**RLS** (Row Level Security)  
Tecnologia PostgreSQL que garante isolamento automático de dados entre unidades.

### **S**

**Slot**  
Período mínimo de tempo na agenda (10 minutos). Base para todas as operações de agendamento.

**Status**  
Estado de um agendamento: agendado, confirmado, atendido, cancelado, no_show, bloqueado.

**Sticky**  
Propriedade CSS que mantém elementos fixos na tela durante o scroll (headers, footers).

### **T**

**Trato de Barbados**  
Unidade principal do sistema, com foco no atendimento tradicional de barbearia.

### **U**

**Unidade**  
Uma das duas filiais: Trato de Barbados ou BarberBeer, com dados completamente isolados.

### **V**

**Venda de Produto**  
Registro de venda de cosméticos/acessórios feita por um barbeiro, contabilizada nas metas.

### **W**

**Webhook**  
Notificação automática enviada pelo ASAAS quando ocorre um evento de pagamento.

### **Z**

**Zebra**  
Padrão visual de fundo na agenda com faixas alternadas a cada 30 minutos para facilitar leitura.

---

## 🔧 **Termos Técnicos**

### **A**

**App Router**  
Sistema de roteamento do Next.js 13+ baseado em estrutura de pastas.

**ADR** (Architectural Decision Record)  
Documento que registra decisões arquiteturais importantes e suas justificativas.

### **B**

**BaaS** (Backend-as-a-Service)  
Modelo de serviço onde o backend é gerenciado por terceiros (ex: Supabase).

### **C**

**Chakra UI**  
Biblioteca de componentes React com design system integrado e acessibilidade.

**CSS-in-JS**  
Abordagem de estilização onde CSS é escrito em JavaScript/TypeScript.

**Context**  
Sistema React para compartilhar estado entre componentes sem prop drilling.

### **D**

**DER** (Diagrama Entidade-Relacionamento)  
Representação visual da estrutura do banco de dados e relacionamentos.

**DnD Kit**  
Biblioteca React para implementar funcionalidades de drag and drop acessíveis.

### **E**

**EventBlock**  
Componente React que renderiza um evento individual na agenda.

### **H**

**Hook Customizado**  
Função React que encapsula lógica de estado e efeitos reutilizáveis.

### **J**

**JWT** (JSON Web Token)  
Padrão de token para autenticação e autorização segura.

### **L**

**Layout**  
Componente Next.js que define estrutura compartilhada entre páginas.

### **M**

**Middleware**  
Função que intercepta requests antes de chegarem às rotas.

### **O**

**ORM** (Object-Relational Mapping)  
Técnica para mapear dados relacionais para objetos na aplicação.

### **P**

**PostgreSQL**  
Sistema de gerenciamento de banco de dados relacional usado via Supabase.

**PostgREST**  
API REST automática gerada pelo Supabase a partir do schema PostgreSQL.

### **R**

**React Query**  
Biblioteca para gerenciamento de estado servidor com cache e sincronização.

**Real-time**  
Funcionalidade Supabase para receber atualizações do banco em tempo real.

### **S**

**Server Action**  
Função Next.js que executa no servidor e pode ser chamada diretamente do cliente.

**SSR** (Server-Side Rendering)  
Renderização de páginas React no servidor antes de enviar ao cliente.

**Supabase**  
Plataforma BaaS com PostgreSQL, autenticação, storage e real-time.

### **T**

**TypeScript**  
Linguagem que adiciona tipagem estática ao JavaScript.

**Tailwind CSS**  
Framework CSS utilitário para estilização rápida e responsiva.

### **V**

**Vercel**  
Plataforma de deploy otimizada para aplicações Next.js.

### **W**

**Webhook**  
HTTP callback automático quando eventos específicos ocorrem em sistemas externos.

---

## 📊 **Termos de Database**

### **C**

**CRUD**  
Create, Read, Update, Delete - operações básicas de banco de dados.

### **F**

**Foreign Key (FK)**  
Chave estrangeira que referencia a chave primária de outra tabela.

### **I**

**Índice**  
Estrutura de dados que acelera consultas em colunas específicas.

### **J**

**JSONB**  
Tipo de dados PostgreSQL para armazenar JSON de forma otimizada.

### **M**

**Migração**  
Script SQL que modifica a estrutura do banco de dados de forma versionada.

**Materialized View**  
View que armazena fisicamente os resultados para consultas mais rápidas.

### **P**

**Primary Key (PK)**  
Chave primária que identifica unicamente cada registro na tabela.

**Policy** (RLS)  
Regra de segurança que define quais dados um usuário pode acessar.

### **S**

**Schema**  
Estrutura que define tabelas, colunas, tipos e relacionamentos do banco.

**Stored Procedure**  
Função armazenada no banco que executa lógica complexa.

### **T**

**Trigger**  
Função que executa automaticamente quando eventos específicos ocorrem na tabela.

**TIMESTAMPTZ**  
Tipo PostgreSQL para data/hora com timezone.

### **U**

**UUID**  
Identificador único universal usado como primary key em todas as tabelas.

### **V**

**View**  
Consulta SQL salva que apresenta dados como se fosse uma tabela.

---

## 🎨 **Termos de UI/UX**

### **A**

**Acessibilidade**  
Prática de tornar interfaces utilizáveis por pessoas com diferentes habilidades.

### **C**

**Component**  
Unidade reutilizável de interface construída com React.

**CSS Grid**  
Sistema CSS para layouts bidimensionais complexos.

### **D**

**Design System**  
Conjunto de padrões, componentes e guidelines para interface consistente.

### **F**

**Flexbox**  
Sistema CSS para layouts unidimensionais flexíveis.

### **R**

**Responsive**  
Design que se adapta a diferentes tamanhos de tela e dispositivos.

### **T**

**Theme**  
Sistema de tokens de design (cores, espaçamentos, tipografia) do Chakra UI.

**Token**  
Valor de design reutilizável (ex: cor primária, espaçamento padrão).

---

## 🔐 **Termos de Segurança**

### **A**

**Autenticação**  
Processo de verificar a identidade de um usuário.

**Autorização**  
Processo de verificar se um usuário autenticado tem permissão para uma ação.

### **C**

**CORS** (Cross-Origin Resource Sharing)  
Mecanismo de segurança que controla requests entre domínios diferentes.

### **J**

**JWT** (JSON Web Token)  
Token seguro para transmitir informações entre partes de forma verificável.

### **R**

**Role**  
Papel/perfil de usuário que define permissões (admin, barbeiro, recepcionista, cliente).

**RLS** (Row Level Security)  
Funcionalidade PostgreSQL para filtrar dados automaticamente por usuário.

### **S**

**Session**  
Período de tempo que um usuário permanece autenticado no sistema.

---

**Última atualização**: Dezembro 2024  
**Versão**: 1.0  
**Contribuidores**: Time de Desenvolvimento
