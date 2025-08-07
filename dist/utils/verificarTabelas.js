import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export async function verificarTabelasMetas() {
    try {
        console.log("Verificando tabelas de Metas...");
        // Verificar tabela metas_barberbeer
        const { data: barberbeer, error: errorBarberBeer } = await supabase
            .from('metas_barberbeer')
            .select('count')
            .limit(1);
        if (errorBarberBeer) {
            console.error("Erro ao verificar tabela metas_barberbeer:", errorBarberBeer);
            return false;
        }
        // Verificar tabela metas_trato
        const { data: trato, error: errorTrato } = await supabase
            .from('metas_trato')
            .select('count')
            .limit(1);
        if (errorTrato) {
            console.error("Erro ao verificar tabela metas_trato:", errorTrato);
            return false;
        }
        console.log("✅ Tabelas de Metas existem no Supabase");
        return true;
    }
    catch (error) {
        console.error("Erro ao verificar tabelas:", error);
        return false;
    }
}
export async function verificarConexaoSupabase() {
    try {
        console.log("Verificando conexão com Supabase...");
        const { data, error } = await supabase
            .from('profissionais')
            .select('count')
            .limit(1);
        if (error) {
            console.error("Erro na conexão com Supabase:", error);
            return false;
        }
        console.log("✅ Conexão com Supabase funcionando");
        return true;
    }
    catch (error) {
        console.error("Erro ao verificar conexão:", error);
        return false;
    }
}
