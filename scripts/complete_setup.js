import { Client } from "pg";

const config = {
  connectionString:
    "postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
};

async function completeSetup() {
  const client = new Client(config);

  try {
    console.log("🚀 Conectando ao Neon para completar setup...");
    await client.connect();
    console.log("✅ Conectado!");

    console.log("📋 Criando tabelas restantes...");

    // 1. Tabela de marcas
    await client.query(`
      CREATE TABLE IF NOT EXISTS marcas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        descricao TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela marcas criada");

    // 2. Tabela de planos
    await client.query(`
      CREATE TABLE IF NOT EXISTS planos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        descricao TEXT,
        valor_mensal DECIMAL(10,2) NOT NULL,
        servicos_inclusos JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela planos criada");

    // 3. Tabela de serviços
    await client.query(`
      CREATE TABLE IF NOT EXISTS servicos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        descricao TEXT,
        duracao_minutos INTEGER DEFAULT 30,
        preco DECIMAL(10,2) NOT NULL,
        categoria_id UUID REFERENCES categorias(id),
        unidade_id UUID REFERENCES unidades(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela servicos criada");

    // 4. Tabela de produtos Trato
    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos_trato_de_barbados (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        categoria_id UUID REFERENCES categorias(id),
        marca_id UUID REFERENCES marcas(id),
        estoque_atual INTEGER DEFAULT 0,
        estoque_minimo INTEGER DEFAULT 5,
        unidade_id UUID REFERENCES unidades(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela produtos_trato_de_barbados criada");

    // 5. Tabela de produtos BarberBeer
    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos_barberbeer (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        categoria_id UUID REFERENCES categorias(id),
        marca_id UUID REFERENCES marcas(id),
        estoque_atual INTEGER DEFAULT 0,
        estoque_minimo INTEGER DEFAULT 5,
        unidade_id UUID REFERENCES unidades(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela produtos_barberbeer criada");

    // 6. Tabela de fila de barbeiros
    await client.query(`
      CREATE TABLE IF NOT EXISTS barber_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profissional_id UUID REFERENCES professionals(id),
        unidade_id UUID REFERENCES unidades(id),
        queue_position INTEGER NOT NULL,
        daily_services INTEGER DEFAULT 0,
        total_services INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        last_service_date DATE,
        passou_vez INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela barber_queue criada");

    // 7. Tabela de serviços avulsos
    await client.query(`
      CREATE TABLE IF NOT EXISTS servicos_avulsos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profissional_id UUID REFERENCES professionals(id),
        cliente_id UUID REFERENCES clients(id),
        servico_id UUID REFERENCES servicos(id),
        unidade_id UUID REFERENCES unidades(id),
        data_realizacao DATE NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        comissao DECIMAL(10,2),
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela servicos_avulsos criada");

    // 8. Tabela de vendas de produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendas_produtos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        produto_id UUID NOT NULL,
        profissional_id UUID REFERENCES professionals(id),
        cliente_id UUID REFERENCES clients(id),
        unidade_id UUID REFERENCES unidades(id),
        quantidade INTEGER NOT NULL,
        preco_unitario DECIMAL(10,2) NOT NULL,
        preco_total DECIMAL(10,2) NOT NULL,
        data_venda DATE NOT NULL,
        comissao DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela vendas_produtos criada");

    // 9. Tabela de assinaturas
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clients(id),
        plano_id UUID REFERENCES planos(id),
        unidade_id UUID REFERENCES unidades(id),
        status TEXT NOT NULL DEFAULT 'ativa',
        data_inicio DATE NOT NULL,
        data_fim DATE,
        valor_mensal DECIMAL(10,2) NOT NULL,
        forma_pagamento TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela subscriptions criada");

    // 10. Tabela de metas BarberBeer
    await client.query(`
      CREATE TABLE IF NOT EXISTS metas_barberbeer (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        barbeiro_id UUID REFERENCES professionals(id),
        unidade_id UUID REFERENCES unidades(id),
        mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
        ano INTEGER NOT NULL,
        meta_venda_produto DECIMAL(10,2) DEFAULT 0,
        meta_faturamento DECIMAL(10,2) DEFAULT 0,
        tipo_bonificacao TEXT CHECK (tipo_bonificacao IN ('fixo', 'percentual')),
        valor_bonificacao DECIMAL(10,2) DEFAULT 0,
        foi_batida BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela metas_barberbeer criada");

    // 11. Tabela de metas Trato
    await client.query(`
      CREATE TABLE IF NOT EXISTS metas_trato (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        barbeiro_id UUID REFERENCES professionals(id),
        unidade_id UUID REFERENCES unidades(id),
        mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
        ano INTEGER NOT NULL,
        meta_venda_produto DECIMAL(10,2) DEFAULT 0,
        meta_faturamento DECIMAL(10,2) DEFAULT 0,
        tipo_bonificacao TEXT CHECK (tipo_bonificacao IN ('fixo', 'percentual')),
        valor_bonificacao DECIMAL(10,2) DEFAULT 0,
        foi_batida BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela metas_trato criada");

    // 12. Tabela de comissões
    await client.query(`
      CREATE TABLE IF NOT EXISTS comissoes_avulses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profissional_id UUID REFERENCES professionals(id),
        servico_avulso_id UUID REFERENCES servicos_avulsos(id),
        unidade_id UUID REFERENCES unidades(id),
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
        assinatura_id UUID REFERENCES subscriptions(id),
        unidade_id UUID REFERENCES unidades(id),
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pendente',
        data_pagamento DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela faturamento_assinatura criada");

    // 14. Tabela de receita mensal
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_revenue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        unidade_id UUID REFERENCES unidades(id),
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        receita_assinaturas DECIMAL(10,2) DEFAULT 0,
        receita_servicos_avulsos DECIMAL(10,2) DEFAULT 0,
        receita_produtos DECIMAL(10,2) DEFAULT 0,
        total_receita DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela monthly_revenue criada");

    // Inserir dados adicionais
    console.log("📝 Inserindo dados adicionais...");

    // Planos de assinatura
    await client.query(`
      INSERT INTO planos (nome, descricao, valor_mensal, servicos_inclusos) VALUES
      ('Básico', 'Corte + Barba mensal', 89.90, '["corte", "barba"]'),
      ('Premium', 'Corte + Barba + Tratamentos', 129.90, '["corte", "barba", "tratamentos"]'),
      ('VIP', 'Tudo incluso + Produtos', 199.90, '["corte", "barba", "tratamentos", "produtos"]')
      ON CONFLICT DO NOTHING
    `);
    console.log("  ✅ Planos inseridos");

    // Serviços básicos
    await client.query(`
      INSERT INTO servicos (nome, descricao, duracao_minutos, preco, categoria_id, unidade_id) VALUES
      ('Corte Masculino', 'Corte tradicional masculino', 30, 35.00, 
       (SELECT id FROM categorias WHERE nome = 'Cabelo'), 
       '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Barba', 'Acabamento de barba', 20, 25.00, 
       (SELECT id FROM categorias WHERE nome = 'Barba'), 
       '244c0543-7108-4892-9eac-48186ad1d5e7'),
      ('Corte + Barba', 'Corte completo + barba', 45, 50.00, 
       (SELECT id FROM categorias WHERE nome = 'Cabelo'), 
       '244c0543-7108-4892-9eac-48186ad1d5e7')
      ON CONFLICT DO NOTHING
    `);
    console.log("  ✅ Serviços inseridos");

    // Criar índices para performance
    console.log("⚡ Criando índices...");

    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_appointments_cliente_id ON appointments(cliente_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_appointments_barbeiro_id ON appointments(barbeiro_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_appointments_unidade_id ON appointments(unidade_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_professionals_unidade_id ON professionals(unidade_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_clients_unidade_id ON clients(unidade_id)"
    );

    console.log("  ✅ Índices criados");

    // Verificar estrutura final
    console.log("\n📊 Verificando estrutura final...");

    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    console.log("📋 Total de tabelas criadas:");
    tables.rows.forEach((row) => console.log(`  ✅ ${row.tablename}`));

    console.log(
      `\n🎯 Sistema Trato de Barbados configurado com sucesso no Neon!`
    );
    console.log(`\n📝 Próximos passos:`);
    console.log(`  1. Configurar variáveis de ambiente no Next.js`);
    console.log(`  2. Testar conexão com o banco`);
    console.log(`  3. Configurar políticas RLS específicas`);
    console.log(`  4. Testar funcionalidades do sistema`);
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexão encerrada.");
  }
}

completeSetup();
