const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("🚀 Executando migração da tabela clientes...");

  try {
    // 1. Verificar se a tabela já existe
    const { data: existingTables, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "clientes");

    if (tableError) {
      console.error("❌ Erro ao verificar tabelas:", tableError);
      return;
    }

    if (existingTables && existingTables.length > 0) {
      console.log("✅ Tabela clientes já existe");
    } else {
      console.log("📋 Criando tabela clientes...");

      // 2. Criar a tabela clientes
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS public.clientes (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            nome VARCHAR(200) NOT NULL,
            email VARCHAR(255),
            telefone VARCHAR(20),
            cpf_cnpj VARCHAR(18),
            endereco TEXT,
            data_nascimento DATE,
            observacoes TEXT,
            unidade TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      });

      if (createError) {
        console.error("❌ Erro ao criar tabela:", createError);
        return;
      }

      console.log("✅ Tabela clientes criada com sucesso");

      // 3. Criar índices
      console.log("📊 Criando índices...");
      const { error: indexError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_clientes_unidade ON public.clientes(unidade);
          CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
          CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);
          CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
        `,
      });

      if (indexError) {
        console.error("❌ Erro ao criar índices:", indexError);
      } else {
        console.log("✅ Índices criados com sucesso");
      }

      // 4. Inserir dados de exemplo
      console.log("📝 Inserindo dados de exemplo...");
      const { error: insertError } = await supabase.from("clientes").insert([
        {
          nome: "João Silva",
          email: "joao@email.com",
          telefone: "(11) 99999-9999",
          unidade: "Trato de Barbados",
        },
        {
          nome: "Maria Santos",
          email: "maria@email.com",
          telefone: "(11) 88888-8888",
          unidade: "Trato de Barbados",
        },
        {
          nome: "Pedro Oliveira",
          email: "pedro@email.com",
          telefone: "(11) 77777-7777",
          unidade: "BARBER BEER SPORT CLUB",
        },
        {
          nome: "Ana Costa",
          email: "ana@email.com",
          telefone: "(11) 66666-6666",
          unidade: "BARBER BEER SPORT CLUB",
        },
      ]);

      if (insertError) {
        console.error("❌ Erro ao inserir dados de exemplo:", insertError);
      } else {
        console.log("✅ Dados de exemplo inseridos com sucesso");
      }
    }

    // 5. Verificar estrutura da tabela
    console.log("🔍 Verificando estrutura da tabela...");
    const { data: columns, error: columnError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .eq("table_name", "clientes")
      .order("ordinal_position");

    if (columnError) {
      console.error("❌ Erro ao verificar colunas:", columnError);
    } else {
      console.log("📋 Estrutura da tabela clientes:");
      columns.forEach((col) => {
        console.log(
          `  - ${col.column_name}: ${col.data_type} ${
            col.is_nullable === "NO" ? "(NOT NULL)" : ""
          }`
        );
      });
    }

    // 6. Verificar dados
    console.log("📊 Verificando dados...");
    const { data: clientes, error: dataError } = await supabase
      .from("clientes")
      .select("*")
      .order("unidade, nome");

    if (dataError) {
      console.error("❌ Erro ao buscar dados:", dataError);
    } else {
      console.log(`✅ Total de clientes: ${clientes.length}`);
      clientes.forEach((cliente) => {
        console.log(`  - ${cliente.nome} (${cliente.unidade})`);
      });
    }

    console.log("🎉 Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
  }
}

// Executar a migração
runMigration();










