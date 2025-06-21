# Trato de Barbados - SaaS Barbearia

Sistema completo para gestão de barbearias, com funcionalidades de assinaturas, controle de clientes, profissionais, agendamento, relatórios financeiros e integração com plataformas de pagamento (Asaas e pagamentos externos).

---

## 🚀 Principais Funcionalidades

- Autenticação de usuários (login, cadastro, recuperação de senha)
- Gestão de assinaturas (planos, assinantes, cancelamento)
- Dashboard financeiro e de clientes
- Integração com Asaas (assinaturas, pagamentos, links)
- Integração com pagamentos externos
- Controle de profissionais, serviços e produtos
- **Fila de atendimento inteligente (lista da vez)**
- **Sistema de filtros avançados para assinantes**
- Relatórios e metas
- Interface responsiva e moderna (Next.js + Tailwind CSS)
- Temas claro/escuro

---

## 📛 Badges

![Next.js](https://img.shields.io/badge/Next.js-13%2B-blue)
![React](https://img.shields.io/badge/React-19-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.x-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-1.0-3ecf8e)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📑 Índice

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Correções e Melhorias Recentes](#correções-e-melhorias-recentes)
- [API/Endpoints](#apiendpoints)
- [Configuração](#configuração)
- [Contribuição](#contribuição)
- [Testes](#testes)
- [Deploy](#deploy)
- [Licença](#licença)
- [Autores/Créditos](#autorescréditos)
- [Changelog](#changelog)

---

## 🛠 Tecnologias Utilizadas

- **Next.js** (`latest`): Framework React para SSR, SSG e rotas modernas.
- **React** (`^19.0.0`): Biblioteca principal de UI.
- **TypeScript** (`^5`): Tipagem estática para maior robustez.
- **Tailwind CSS** (`^3.4.1`): Estilização utilitária e customizada.
- **@heroui/react**: Componentes de UI prontos e temas.
- **@nextui-org/react**: Componentes de interface modernos.
- **@supabase/supabase-js**: Integração com backend, autenticação e banco de dados.
- **@dnd-kit**: Drag and drop para interfaces dinâmicas.
- **@radix-ui**: Componentes acessíveis (checkbox, dropdown, select).
- **react-hook-form** + **zod**: Formulários e validação.
- **chart.js**, **recharts**: Gráficos e dashboards.
- **framer-motion**: Animações.
- **date-fns**, **dayjs**: Manipulação de datas.
- **ESLint**, **Prettier**: Padrões de código.
- **Jest** (sugestão): Testes unitários e integração.
- **Supabase**: Backend as a Service (autenticação, banco, storage).

---

## 🖥 Pré-requisitos

- **Node.js** `>=18.x`
- **npm** `>=9.x` ou **yarn** `>=1.22`
- **Git** (opcional, para clonar o repositório)
- **Conta no Supabase** (para backend)
- **Conta no Asaas** (para integrações de pagamento)

---

## ⚙️ Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/seu-repo.git
   cd saas-barbearia-nextjs
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente:**

   - Crie um arquivo `.env.local` na raiz com as seguintes variáveis:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
     ASAAS_API_KEY=...
     # Outras variáveis conforme necessário
     ```

4. **Configuração do Supabase:**
   - Siga as instruções em `/docs/SUPABASE.md` (se disponível) para rodar as migrações e configurar o banco.

---

## ▶️ Como Usar

- **Desenvolvimento:**

  ```bash
  npm run dev
  # ou
  yarn dev
  ```

  Acesse: [http://localhost:3000](http://localhost:3000)

- **Build de produção:**

  ```bash
  npm run build
  npm start
  ```

- **Exemplo de login:**

  - Acesse `/auth/login`
  - Use um usuário cadastrado ou crie uma nova conta.

- **Screenshots:**
  - Utilize a imagem `public/img/logo-trato-barbados.png` para branding.
  - Recomenda-se adicionar screenshots das principais telas na pasta `/public/img/screenshots`.

---

## 🎯 Funcionalidades Principais

### Fila de Atendimento (Lista da Vez)

- **Reorganização automática** por número de atendimentos
- **Drag and drop** para reordenação manual
- **Controle de status** (ativo/inativo) dos barbeiros
- **Registro de atendimentos** com contadores diários e totais
- **Sistema de "passar a vez"** para mover barbeiros para o final da fila
- **Zerar lista** com reset completo dos contadores

### Sistema de Filtros para Assinantes

- **Busca por nome, email ou telefone** em tempo real
- **Filtro por tipo de pagamento** (ASAAS Trato, ASAAS Andrey, Externo)
- **Filtro por status de vencimento**:
  - Próximos de vencer (≤ 7 dias)
  - Vencidos
  - Novos assinantes (≤ 30 dias)
  - Ativos
- **Ordenação flexível** por nome, vencimento, data de criação e valor
- **Interface intuitiva** com chips visuais dos filtros ativos

---

## 🔧 Correções e Melhorias Recentes

### 🚨 Correções Críticas Implementadas

Esta seção documenta as correções críticas realizadas no sistema **Lista da Vez** para resolver problemas de estrutura HTML, tipos de dados e propagação de eventos.

#### 1. **Correção de Estrutura HTML (CRÍTICO)**

**Problema:** Erro de hidratação causado por `<div>` dentro de `<tbody>`

```html
<!-- ❌ ESTRUTURA INCORRETA -->
<tbody>
  <div>
    <!-- ERRO: div dentro de tbody -->
    <tr>
      ...
    </tr>
  </div>
</tbody>
```

**Solução Implementada:**

```html
<!-- ✅ ESTRUTURA CORRETA -->
<div className="overflow-x-auto">
  <DndContext sensors="{sensors}" collisionDetection="{closestCenter}">
    <table className="min-w-full">
      <thead>
        ...
      </thead>
      <SortableContext items="{items}">
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Linhas da tabela - SEM divs extras */}
        </tbody>
      </SortableContext>
    </table>
  </DndContext>
</div>
```

**Resultado:** HTML válido, sem erros de hidratação e acessibilidade correta.

#### 2. **Correção de Tipos de Dados do Banco (CRÍTICO)**

**Problema:** Erro 400 - `invalid input syntax for type integer: "true"`

**Causa:** Campo `passou_vez` é `integer` mas estava recebendo `boolean true`

**Solução Implementada:**

```javascript
// ❌ ANTES - enviando boolean para campo integer
const updateData = {
  passou_vez: true, // Erro: string "true" para campo integer
};

// ✅ DEPOIS - incrementando contador numérico
const updateData = {
  passou_vez: parseInt(String(barbeiro.passou_vez || 0)) + 1, // Correto: número
  total_services: parseInt(String(barbeiro.total_services || 0)) + 1,
  daily_services: parseInt(String(barbeiro.daily_services || 0)) + 1,
};
```

**Melhorias Adicionais:**

- Logs detalhados antes de cada operação PATCH
- Validação de tipos com `parseInt()` e `Boolean()`
- Tratamento de valores nulos com fallback `|| 0`

#### 3. **Correção de Propagação de Eventos (CRÍTICO)**

**Problema:** Botão "+1" executava duas ações simultaneamente (incremento + passar vez)

**Causa:** Propagação de eventos entre elementos pai e filho

**Solução Implementada:**

```javascript
// ✅ Event handling correto com stopPropagation
const handleAtendimento = async (
  event: React.MouseEvent,
  barbeiroId: string,
  refetch: () => void
) => {
  event.preventDefault(); // Previne comportamento padrão
  event.stopPropagation(); // CRÍTICO: Para a propagação do evento

  console.log("🔢 [+1] Botão clicado para:", barbeiroId);
  // Lógica do incremento...
};

const handlePassarVez = async (
  event: React.MouseEvent,
  barbeiroId: string,
  refetch: () => void
) => {
  event.preventDefault();
  event.stopPropagation();

  console.log("➡️ [PASSAR] Botão clicado para:", barbeiroId);
  // Lógica de passar vez...
};
```

**Handlers Específicos:**

```javascript
// Handlers separados para cada botão
const handleIncrementClick = (event: React.MouseEvent) => {
  console.log("🔢 Botão +1 clicado - iniciando handler");
  handleAtendimento(event, item.id, refetch);
};

const handlePassClick = (event: React.MouseEvent) => {
  console.log("➡️ Botão Passar clicado - iniciando handler");
  handlePassarVez(event, item.id, refetch);
};
```

#### 4. **Correção de Importações e Cliente Supabase**

**Problema:** `'supabase' is not exported from '@/lib/supabase/client'`

**Solução:**

```javascript
// ❌ ANTES - importação incorreta
import { supabase } from "@/lib/supabase/client";

// ✅ DEPOIS - importação correta
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

#### 5. **Redesign da Interface com Tailwind CSS**

**Problema:** Dependência problemática do HeroUI causando erros de build

**Solução:** Substituição completa por HTML + Tailwind CSS

```javascript
// ❌ ANTES - componentes HeroUI
import { Card, Table, Button, Switch } from "@heroui/react";

// ✅ DEPOIS - HTML + Tailwind
<div className="bg-white rounded-lg shadow-md border">
  <table className="min-w-full divide-y divide-gray-200">
    <button className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700">
      +1
    </button>
  </table>
</div>;
```

### 🎨 Melhorias de UX/UI

#### **Design Moderno e Responsivo**

- Cards com gradientes e bordas coloridas
- Chips coloridos para status e contadores
- Botões com estados hover e focus
- Layout responsivo para mobile e desktop

#### **Sistema de Logs Avançado**

```javascript
// Logs com emojis para fácil identificação
console.log("🔄 Processando..."); // Operações em andamento
console.log("✅ Sucesso!"); // Operações bem-sucedidas
console.log("❌ Erro:"); // Erros específicos
console.log("💥 Erro crítico:"); // Erros gerais
```

#### **Estados de Loading e Feedback**

- Botões desabilitados durante operações
- Toast notifications para feedback do usuário
- Skeleton loading para carregamento inicial
- Estados visuais para elementos interativos

### 🧪 Validação e Testes

#### **Checklist de Validação Implementado:**

- ✅ HTML válido sem erros de hidratação
- ✅ Tipos de dados corretos em todas as operações
- ✅ Botões funcionando independentemente
- ✅ Console com logs informativos
- ✅ Drag & drop funcionando corretamente
- ✅ Interface responsiva em todos os dispositivos

#### **Testes Recomendados:**

1. **Abrir DevTools (F12)** → Console deve estar limpo
2. **Testar botão "+1"** → Deve executar apenas incremento
3. **Testar "Passar a Vez"** → Deve executar apenas passar vez
4. **Verificar drag & drop** → Deve reorganizar sem conflitos
5. **Testar responsividade** → Interface deve adaptar-se a diferentes telas

### 📊 Resultados das Correções

#### **Antes das Correções:**

- ❌ Erros de hidratação HTML
- ❌ Erro 400: `invalid input syntax for type integer: "true"`
- ❌ Botão "+1" executava ações duplas
- ❌ Dependências problemáticas do HeroUI
- ❌ Console com múltiplos erros

#### **Depois das Correções:**

- ✅ HTML válido e estrutura correta
- ✅ Tipos de dados corretos em todas as operações
- ✅ Botões funcionando independentemente
- ✅ Interface moderna com Tailwind CSS
- ✅ Console limpo com logs informativos
- ✅ Zero erros de hidratação ou banco de dados

### 🔍 Arquivos Modificados

#### **Principais Arquivos Alterados:**

- `app/lista-da-vez/page.tsx` - Correções principais do sistema
- `hooks/useBarberQueue.ts` - Hook para gestão da fila
- `lib/supabase/client.ts` - Cliente Supabase configurado

#### **Estrutura de Dados Corrigida:**

```sql
-- Tabela barber_queue com tipos corretos
CREATE TABLE barber_queue (
  id UUID PRIMARY KEY,
  profissional_id UUID REFERENCES profissionais(id),
  queue_position INTEGER,           -- Posição na fila
  daily_services INTEGER DEFAULT 0, -- Atendimentos do dia
  total_services INTEGER DEFAULT 0, -- Total de atendimentos
  passou_vez INTEGER DEFAULT 0,     -- Contador de vezes que passou
  is_active BOOLEAN DEFAULT true,   -- Status ativo/inativo
  last_service_date DATE,          -- Data do último atendimento
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📁 Estrutura do Projeto

```
saas-barbearia-nextjs/
├── app/                # Rotas, páginas e APIs (Next.js App Router)
│   ├── api/            # Endpoints de backend (assinaturas, pagamentos, dashboard)
│   ├── auth/           # Páginas de autenticação (login, cadastro, recuperação)
│   ├── dashboard/      # Dashboard principal, clientes, relatórios, financeiro
│   ├── assinaturas/    # Gestão de assinaturas, planos, assinantes
│   ├── lista-da-vez/   # Fila de atendimento inteligente
│   └── ...             # Outras rotas (clientes, cadastros)
├── components/         # Componentes reutilizáveis de UI
├── hooks/              # Hooks customizados
│   └── useBarberQueue.ts # Hook para gestão da fila de atendimento
├── lib/                # Serviços, contextos globais, tipos e utilitários
├── public/             # Assets públicos (imagens, favicon, screenshots)
├── styles/             # Estilos globais (Tailwind, CSS)
├── package.json        # Dependências e scripts
├── tailwind.config.ts  # Configuração do Tailwind CSS
├── tsconfig.json       # Configuração do TypeScript
└── README.md           # Documentação principal
```

**Principais diretórios:**

- `app/`: Rotas, páginas e APIs (estrutura moderna do Next.js)
- `components/`: Componentes de interface reutilizáveis
- `hooks/`: Hooks customizados para lógica de negócio
- `lib/`: Serviços de integração, contextos, tipos e utilitários
- `public/`: Imagens, favicon e arquivos estáticos

---

## 📡 API/Endpoints

### Exemplos de Endpoints

- **Assinaturas Asaas**

  - `POST /api/asaas/assinaturas` - Cria nova assinatura
  - `GET /api/asaas/trato/payments` - Lista pagamentos do Trato
  - `GET /api/asaas/andrey/payments` - Lista pagamentos do Andrey
  - `POST /api/asaas/cancelar-assinatura` - Cancela assinatura

- **Pagamentos Externos**

  - `GET /api/external-payments` - Lista pagamentos externos

- **Dashboard**
  - `GET /api/dashboard/revenue-timeline` - Timeline de receitas
  - `GET /api/dashboard/metas` - Metas financeiras

#### Exemplo de requisição

```http
GET /api/asaas/trato/payments
Authorization: Bearer <token>
```

**Resposta:**

```json
{
  "success": true,
  "payments": [ ... ],
  "total": 10
}
```

---

## ⚙️ Configuração

- **Variáveis de ambiente:**
  - `.env.local` com chaves do Supabase, Asaas e outras integrações.
- **Arquivos de configuração:**
  - `tailwind.config.ts`: Customização de temas, cores e plugins.
  - `tsconfig.json`: Configuração de TypeScript.
  - `next.config.ts`: Customizações do Next.js.

---

## 🤝 Contribuição

1. Fork este repositório
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'feat: minha nova feature'`
4. Push para sua branch: `git push origin minha-feature`
5. Abra um Pull Request

**Padrões:**

- Siga o padrão de código do ESLint/Prettier
- Escreva testes para novas funcionalidades
- Descreva claramente suas alterações no PR

---

## 🧪 Testes

- **Rodar testes (sugestão):**
  ```bash
  npm run test
  # ou
  yarn test
  ```
- **Tipos de testes:**
  - Unitários (Jest)
  - Integração (rotas e serviços)
- **Cobertura:**
  - Recomenda-se manter cobertura acima de 80%

---

## 🚀 Deploy

- **Build de produção:**
  ```bash
  npm run build
  npm start
  ```
- **Plataformas suportadas:**

  - Vercel (recomendado)
  - Docker
  - Qualquer ambiente Node.js 18+

- **Configurações específicas:**
  - Defina variáveis de ambiente no painel da plataforma
  - Configure domínios customizados conforme necessário

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT.  
Consulte o arquivo LICENSE para mais detalhes.

---

## 👨‍💻 Autores/Créditos

- Desenvolvido por [Seu Nome/Time]
- Logo e identidade visual: Trato de Barbados
- Agradecimentos: Comunidade Next.js, Supabase, Asaas

---

## 📝 Changelog

### v1.3.0 - Fila Inteligente e Filtros Avançados (2024-12-XX)

#### ✨ Novas Funcionalidades

**Fila de Atendimento (Lista da Vez)**

- ✅ **Reorganização automática** por número de atendimentos
- ✅ **Sistema de drag and drop** para reordenação manual
- ✅ **Controle de status** dos barbeiros (ativo/inativo)
- ✅ **Registro de atendimentos** com contadores diários e totais
- ✅ **Função "passar a vez"** para mover barbeiros para o final
- ✅ **Zerar lista** com reset completo dos contadores
- ✅ **Interface intuitiva** com feedback visual de status

**Sistema de Filtros para Assinantes**

- ✅ **Busca em tempo real** por nome, email ou telefone
- ✅ **Filtro por tipo de pagamento** (ASAAS Trato, ASAAS Andrey, Externo)
- ✅ **Filtro por status de vencimento**:
  - Próximos de vencer (≤ 7 dias)
  - Vencidos
  - Novos assinantes (≤ 30 dias)
  - Ativos
- ✅ **Ordenação flexível** por múltiplos critérios
- ✅ **Interface responsiva** com chips visuais dos filtros ativos

#### 🔧 Melhorias Técnicas

- **Hook useBarberQueue**: Gerenciamento completo da fila de atendimento
- **Componente FiltrosAssinantes**: Sistema de filtros reutilizável
- **Drag and Drop**: Implementação com @dnd-kit para reordenação manual
- **Performance**: Otimizações na busca e filtragem de dados
- **UX/UI**: Melhorias na interface e feedback visual

#### 🐛 Correções

- Corrigido problema de botões não funcionando na fila de atendimento
- Melhorado tratamento de erros no sistema de filtros
- Ajustada lógica de reorganização automática da fila

### v1.2.0 - Integração com Pagamentos Externos

- Integração com pagamentos externos
- Novos relatórios e melhorias de UI

### v1.1.0 - Melhorias de Performance

- Otimizações de carregamento
- Melhorias na interface

### v1.0.0 - Primeira Versão Estável

- Funcionalidades básicas implementadas
- Integração com ASAAS
- Dashboard inicial

---

> Para dúvidas, sugestões ou bugs, abra uma issue ou entre em contato!

# Log de Desenvolvimento - Sistema de Barbearia SaaS

Este documento registra o progresso e os problemas encontrados durante o desenvolvimento.

## 📅 Data: 26/07/2024

### ✅ Onde Paramos

A implementação da página de gerenciamento da **Lista da Vez** (`/lista-da-vez`) está em andamento. O objetivo é criar uma interface para que o administrador ou recepcionista possa gerenciar a fila de barbeiros em tempo real.

**Funcionalidades Implementadas:**

- **Visualização da Fila:** A fila de barbeiros é exibida em uma tabela.
- **Reordenação Drag-and-Drop:** A ordem dos barbeiros na fila pode ser alterada arrastando e soltando.
- **Ações por Barbeiro:**
  - `+1 Atendido`: Incrementa o contador de serviços do barbeiro.
  - `Passar a Vez`: Registra que o barbeiro passou a vez.
  - `Ativar/Inativar`: Controla se um barbeiro está na fila para atendimento.
- **Ações Gerais da Fila:**
  - `Reorganizar por Atendimentos`: Reordena a fila com base no número de atendimentos diários.
  - `Zerar Lista`: Limpa os contadores de atendimento do dia.

### 🚨 Erro Atual a ser Corrigido

Ao acessar a página `/lista-da-vez`, a aplicação quebra e exibe o seguinte erro em tempo de execução:

**Erro:** `Error: type.getCollectionNode is not a function`

Este erro impede a renderização de qualquer componente na página, bloqueando totalmente o teste e o desenvolvimento da funcionalidade. A imagem do erro foi capturada e está disponível no histórico da conversa.

### 🛠️ O que já foi tentado

1.  **Correção de Importação:** A suspeita inicial era que os componentes da biblioteca UI estavam sendo importados de um pacote incorreto (`@heroui/react`). A importação no arquivo `saas-barbearia-nextjs/app/lista-da-vez/page.tsx` foi corrigida para usar `@nextui-org/react`.
2.  **Limpeza de Cache:** O cache do Next.js (diretório `.next`) foi removido.
3.  **Reinicialização do Servidor:** O servidor de desenvolvimento foi reiniciado após as alterações.

Apesar dessas ações, o erro persiste, indicando que a causa raiz é outra.

### 🚀 Próximos Passos Sugeridos para Amanhã

1.  **Verificar o `NextUIProvider`:** A causa mais provável é a falta do `NextUIProvider` envolvendo a aplicação. Verifique o arquivo `saas-barbearia-nextjs/app/layout.tsx` para garantir que o provider está configurado e envolvendo o `{children}`.

2.  **Analisar o `tailwind.config.js`:** Confirme se o arquivo `tailwind.config.js` está corretamente configurado para o NextUI, importando e incluindo o plugin `nextui()` na array `plugins`.

3.  **Conflito de Dependências:** Investigue o `package.json`. A versão do React é a `^19.0.0`, que é muito recente. Pode haver uma incompatibilidade entre o React 19 e o `@nextui-org/react` ou uma de suas dependências (como `framer-motion`). Considere fazer o downgrade do React para a versão 18 estável.

4.  **Isolar o Componente:** Crie uma página de teste simples e renderize apenas um componente do NextUI (ex: `<Button>`). Se o erro ocorrer, o problema é na configuração global do projeto. Caso contrário, o problema está em um dos componentes mais complexos usados na página `lista-da-vez` (como `Table` ou `Dropdown`).

---

**Foco para amanhã:** Resolver o erro `getCollectionNode` para desbloquear o desenvolvimento da funcionalidade da fila.
