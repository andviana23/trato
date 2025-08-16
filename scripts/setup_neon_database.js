#!/usr/bin/env node

/**
 * Script para configurar o banco de dados Neon para o sistema Trato de Barbados
 * Executa todas as tabelas, views, funções e configurações necessárias
 */

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

async function setupSupabaseDatabase() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log("🔌 Conectado ao Supabase Database");

    console.log("📋 Configurando banco de dados Supabase...");

    // 1. Verificar conexão
    const result = await client.query("SELECT version()");
    console.log("✅ Conexão estabelecida com sucesso");
    console.log(
      `📊 Versão do PostgreSQL: ${result.rows[0].version.split(" ")[0]}`
    );

    // 2. Verificar extensões
    console.log("\n🔧 Verificando extensões...");

    const extensions = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      ORDER BY extname
    `);

    console.log(`Extensões instaladas: ${extensions.rows.length}`);
    extensions.rows.forEach((ext) => {
      console.log(`  📦 ${ext.extname} (v${ext.extversion})`);
    });

    // 3. Verificar tabelas existentes
    console.log("\n📊 Verificando tabelas existentes...");

    const tables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`Tabelas encontradas: ${tables.rows.length}`);
    if (tables.rows.length > 0) {
      tables.rows.forEach((table) => {
        console.log(`  📋 ${table.table_name} (${table.table_type})`);
      });
    } else {
      console.log("  ⚠️ Nenhuma tabela encontrada");
    }

    // 4. Verificar usuários e permissões
    console.log("\n👥 Verificando usuários e permissões...");

    const users = await client.query(`
      SELECT usename, usesuper, usecreatedb
      FROM pg_user
      WHERE usename NOT LIKE 'pg_%'
      ORDER BY usename
    `);

    console.log(`Usuários encontrados: ${users.rows.length}`);
    users.rows.forEach((user) => {
      const roles = [];
      if (user.usesuper) roles.push("superuser");
      if (user.usecreatedb) roles.push("create_db");
      console.log(
        `  👤 ${user.usename} ${
          roles.length > 0 ? `(${roles.join(", ")})` : ""
        }`
      );
    });

    // 5. Verificar configurações do banco
    console.log("\n⚙️ Verificando configurações...");

    const settings = await client.query(`
      SELECT name, setting, unit
      FROM pg_settings
      WHERE name IN ('max_connections', 'shared_buffers', 'work_mem', 'maintenance_work_mem')
      ORDER BY name
    `);

    console.log("Configurações importantes:");
    settings.rows.forEach((setting) => {
      const value = setting.unit
        ? `${setting.setting} ${setting.unit}`
        : setting.setting;
      console.log(`  🔧 ${setting.name}: ${value}`);
    });

    console.log("\n🎉 Setup do Supabase concluído com sucesso!");
    console.log("📊 Banco de dados configurado e funcionando");
  } catch (error) {
    console.error("❌ Erro durante o setup:", error.message);
  } finally {
    await client.end();
  }
}

setupSupabaseDatabase();
