import fs from "fs";
import path from "path";

function fixEnvFile() {
  console.log("🔧 CORRIGINDO ARQUIVO .ENV.LOCAL");
  console.log("==================================\n");

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = fs.readFileSync(envPath, "utf8");

    console.log("📋 Arquivo .env.local encontrado");

    // Extrair as chaves quebradas
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    const serviceKeyMatch = envContent.match(
      /NEXT_PUBLIC_SUPABASE_service_role_KEY=(.+)/
    );

    if (!urlMatch || !anonKeyMatch) {
      throw new Error("Chaves do Supabase não encontradas");
    }

    // Reconstruir as chaves completas
    const supabaseUrl = urlMatch[1].trim();

    // Para a chave anon, precisamos juntar as linhas quebradas
    let anonKey = anonKeyMatch[1];
    const lines = envContent.split("\n");
    let currentLine = lines.findIndex((line) =>
      line.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=")
    );

    if (currentLine !== -1) {
      let fullKey = "";
      let i = currentLine;

      while (
        i < lines.length &&
        !lines[i].includes("NEXT_PUBLIC_SUPABASE_service_role_KEY=")
      ) {
        if (lines[i].includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
          fullKey += lines[i]
            .replace("NEXT_PUBLIC_SUPABASE_ANON_KEY=", "")
            .trim();
        } else if (lines[i].trim() && !lines[i].startsWith("#")) {
          fullKey += lines[i].trim();
        }
        i++;
      }
      anonKey = fullKey;
    }

    // Para a service key, fazer o mesmo
    let serviceKey = "";
    if (serviceKeyMatch) {
      currentLine = lines.findIndex((line) =>
        line.includes("NEXT_PUBLIC_SUPABASE_service_role_KEY=")
      );

      if (currentLine !== -1) {
        let fullKey = "";
        let i = currentLine;

        while (i < lines.length && !lines[i].startsWith("#")) {
          if (lines[i].includes("NEXT_PUBLIC_SUPABASE_service_role_KEY=")) {
            fullKey += lines[i]
              .replace("NEXT_PUBLIC_SUPABASE_service_role_KEY=", "")
              .trim();
          } else if (lines[i].trim() && !lines[i].startsWith("#")) {
            fullKey += lines[i].trim();
          }
          i++;
        }
        serviceKey = fullKey;
      }
    }

    console.log("🔑 Chaves extraídas:");
    console.log(`📡 URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key: ${anonKey.substring(0, 30)}...`);
    if (serviceKey) {
      console.log(`🔑 Service Key: ${serviceKey.substring(0, 30)}...`);
    }

    // Criar novo conteúdo corrigido
    const newEnvContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
NEXT_PUBLIC_SUPABASE_service_role_KEY=${serviceKey}

# API ASAAS
ASAAS_TRATO_API_KEY='$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmUxZTA3YTQyLWE4MjAtNDJlMy04NGIxLTdjYWI5MWVlZTIyMzo6JGFhY2hfOWQ2Yjc2ZjctZTg4Yy00NzgxLWFiMGQtYTNiMTAzYjE4Y2U0'
`;

    // Fazer backup do arquivo original
    const backupPath = path.join(process.cwd(), ".env.local.backup");
    fs.writeFileSync(backupPath, envContent);
    console.log("💾 Backup criado: .env.local.backup");

    // Escrever o novo arquivo
    fs.writeFileSync(envPath, newEnvContent);
    console.log("✅ Arquivo .env.local corrigido!");

    // Testar se as chaves estão funcionando
    console.log("\n🧪 Testando chaves corrigidas...");

    // Verificar se as chaves têm o formato correto
    if (anonKey.length > 100 && anonKey.includes("eyJ")) {
      console.log("✅ Chave anon parece válida");
    } else {
      console.log("❌ Chave anon parece inválida");
    }

    if (serviceKey.length > 100 && serviceKey.includes("eyJ")) {
      console.log("✅ Chave service parece válida");
    } else {
      console.log("❌ Chave service parece inválida");
    }

    console.log("\n🎉 Correção concluída!");
    console.log("🔧 Agora você pode testar a conexão novamente.");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

fixEnvFile();
