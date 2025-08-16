import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function fixEnvAndTest() {
  console.log("🔧 CORRIGINDO .ENV.LOCAL E TESTANDO SUPABASE");
  console.log("=============================================\n");

  try {
    // Ler o arquivo .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = fs.readFileSync(envPath, "utf8");

    console.log("📋 Arquivo .env.local encontrado");

    // Extrair as chaves corretamente
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    const serviceKeyMatch = envContent.match(
      /NEXT_PUBLIC_SUPABASE_service_role_KEY=(.+)/
    );

    if (!urlMatch || !anonKeyMatch) {
      throw new Error("Chaves do Supabase não encontradas no .env.local");
    }

    const supabaseUrl = urlMatch[1].trim();
    const supabaseKey = anonKeyMatch[1].trim();
    const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : null;

    console.log("🔑 Chaves extraídas:");
    console.log(`📡 URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 30)}...`);
    if (serviceKey) {
      console.log(`🔑 Service Key: ${serviceKey.substring(0, 30)}...`);
    }

    // Testar conexão
    console.log("\n🔌 Testando conexão com Supabase...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Teste básico
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (error) {
      console.log("❌ Erro na conexão:", error.message);

      // Tentar com service role key
      if (serviceKey) {
        console.log("\n🔄 Tentando com service role key...");
        const supabaseService = createClient(supabaseUrl, serviceKey);

        const { data: serviceData, error: serviceError } = await supabaseService
          .from("profiles")
          .select("*")
          .limit(1);

        if (serviceError) {
          console.log("❌ Erro com service role key:", serviceError.message);
        } else {
          console.log("✅ Conexão bem-sucedida com service role key!");
          console.log(
            `📊 Dados encontrados: ${serviceData?.length || 0} registros`
          );
        }
      }
    } else {
      console.log("✅ Conexão bem-sucedida!");
      console.log(`📊 Dados encontrados: ${data?.length || 0} registros`);
    }

    // Verificar estrutura do banco
    console.log("\n📋 Verificando estrutura do banco...");
    try {
      const { data: tables, error: tablesError } = await supabase.rpc(
        "get_tables"
      );

      if (tablesError) {
        console.log("⚠️ Erro ao listar tabelas via RPC:", tablesError.message);
        console.log("🔧 Tentando método alternativo...");

        // Tentar acessar tabelas específicas
        const testTables = ["profiles", "professionals", "clients", "unidades"];
        for (const tableName of testTables) {
          try {
            const { count, error: tableError } = await supabase
              .from(tableName)
              .select("*", { count: "exact", head: true });

            if (tableError) {
              console.log(`  ❌ ${tableName}: ${tableError.message}`);
            } else {
              console.log(`  ✅ ${tableName}: ${count || 0} registros`);
            }
          } catch (e) {
            console.log(`  ❌ ${tableName}: Erro - ${e.message}`);
          }
        }
      } else {
        console.log(`✅ Tabelas encontradas: ${tables?.length || 0}`);
      }
    } catch (e) {
      console.log("⚠️ Erro ao verificar estrutura:", e.message);
    }

    // Configuração para SQLTools
    console.log("\n🔧 CONFIGURAÇÃO PARA SQLTOOLS:");
    console.log("===============================");
    console.log("Para conectar via SQLTools, use:");
    console.log(`📡 Host: zbgzwvuegwpbkranaddg.supabase.co`);
    console.log("🗄️ Database: postgres");
    console.log("👤 Username: postgres");
    console.log("🔑 Password: [Sua senha do banco Supabase]");
    console.log("🔌 Port: 5432");
    console.log("🔒 SSL: Require");
    console.log("🔗 Connection String:");
    console.log(
      `postgresql://postgres:[SUA_SENHA]@zbgzwvuegwpbkranaddg.supabase.co:5432/postgres`
    );

    console.log("\n🎉 Análise concluída!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

fixEnvAndTest();
