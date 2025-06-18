import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error("[Supabase] Variáveis de ambiente faltando:", {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? key.substring(0, 10) + '...' : undefined
  });
  throw new Error("[Supabase] Variáveis de ambiente não definidas!");
} else {
  // eslint-disable-next-line no-console
  console.log("[Supabase] Configuração:", {
    url,
    keyPreview: key.substring(0, 10) + '...'
  });
}

export function createClient() {
  // eslint-disable-next-line no-console
  console.log("[Supabase] Criando cliente Supabase");
  return createBrowserClient(url, key);
}
