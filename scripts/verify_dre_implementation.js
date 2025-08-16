import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zbgzwvuegwpbkranaddg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3p3dnVlZ3dwYmtyYW5hZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAyNDcwMywiZXhwIjoyMDY1NjAwNzAzfQ.4W4usd1mrG0L6H5bJkPlAjQc7uorMiiujrtj55TgaSQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDreImplementation() {
  try {
    console.log("🔍 VERIFICANDO IMPLEMENTAÇÃO DO MÓDULO DRE");
    console.log("===========================================");
    console.log("🔌 Conectando ao Supabase...");

    // Testar conexão
    const { data: testData, error: testError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (testError) {
      console.log(`❌ Erro na conexão: ${testError.message}`);
      return;
    }

    console.log("✅ Conectado ao Supabase com sucesso!");

    // 1. Verificar se as tabelas foram criadas
    console.log("\n📋 VERIFICANDO TABELAS DO MÓDULO DRE:");
    console.log("=======================================");

    const tablesToCheck = [
      "contas_contabeis",
      "lancamentos_contabeis",
      "centros_custo",
      "dre",
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          if (
            error.message.includes("relation") &&
            error.message.includes("does not exist")
          ) {
            console.log(`  ❌ ${tableName}: Tabela não existe`);
          } else {
            console.log(`  ⚠️ ${tableName}: ${error.message}`);
          }
        } else {
          console.log(`  ✅ ${tableName}: Tabela existe e acessível`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: Erro ao verificar - ${err.message}`);
      }
    }

    // 2. Verificar se a função calculate_dre foi criada
    console.log("\n🔧 VERIFICANDO FUNÇÃO CALCULATE_DRE:");
    console.log("======================================");

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "calculate_dre",
        {
          p_data_inicio: "2024-01-01",
          p_data_fim: "2024-01-31",
        }
      );

      if (rpcError) {
        if (rpcError.message.includes("Could not find the function")) {
          console.log("  ❌ Função calculate_dre: Não foi criada");
        } else {
          console.log(`  ⚠️ Função calculate_dre: ${rpcError.message}`);
        }
      } else {
        console.log("  ✅ Função calculate_dre: Funcionando corretamente!");
        console.log(`  📊 Resultados retornados: ${rpcData.length} registros`);
      }
    } catch (err) {
      console.log("  ❌ Erro ao testar função calculate_dre");
    }

    // 3. Verificar dados iniciais
    console.log("\n📝 VERIFICANDO DADOS INICIAIS:");
    console.log("=================================");

    // Verificar contas contábeis
    try {
      const { data: contasData, error: contasError } = await supabase
        .from("contas_contabeis")
        .select("codigo, nome, tipo")
        .limit(5);

      if (contasError) {
        console.log(`  ❌ Contas contábeis: ${contasError.message}`);
      } else {
        console.log(
          `  ✅ Contas contábeis: ${contasData.length} registros encontrados`
        );
        if (contasData.length > 0) {
          console.log("  📋 Exemplos de contas:");
          contasData.forEach((conta) => {
            console.log(`    - ${conta.codigo}: ${conta.nome} (${conta.tipo})`);
          });
        }
      }
    } catch (err) {
      console.log(`  ❌ Erro ao verificar contas contábeis: ${err.message}`);
    }

    // Verificar centros de custo
    try {
      const { data: centrosData, error: centrosError } = await supabase
        .from("centros_custo")
        .select("codigo, nome, unidade_id")
        .limit(5);

      if (centrosError) {
        console.log(`  ❌ Centros de custo: ${centrosError.message}`);
      } else {
        console.log(
          `  ✅ Centros de custo: ${centrosData.length} registros encontrados`
        );
        if (centrosData.length > 0) {
          console.log("  📋 Exemplos de centros:");
          centrosData.forEach((centro) => {
            console.log(
              `    - ${centro.codigo}: ${centro.nome} (${centro.unidade_id})`
            );
          });
        }
      }
    } catch (err) {
      console.log(`  ❌ Erro ao verificar centros de custo: ${err.message}`);
    }

    // 4. Resumo da implementação
    console.log("\n📊 RESUMO DA IMPLEMENTAÇÃO:");
    console.log("=============================");

    let tablesCreated = 0;
    let functionWorking = false;
    let dataInserted = false;

    // Contar tabelas criadas
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("count")
          .limit(1);

        if (!error) {
          tablesCreated++;
        }
      } catch (err) {
        // Tabela não existe
      }
    }

    // Verificar função
    try {
      const { error: rpcError } = await supabase.rpc("calculate_dre", {
        p_data_inicio: "2024-01-01",
        p_data_fim: "2024-01-31",
      });
      if (!rpcError) {
        functionWorking = true;
      }
    } catch (err) {
      // Função não funciona
    }

    // Verificar dados
    try {
      const { data: contasData, error: contasError } = await supabase
        .from("contas_contabeis")
        .select("count")
        .limit(1);

      if (!contasError && contasData && contasData.length > 0) {
        dataInserted = true;
      }
    } catch (err) {
      // Dados não inseridos
    }

    console.log(
      `  📋 Tabelas criadas: ${tablesCreated}/${tablesToCheck.length}`
    );
    console.log(
      `  🔧 Função calculate_dre: ${
        functionWorking ? "✅ Funcionando" : "❌ Não funciona"
      }`
    );
    console.log(
      `  📝 Dados iniciais: ${
        dataInserted ? "✅ Inseridos" : "❌ Não inseridos"
      }`
    );

    if (
      tablesCreated === tablesToCheck.length &&
      functionWorking &&
      dataInserted
    ) {
      console.log("\n🎉 MÓDULO DRE IMPLEMENTADO COM SUCESSO!");
      console.log("📊 Sistema financeiro está funcionando perfeitamente!");
    } else {
      console.log("\n⚠️ MÓDULO DRE PARCIALMENTE IMPLEMENTADO");
      console.log(
        "📝 Execute o arquivo SQL no painel do Supabase para completar"
      );
    }

    // 5. Instruções para completar (se necessário)
    if (
      tablesCreated < tablesToCheck.length ||
      !functionWorking ||
      !dataInserted
    ) {
      console.log("\n📋 PARA COMPLETAR A IMPLEMENTAÇÃO:");
      console.log("=====================================");
      console.log("  1. Acesse: https://supabase.com/dashboard");
      console.log("  2. Faça login e acesse o projeto: zbgzwvuegwpbkranaddg");
      console.log("  3. Clique em 'SQL Editor' no menu lateral");
      console.log("  4. Clique em 'New query'");
      console.log(
        "  5. Copie e cole todo o conteúdo do arquivo: dre_implementation_simple.sql"
      );
      console.log("  6. Clique em 'Run' para executar");
      console.log("  7. Execute este script novamente para verificar");
    }
  } catch (error) {
    console.error("❌ Erro durante a verificação:", error.message);
    console.error("🔍 Detalhes do erro:", error);
  }
}

verifyDreImplementation();
