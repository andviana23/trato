const { Client } = require("pg");

const config = {
  connectionString:
    process.env.SUPABASE_DB_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

async function completeSetup() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log("🔌 Conectado ao Supabase Database");

    // 1. Tabela de profissionais
    await client.query(`
      CREATE TABLE IF NOT EXISTS profissionais (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telefone VARCHAR(20),
        especialidade VARCHAR(100),
        unidade_id UUID NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela profissionais criada");

    // 2. Tabela de clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(20),
        cpf VARCHAR(14),
        unidade_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela clientes criada");

    // 3. Tabela de serviços
    await client.query(`
      CREATE TABLE IF NOT EXISTS servicos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        duracao INTEGER NOT NULL, -- em minutos
        unidade_id UUID NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela servicos criada");

    // 4. Tabela de agendamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
        profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
        servico_id UUID REFERENCES servicos(id) ON DELETE CASCADE,
        data_hora TIMESTAMPTZ NOT NULL,
        duracao INTEGER NOT NULL, -- em minutos
        status VARCHAR(50) DEFAULT 'agendado',
        valor DECIMAL(10,2) NOT NULL,
        unidade_id UUID NOT NULL,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela agendamentos criada");

    // 5. Tabela de unidades
    await client.query(`
      CREATE TABLE IF NOT EXISTS unidades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        endereco TEXT,
        telefone VARCHAR(20),
        email VARCHAR(255),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela unidades criada");

    // 6. Tabela de assinaturas
    await client.query(`
      CREATE TABLE IF NOT EXISTS assinaturas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
        plano_id UUID,
        status VARCHAR(50) DEFAULT 'ativa',
        data_inicio DATE NOT NULL,
        data_fim DATE,
        valor_mensal DECIMAL(10,2) NOT NULL,
        unidade_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela assinaturas criada");

    // 7. Tabela de pagamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
        assinatura_id UUID REFERENCES assinaturas(id) ON DELETE CASCADE,
        valor DECIMAL(10,2) NOT NULL,
        data_pagamento DATE NOT NULL,
        forma_pagamento VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pendente',
        unidade_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela pagamentos criada");

    // 8. Tabela de produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        estoque INTEGER DEFAULT 0,
        unidade_id UUID NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela produtos criada");

    // 9. Tabela de vendas de produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendas_produtos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
        produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
        quantidade INTEGER NOT NULL,
        valor_unitario DECIMAL(10,2) NOT NULL,
        valor_total DECIMAL(10,2) NOT NULL,
        data_venda DATE NOT NULL,
        unidade_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela vendas_produtos criada");

    // 10. Tabela de serviços avulsos
    await client.query(`
      CREATE TABLE IF NOT EXISTS servicos_avulsos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
        profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
        servico_id UUID REFERENCES servicos(id) ON DELETE CASCADE,
        data_servico DATE NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente',
        unidade_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela servicos_avulsos criada");

    // 11. Tabela de metas
    await client.query(`
      CREATE TABLE IF NOT EXISTS metas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
        mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
        ano INTEGER NOT NULL,
        meta_venda_produto DECIMAL(10,2) DEFAULT 0,
        meta_faturamento DECIMAL(10,2) DEFAULT 0,
        tipo_bonificacao VARCHAR(20) NOT NULL CHECK (tipo_bonificacao IN ('fixo', 'percentual')),
        valor_bonificacao DECIMAL(10,2) NOT NULL,
        foi_batida BOOLEAN DEFAULT false,
        unidade_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela metas criada");

    // 12. Tabela de comissões
    await client.query(`
      CREATE TABLE IF NOT EXISTS comissoes_avulses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
        servico_avulso_id UUID REFERENCES servicos_avulsos(id) ON DELETE CASCADE,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        valor_comissao DECIMAL(10,2) NOT NULL,
        percentual_comissao DECIMAL(5,2) NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        pago BOOLEAN DEFAULT false,
        data_pagamento DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela comissoes_avulses criada");

    // 13. Tabela de faturamento
    await client.query(`
      CREATE TABLE IF NOT EXISTS faturamento_assinatura (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assinatura_id UUID REFERENCES assinaturas(id) ON DELETE CASCADE,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente',
        data_pagamento DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela faturamento_assinatura criada");

    // 14. Tabela de receita mensal
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_revenue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        receita_assinaturas DECIMAL(10,2) DEFAULT 0,
        receita_servicos_avulsos DECIMAL(10,2) DEFAULT 0,
        receita_produtos DECIMAL(10,2) DEFAULT 0,
        total_receita DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela monthly_revenue criada");

    // Inserir dados adicionais
    console.log("📝 Inserindo dados adicionais...");

    // Planos de assinatura
    await client.query(`
      INSERT INTO unidades (id, nome, endereco, telefone, email) VALUES
      ('244c0543-7108-4892-9eac-48186ad1d5e7', 'Trato de Barbados', 'Endereço Trato', '(11) 99999-9999', 'trato@email.com'),
      ('87884040-cafc-4625-857b-6e0402ede7d7', 'BarberBeer', 'Endereço BarberBeer', '(11) 88888-8888', 'barberbeer@email.com')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("  ✅ Unidades inseridas");

    // Profissionais de exemplo
    await client.query(`
      INSERT INTO profissionais (nome, email, telefone, especialidade, unidade_id) VALUES
      ('João Silva', 'joao@trato.com', '(11) 99999-9999', 'Barbeiro', '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Maria Santos', 'maria@trato.com', '(11) 88888-8888', 'Barbeira', '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Pedro Costa', 'pedro@barberbeer.com', '(11) 77777-7777', 'Barbeiro', '87884040-cafc-4625-857b-6e0402ede7d7')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log("  ✅ Profissionais inseridos");

    // Serviços de exemplo
    await client.query(`
      INSERT INTO servicos (nome, descricao, preco, duracao, unidade_id) VALUES
      ('Corte Masculino', 'Corte tradicional masculino', 35.00, 30, '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Barba', 'Fazer a barba', 25.00, 20, '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Corte + Barba', 'Corte e barba', 50.00, 45, '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Corte Feminino', 'Corte feminino', 45.00, 40, '244c0543-7108-4892-9eac-48186ad1d5e7')
      ON CONFLICT DO NOTHING
    `);
    console.log("  ✅ Serviços inseridos");

    // Produtos de exemplo
    await client.query(`
      INSERT INTO produtos (nome, descricao, preco, estoque, unidade_id) VALUES
      ('Pomada Modeladora', 'Pomada para modelar cabelo', 25.00, 50, '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Óleo para Barba', 'Óleo hidratante para barba', 30.00, 30, '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Shampoo Profissional', 'Shampoo para todos os tipos de cabelo', 40.00, 40, '244c0543-7108-4892-9eac-48186ad1d5e7')
      ON CONFLICT DO NOTHING
    `);
    console.log("  ✅ Produtos inseridos");

    console.log("🎉 Setup completo realizado com sucesso!");
    console.log(
      "📊 Banco de dados configurado e populado com dados de exemplo"
    );
  } catch (error) {
    console.error("❌ Erro durante o setup:", error);
  } finally {
    await client.end();
  }
}

completeSetup();
