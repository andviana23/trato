import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, password, unidade_id } = await req.json();
    if (!email || !password || !unidade_id) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session) return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });

    const cookieStore = await cookies();
    cookieStore.set("tb.unit", String(unidade_id), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Falha no login" }, { status: 401 });
  }
}


