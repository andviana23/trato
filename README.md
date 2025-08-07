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

### Última Atualização

- **Atualização Automática de Assinaturas Externas:** Agora, ao confirmar um pagamento externo (dinheiro ou PIX), a lista de assinantes é atualizada automaticamente, sem a necessidade de clicar em "Atualizar Dados".

### Melhorias Anteriores

- **Redesign de UX/UI:** A página de Assinantes foi redesenhada para melhorar a experiência do usuário, tornando-a mais intuitiva e visualmente atraente.
- **Informações em Tempo Real:** Agora, a página exibe informações em tempo real do ASAAS, incluindo o total de clientes ativos e pagamentos confirmados no mês.
- **Cards de Métricas:** Foram adicionados cards de métricas que mostram dados importantes, como o número de clientes ativos e pagamentos confirmados.
- **Modal de Clientes Pagos:** Ao clicar no card de "Pagamentos Confirmados no Mês", um modal é exibido com a lista de clientes pagos no mês vigente.

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

### v1.3.1 - Atualização Automática de Assinaturas Externas (2024-12-XX)

- **Atualização Automática de Assinaturas Externas:** Agora, ao confirmar um pagamento externo (dinheiro ou PIX), a lista de assinantes é atualizada automaticamente, sem a necessidade de clicar em "Atualizar Dados".

### v1.3.0 - Fila Inteligente e Filtros Avançados (2024-12-XX)

- **Fila de Atendimento (Lista da Vez)**

  - Reorganização automática por número de atendimentos
  - Sistema de drag and drop para reordenação manual
  - Controle de status dos barbeiros (ativo/inativo)
  - Registro de atendimentos com contadores diários e totais
  - Função "passar a vez" para mover barbeiros para o final
  - Zerar lista com reset completo dos contadores
  - Interface intuitiva com feedback visual de status

- **Sistema de Filtros para Assinantes**
  - Busca em tempo real por nome, email ou telefone
  - Filtro por tipo de pagamento (ASAAS Trato, ASAAS Andrey, Externo)
  - Filtro por status de vencimento:
    - Próximos de vencer (≤ 7 dias)
    - Vencidos
    - Novos assinantes (≤ 30 dias)
    - Ativos
  - Ordenação flexível por múltiplos critérios
  - Interface responsiva com chips visuais dos filtros ativos

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

---

## Próximos Passos

### Criar Acesso para Barbeiros Usarem pelo Celular

- Desenvolver uma interface mobile-friendly para que os barbeiros possam acessar o sistema diretamente de seus dispositivos móveis.
- Focar em funcionalidades essenciais para o dia a dia dos barbeiros, como visualização de agenda, confirmação de atendimentos e comunicação com a administração.

---
