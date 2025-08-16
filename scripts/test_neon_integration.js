import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../.env.local") });

// Importar o novo sistema de banco
import database from "../lib/database.js";

async function testNeonIntegration() {
  console.log("🚀 TESTANDO INTEGRAÇÃO COM NEON");
  console.log("================================\n");

  try {
    // Teste 1: Conexão básica
    console.log("📋 TESTE 1: Conexão básica");
    const version = await database.query("SELECT version()");
    console.log("  ✅ Conexão estabelecida");
    console.log(
      `  📊 Versão PostgreSQL: ${version.rows[0].version.substring(0, 50)}...`
    );

    // Teste 2: Verificar tabelas
    console.log("\n📋 TESTE 2: Verificar tabelas principais");
    const tables = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log("  📊 Tabelas encontradas:");
    tables.rows.forEach((row) => {
      console.log(`    📍 ${row.table_name}`);
    });

    // Teste 3: Testar funções específicas
    console.log("\n📋 TESTE 3: Funções específicas do sistema");

    // Testar busca de unidades
    console.log("  🔍 Testando busca de unidades...");
    const unidades = await database.getUnidades();
    console.log(`    ✅ Unidades encontradas: ${unidades.length}`);
    unidades.forEach((unidade) => {
      console.log(`      📍 ${unidade.nome} (${unidade.id})`);
    });

    // Teste 4: Testar busca de profissionais
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de profissionais...");
      const profissionais = await database.getProfessionalsByUnidade(
        unidades[0].id
      );
      console.log(`    ✅ Profissionais encontrados: ${profissionais.length}`);
      if (profissionais.length > 0) {
        profissionais.forEach((prof) => {
          console.log(
            `      📍 ${prof.name} - Comissão: ${prof.commission_rate}%`
          );
        });
      }
    }

    // Teste 5: Testar busca de clientes
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de clientes...");
      const clientes = await database.getClientsByUnidade(unidades[0].id);
      console.log(`    ✅ Clientes encontrados: ${clientes.length}`);
      if (clientes.length > 0) {
        clientes.slice(0, 3).forEach((cliente) => {
          console.log(
            `      📍 ${cliente.name} - ${cliente.email || "Sem email"}`
          );
        });
      }
    }

    // Teste 6: Testar busca de agendamentos
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de agendamentos...");
      const hoje = new Date();
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const agendamentos = await database.getAppointmentsByUnidade(
        unidades[0].id,
        hoje.toISOString(),
        fimMes.toISOString()
      );
      console.log(`    ✅ Agendamentos encontrados: ${agendamentos.length}`);
    }

    // Teste 7: Testar busca de produtos
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de produtos...");

      // Produtos Trato
      const produtosTrato = await database.getProdutosByUnidade(
        unidades[0].id,
        "trato"
      );
      console.log(`    📦 Produtos Trato: ${produtosTrato.length}`);

      // Produtos BarberBeer
      const produtosBBSC = await database.getProdutosByUnidade(
        unidades[0].id,
        "barberbeer"
      );
      console.log(`    📦 Produtos BarberBeer: ${produtosBBSC.length}`);
    }

    // Teste 8: Testar busca de metas
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de metas...");
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const metas = await database.getMetasByBarbeiro(
        "00000000-0000-0000-0000-000000000000", // ID fictício para teste
        mesAtual,
        anoAtual
      );
      console.log(`    📊 Metas encontradas: ${metas.length}`);
    }

    // Teste 9: Testar busca de comissões
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de comissões...");
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const comissoes = await database.getComissoesByBarbeiro(
        "00000000-0000-0000-0000-000000000000", // ID fictício para teste
        mesAtual,
        anoAtual
      );
      console.log(`    💰 Comissões encontradas: ${comissoes.length}`);
    }

    // Teste 10: Testar busca de faturamento
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de faturamento...");
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const faturamento = await database.getFaturamentoByUnidade(
        unidades[0].id,
        mesAtual,
        anoAtual
      );
      console.log(
        `    💵 Faturamento: ${faturamento ? "Encontrado" : "Não encontrado"}`
      );
    }

    // Teste 11: Testar busca de fila
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando busca de fila...");
      const fila = await database.getBarberQueueByUnidade(unidades[0].id);
      console.log(`    📋 Fila encontrada: ${fila.length} posições`);
    }

    // Teste 12: Testar relatórios
    if (unidades.length > 0) {
      console.log("\n  🔍 Testando relatórios...");

      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const relatorioAtendimentos = await database.getRelatorioAtendimentos(
        unidades[0].id,
        inicioMes.toISOString(),
        fimMes.toISOString()
      );
      console.log(
        `    📊 Relatório atendimentos: ${relatorioAtendimentos.length} dias`
      );

      const relatorioComissoes = await database.getRelatorioComissoes(
        unidades[0].id,
        hoje.getMonth() + 1,
        hoje.getFullYear()
      );
      console.log(
        `    💰 Relatório comissões: ${relatorioComissoes.length} barbeiros`
      );
    }

    console.log("\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!");
    console.log("✅ Sistema Neon integrado e funcionando perfeitamente!");
  } catch (error) {
    console.error("\n❌ Erro durante os testes:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testNeonIntegration().catch(console.error);
}

export { testNeonIntegration };
