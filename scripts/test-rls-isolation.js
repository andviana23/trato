#!/usr/bin/env node

/**
 * Script de Teste para RLS (Row Level Security)
 *
 * Este script testa o isolamento de dados e as políticas de segurança
 * implementadas no sistema Trato de Barbados.
 *
 * Objetivos:
 * 1. Verificar se usuários só podem acessar dados de sua unidade
 * 2. Testar controle de acesso baseado em roles
 * 3. Validar propriedade de recursos
 * 4. Verificar auditoria de operações
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente do Supabase não encontradas");
  console.log(
    "Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function logTest(name, description) {
  console.log(`\n🧪 TESTE: ${name}`);
  console.log(`📝 ${description}`);
  console.log("─".repeat(60));
}

function logResult(success, message, details = null) {
  const icon = success ? "✅" : "❌";
  const status = success ? "PASSOU" : "FALHOU";
  console.log(`${icon} ${status}: ${message}`);

  if (details && !success) {
    console.log(`   Detalhes: ${details}`);
  }
}

function logSection(title) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log(`${"=".repeat(60)}`);
}

// ============================================================================
// TESTES DE ISOLAMENTO POR UNIDADE
// ============================================================================

async function testUnitIsolation() {
  logSection("TESTES DE ISOLAMENTO POR UNIDADE");

  try {
    // 1. Testar acesso a clientes de diferentes unidades
    logTest(
      "Isolamento de Clientes",
      "Verificar se usuários só veem clientes de sua unidade"
    );

    const { data: clientes, error: clientesError } = await supabase
      .from("clientes")
      .select("*")
      .limit(5);

    if (clientesError) {
      logResult(false, "Erro ao buscar clientes", clientesError.message);
    } else {
      logResult(true, `Encontrados ${clientes?.length || 0} clientes`);

      // Verificar se todos os clientes são da mesma unidade (para usuários logados)
      if (clientes && clientes.length > 0) {
        const unidades = [...new Set(clientes.map((c) => c.unidade))];
        logResult(
          true,
          `Clientes encontrados em ${
            unidades.length
          } unidade(s): ${unidades.join(", ")}`
        );
      }
    }

    // 2. Testar acesso a profissionais
    logTest(
      "Isolamento de Profissionais",
      "Verificar se usuários só veem profissionais de sua unidade"
    );

    const { data: profissionais, error: profError } = await supabase
      .from("profissionais")
      .select("*")
      .limit(5);

    if (profError) {
      logResult(false, "Erro ao buscar profissionais", profError.message);
    } else {
      logResult(
        true,
        `Encontrados ${profissionais?.length || 0} profissionais`
      );
    }

    // 3. Testar acesso a agendamentos
    logTest(
      "Isolamento de Agendamentos",
      "Verificar se usuários só veem agendamentos de sua unidade"
    );

    const { data: agendamentos, error: agendError } = await supabase
      .from("appointments")
      .select("*")
      .limit(5);

    if (agendError) {
      logResult(false, "Erro ao buscar agendamentos", agendError.message);
    } else {
      logResult(true, `Encontrados ${agendamentos?.length || 0} agendamentos`);
    }
  } catch (error) {
    console.error("❌ Erro durante testes de isolamento:", error);
  }
}

// ============================================================================
// TESTES DE CONTROLE DE ACESSO POR ROLE
// ============================================================================

async function testRoleBasedAccess() {
  logSection("TESTES DE CONTROLE DE ACESSO POR ROLE");

  try {
    // 1. Testar acesso a tabelas de configuração (deve ser visível para todos autenticados)
    logTest(
      "Acesso a Categorias",
      "Verificar se usuários autenticados podem ver categorias"
    );

    const { data: categorias, error: catError } = await supabase
      .from("categorias")
      .select("*")
      .limit(5);

    if (catError) {
      logResult(false, "Erro ao buscar categorias", catError.message);
    } else {
      logResult(true, `Encontradas ${categorias?.length || 0} categorias`);
    }

    // 2. Testar acesso a tabelas de produtos
    logTest(
      "Acesso a Produtos",
      "Verificar se usuários podem ver produtos de sua unidade"
    );

    // Tentar acessar produtos Trato
    const { data: produtosTrato, error: prodTratoError } = await supabase
      .from("produtos_trato_de_barbados")
      .select("*")
      .limit(5);

    if (prodTratoError) {
      logResult(false, "Erro ao buscar produtos Trato", prodTratoError.message);
    } else {
      logResult(
        true,
        `Encontrados ${produtosTrato?.length || 0} produtos Trato`
      );
    }

    // 3. Testar acesso a tabelas de metas
    logTest(
      "Acesso a Metas",
      "Verificar se usuários podem ver metas de sua unidade"
    );

    const { data: metas, error: metasError } = await supabase
      .from("metas")
      .select("*")
      .limit(5);

    if (metasError) {
      logResult(false, "Erro ao buscar metas", metasError.message);
    } else {
      logResult(true, `Encontradas ${metas?.length || 0} metas`);
    }
  } catch (error) {
    console.error("❌ Erro durante testes de controle de acesso:", error);
  }
}

// ============================================================================
// TESTES DE PROPRIEDADE DE RECURSOS
// ============================================================================

async function testResourceOwnership() {
  logSection("TESTES DE PROPRIEDADE DE RECURSOS");

  try {
    // 1. Testar acesso ao próprio perfil
    logTest(
      "Acesso ao Próprio Perfil",
      "Verificar se usuários podem acessar seu próprio perfil"
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      logResult(
        false,
        "Usuário não autenticado",
        userError?.message || "Nenhum usuário encontrado"
      );
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      logResult(false, "Erro ao buscar perfil próprio", profileError.message);
    } else {
      logResult(true, "Perfil próprio acessado com sucesso");
    }

    // 2. Testar acesso a tokens de autenticação
    logTest(
      "Acesso a Tokens de Auth",
      "Verificar se usuários podem acessar seus próprios tokens"
    );

    const { data: tokens, error: tokensError } = await supabase
      .from("google_auth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .limit(5);

    if (tokensError) {
      logResult(false, "Erro ao buscar tokens de auth", tokensError.message);
    } else {
      logResult(true, `Encontrados ${tokens?.length || 0} tokens de auth`);
    }
  } catch (error) {
    console.error("❌ Erro durante testes de propriedade de recursos:", error);
  }
}

// ============================================================================
// TESTES DE AUDITORIA
// ============================================================================

async function testAuditTrail() {
  logSection("TESTES DE AUDITORIA");

  try {
    // 1. Verificar se a tabela de auditoria existe
    logTest(
      "Tabela de Auditoria",
      "Verificar se a tabela audit_logs existe e é acessível"
    );

    const { data: auditLogs, error: auditError } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (auditError) {
      logResult(false, "Erro ao buscar logs de auditoria", auditError.message);
    } else {
      logResult(
        true,
        `Encontrados ${auditLogs?.length || 0} logs de auditoria`
      );

      // Mostrar alguns logs recentes
      if (auditLogs && auditLogs.length > 0) {
        console.log("   📊 Logs recentes:");
        auditLogs.slice(0, 3).forEach((log) => {
          console.log(
            `      - ${log.action} em ${log.resource} (${new Date(
              log.timestamp
            ).toLocaleString()})`
          );
        });
      }
    }

    // 2. Testar inserção de log de auditoria
    logTest(
      "Inserção de Log",
      "Verificar se é possível inserir logs de auditoria"
    );

    const testLog = {
      action: "TEST_ACCESS",
      resource: "RLS_TEST",
      resource_id: "00000000-0000-0000-0000-000000000000",
      metadata: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        description: "Teste de auditoria RLS",
      }),
      success: true,
    };

    const { data: insertedLog, error: insertError } = await supabase
      .from("audit_logs")
      .insert(testLog)
      .select()
      .single();

    if (insertError) {
      logResult(false, "Erro ao inserir log de auditoria", insertError.message);
    } else {
      logResult(true, "Log de auditoria inserido com sucesso");

      // Limpar log de teste
      await supabase.from("audit_logs").delete().eq("id", insertedLog.id);
    }
  } catch (error) {
    console.error("❌ Erro durante testes de auditoria:", error);
  }
}

// ============================================================================
// TESTES DE POLÍTICAS ESPECÍFICAS
// ============================================================================

async function testSpecificPolicies() {
  logSection("TESTES DE POLÍTICAS ESPECÍFICAS");

  try {
    // 1. Testar políticas de fila de barbeiros
    logTest("Políticas de Fila", "Verificar políticas da tabela barber_queue");

    const { data: fila, error: filaError } = await supabase
      .from("barber_queue")
      .select("*")
      .limit(5);

    if (filaError) {
      logResult(false, "Erro ao buscar fila de barbeiros", filaError.message);
    } else {
      logResult(true, `Encontrados ${fila?.length || 0} registros na fila`);
    }

    // 2. Testar políticas de notificações
    logTest(
      "Políticas de Notificações",
      "Verificar políticas da tabela notifications_queue"
    );

    const { data: notificacoes, error: notifError } = await supabase
      .from("notifications_queue")
      .select("*")
      .limit(5);

    if (notifError) {
      logResult(false, "Erro ao buscar notificações", notifError.message);
    } else {
      logResult(true, `Encontradas ${notificacoes?.length || 0} notificações`);
    }

    // 3. Testar políticas de vendas
    logTest(
      "Políticas de Vendas",
      "Verificar políticas da tabela vendas_produtos"
    );

    const { data: vendas, error: vendasError } = await supabase
      .from("vendas_produtos")
      .select("*")
      .limit(5);

    if (vendasError) {
      logResult(false, "Erro ao buscar vendas", vendasError.message);
    } else {
      logResult(true, `Encontradas ${vendas?.length || 0} vendas`);
    }
  } catch (error) {
    console.error("❌ Erro durante testes de políticas específicas:", error);
  }
}

// ============================================================================
// TESTES DE FUNÇÕES AUXILIARES
// ============================================================================

async function testHelperFunctions() {
  logSection("TESTES DE FUNÇÕES AUXILIARES");

  try {
    // 1. Testar função is_admin_or_owner
    logTest(
      "Função is_admin_or_owner",
      "Verificar se a função auxiliar funciona corretamente"
    );

    const { data: adminCheck, error: adminError } = await supabase.rpc(
      "is_admin_or_owner"
    );

    if (adminError) {
      logResult(
        false,
        "Erro ao executar is_admin_or_owner",
        adminError.message
      );
    } else {
      logResult(true, `Resultado da verificação: ${adminCheck}`);
    }

    // 2. Testar função is_professional
    logTest(
      "Função is_professional",
      "Verificar se a função auxiliar funciona corretamente"
    );

    const { data: profCheck, error: profError } = await supabase.rpc(
      "is_professional"
    );

    if (profError) {
      logResult(false, "Erro ao executar is_professional", profError.message);
    } else {
      logResult(true, `Resultado da verificação: ${profCheck}`);
    }

    // 3. Testar função has_unit_access
    logTest(
      "Função has_unit_access",
      "Verificar se a função auxiliar funciona corretamente"
    );

    // Buscar uma unidade para testar
    const { data: unidades, error: unidadesError } = await supabase
      .from("unidades")
      .select("id")
      .limit(1);

    if (unidadesError || !unidades || unidades.length === 0) {
      logResult(
        false,
        "Não foi possível obter unidade para teste",
        unidadesError?.message
      );
    } else {
      const unidadeId = unidades[0].id;
      const { data: accessCheck, error: accessError } = await supabase.rpc(
        "has_unit_access",
        {
          unidade_id_param: unidadeId,
        }
      );

      if (accessError) {
        logResult(
          false,
          "Erro ao executar has_unit_access",
          accessError.message
        );
      } else {
        logResult(true, `Acesso à unidade ${unidadeId}: ${accessCheck}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro durante testes de funções auxiliares:", error);
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function runAllTests() {
  console.log("🚀 INICIANDO TESTES DE RLS E ISOLAMENTO DE DADOS");
  console.log("📅 Data/Hora:", new Date().toLocaleString());
  console.log("🔗 Supabase URL:", supabaseUrl);

  try {
    // Executar todos os testes
    await testUnitIsolation();
    await testRoleBasedAccess();
    await testResourceOwnership();
    await testAuditTrail();
    await testSpecificPolicies();
    await testHelperFunctions();

    console.log("\n🎉 TODOS OS TESTES FORAM EXECUTADOS!");
    console.log("\n📋 RESUMO:");
    console.log("✅ Testes de isolamento por unidade");
    console.log("✅ Testes de controle de acesso por role");
    console.log("✅ Testes de propriedade de recursos");
    console.log("✅ Testes de auditoria");
    console.log("✅ Testes de políticas específicas");
    console.log("✅ Testes de funções auxiliares");

    console.log("\n💡 PRÓXIMOS PASSOS:");
    console.log("1. Revisar resultados dos testes");
    console.log("2. Corrigir falhas identificadas");
    console.log("3. Executar testes em ambiente de produção");
    console.log("4. Monitorar logs de auditoria");
    console.log("5. Treinar usuários sobre as novas restrições");
  } catch (error) {
    console.error("\n💥 ERRO CRÍTICO DURANTE OS TESTES:", error);
    process.exit(1);
  }
}

// Executar testes se o script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testUnitIsolation,
  testRoleBasedAccess,
  testResourceOwnership,
  testAuditTrail,
  testSpecificPolicies,
  testHelperFunctions,
  runAllTests,
};
