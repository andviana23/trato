import { Client } from "pg";

const config = {
  connectionString:
    "postgresql://neondb_owner:npg_Qqv3kXeOY6ot@ep-quiet-shape-ack5hkqy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
};

async function main() {
  const client = new Client(config);

  try {
    console.log("🚀 Conectando ao Neon...");
    await client.connect();
    console.log("✅ Conectado!");

    // Criar tabelas básicas primeiro
    console.log("📋 Criando tabelas...");

    // 1. Tabela de unidades
    await client.query(`
      CREATE TABLE IF NOT EXISTS unidades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        endereco TEXT,
        telefone TEXT,
        email TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela unidades criada");

    // 2. Tabela de categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        descricao TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela categorias criada");

    // 3. Tabela de profissionais
    await client.query(`
      CREATE TABLE IF NOT EXISTS professionals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        unidade_id UUID REFERENCES unidades(id),
        name VARCHAR(200) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        commission_rate DECIMAL(5,2) DEFAULT 50.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela professionals criada");

    // 4. Tabela de clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        unidade_id UUID REFERENCES unidades(id),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela clients criada");

    // 5. Tabela de agendamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clients(id),
        barbeiro_id UUID REFERENCES professionals(id),
        unidade_id UUID REFERENCES unidades(id),
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ NOT NULL,
        status TEXT DEFAULT 'agendado',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ Tabela appointments criada");

    // Inserir dados iniciais
    console.log("📝 Inserindo dados iniciais...");

    // Unidades
    await client.query(`
      INSERT INTO unidades (id, nome, endereco, telefone, email) VALUES
      ('244c0543-7108-4892-9eac-48186ad1d5e7', 'Trato de Barbados', 'Endereço Trato', '(11) 99999-9999', 'trato@barbados.com'),
      ('87884040-cafc-4625-857b-6e0402ede7d7', 'BarberBeer', 'Endereço BarberBeer', '(11) 88888-8888', 'barberbeer@barbados.com')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("  ✅ Unidades inseridas");

    // Categorias
    await client.query(`
      INSERT INTO categorias (nome, descricao) VALUES
      ('Cabelo', 'Serviços de cabelo'),
      ('Barba', 'Serviços de barba'),
      ('Produtos', 'Produtos para venda')
      ON CONFLICT DO NOTHING
    `);
    console.log("  ✅ Categorias inseridas");

    // Verificar estrutura
    console.log("\n📊 Verificando estrutura...");

    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    console.log("📋 Tabelas criadas:");
    tables.rows.forEach((row) => console.log(`  ✅ ${row.tablename}`));

    const unidades = await client.query(
      "SELECT COUNT(*) as total FROM unidades"
    );
    console.log(`\n📍 Total de unidades: ${unidades.rows[0].total}`);

    console.log("\n🎉 Configuração básica concluída!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexão encerrada.");
  }
}

main();
