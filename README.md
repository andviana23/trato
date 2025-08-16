# 🏪 Sistema Trato de Barbados

Sistema completo de gestão para barbearias, desenvolvido com Next.js 15, Supabase e TypeScript.

## 🚀 Tecnologias

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL), Server Actions
- **UI**: Chakra UI, Radix UI
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL via Supabase
- **Deploy**: Vercel

## 📋 Funcionalidades

- **Gestão de Profissionais**: Cadastro, horários, especialidades
- **Agendamentos**: Sistema completo de marcação de horários
- **Clientes**: Cadastro e histórico de clientes
- **Fila de Atendimento**: Sistema de filas para barbearias
- **Metas e Comissões**: Controle de metas e cálculo de comissões
- **Relatórios Financeiros**: DRE, fluxo de caixa, balanço patrimonial
- **Multiunidade**: Suporte a múltiplas filiais
- **Autenticação**: Sistema de login com diferentes níveis de acesso

## 🛠️ Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

### Instalação

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd trato
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp env.local.example .env.local
```

Preencha as seguintes variáveis no arquivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase

# Sistema
NEXT_PUBLIC_COMMISSION_PERCENT=0.4
NEXT_PUBLIC_TRATO_UNIDADE_ID=seu_id_unidade_trato
NEXT_PUBLIC_BBSC_UNIDADE_ID=seu_id_unidade_barberbeer
```

4. **Configure o Supabase**

- Crie um projeto no [Supabase](https://supabase.com)
- Configure as variáveis de ambiente com suas credenciais
- Execute as migrations do banco de dados

5. **Execute o projeto**

```bash
npm run dev
```

## 🗄️ Estrutura do Banco

O sistema utiliza o Supabase como backend, com as seguintes tabelas principais:

- **profiles**: Usuários do sistema
- **profissionais**: Profissionais das barbearias
- **clientes**: Cadastro de clientes
- **agendamentos**: Agendamentos de horários
- **servicos**: Serviços oferecidos
- **metas**: Metas dos profissionais
- **receitas/despesas**: Controle financeiro
- **DRE**: Demonstração do Resultado do Exercício

## 🔐 Autenticação

O sistema utiliza Supabase Auth com os seguintes níveis de acesso:

- **admin**: Acesso total ao sistema
- **manager**: Gerente de unidade
- **professional**: Profissional da barbearia
- **receptionist**: Recepcionista

## 📱 Funcionalidades Mobile

- Interface responsiva para dispositivos móveis
- PWA (Progressive Web App) para instalação
- Notificações push

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js.

## 📚 Documentação

- [Documentação do Backend](./docs/BACKEND_DOCUMENTATION.md)
- [Guia de Migrations](./docs/MIGRATION_README.md)
- [Sistema de Metas](./docs/SISTEMA_METAS.md)
- [Implementação de Filas](./docs/SISTEMA_FILAS_IMPLEMENTADO.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através dos canais oficiais da Trato de Barbados.

---

**Desenvolvido com ❤️ pela equipe Trato de Barbados**
