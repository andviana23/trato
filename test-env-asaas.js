// Teste para verificar como as variáveis ASAAS estão sendo lidas
require("dotenv").config({ path: ".env.local" });

console.log("=== Análise das Variáveis ASAAS ===\n");

const TRATO_KEY = process.env.ASAAS_TRATO_API_KEY;

console.log("1. ASAAS_TRATO_API_KEY:");
console.log("   - Valor completo:", TRATO_KEY);
console.log("   - Comprimento:", TRATO_KEY ? TRATO_KEY.length : 0);
console.log(
  "   - Primeiros 30 caracteres:",
  TRATO_KEY ? TRATO_KEY.substring(0, 30) : "UNDEFINED"
);
console.log(
  "   - Começa com barra?:",
  TRATO_KEY ? TRATO_KEY.startsWith("\\") : "N/A"
);
console.log(
  "   - Começa com $?:",
  TRATO_KEY ? TRATO_KEY.startsWith("$") : "N/A"
);
console.log("   - Contém \\$?:", TRATO_KEY ? TRATO_KEY.includes("\\$") : "N/A");

console.log("\n2. Análise do problema:");
console.log("   - As chaves começam com \\$ no arquivo .env.local");
console.log("   - Isso pode estar causando problema na autenticação");
console.log("   - A API ASAAS espera que a chave comece com $ (sem a barra)");

console.log("\n3. Solução:");
console.log("   - Remova as barras (\\) das chaves no arquivo .env.local");
console.log("   - A chave deve começar diretamente com $ (exemplo: $aact_...)");
