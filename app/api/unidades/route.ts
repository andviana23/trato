import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("unidades")
      .select("id,nome")
      .order("nome", { ascending: true });
    if (error) throw error;
    const unidades = (data ?? [])
      .map((u: any) => ({ id: String(u.id), nome: u.nome as string }))
      .filter((u) => !!u.id);
    return NextResponse.json({ data: unidades });
  } catch (err) {
    return NextResponse.json({ error: "Falha ao carregar unidades" }, { status: 500 });
  }
}


