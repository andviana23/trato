"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useUnit } from "@/src/contexts/UnitContext";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Unidade = { id: string; nome: string };

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { setUnit } = useUnit();
  const { signIn } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadeId, setUnidadeId] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("unidades").select("id,nome").order("nome");
        const norm = ((data as { id: string | number; nome: string | null }[] | null) ?? [])
          .map((u) => ({ id: String(u.id), nome: u.nome ?? "" }))
          .filter((u) => u.id);
        setUnidades(norm);
        const last = typeof window !== "undefined" ? localStorage.getItem("tb.unidade_id") : null;
        if (last && norm.some((u) => u.id === last)) setUnidadeId(last);
        else if (norm.length > 0) setUnidadeId(norm[0].id);
      } catch {
        setUnidades([]);
      }
    })();
  }, [supabase]);

  const canSubmit = Boolean(unidadeId) && /.+@.+\..+/.test(email) && senha.trim().length >= 6 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const result = await signIn(email, senha);
      if (!result.success) throw new Error(result.error || "Falha no login");

      const unidade = unidades.find((u) => u.id === unidadeId);
      const nome = unidade?.nome?.toLowerCase() ?? "";
      const slug = nome.includes("barber") ? "barberbeer" : "trato";
      try { document.cookie = `tb.unidade=${encodeURIComponent(slug)}; Path=/; Max-Age=${60*60*24*30}; SameSite=Lax`; } catch {}
      setUnit(unidadeId, unidade?.nome ?? null);
      toast.success("Login realizado");
      router.replace("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Lado visual */}
      <div className="hidden md:block bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600" />
      {/* Formulário */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Entrar</CardTitle>
              {mounted && (
                <Button variant="ghost" size="sm" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema">
                  {resolvedTheme === 'dark' ? '🌙' : '☀️'}
                </Button>
              )}
            </div>
            <CardDescription>Use suas credenciais para acessar</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm">Unidade</label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm">Senha</label>
                <div className="relative mt-1">
                  <Input type={showPwd ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm" onClick={() => setShowPwd((v) => !v)} aria-label="Alternar visibilidade da senha">{showPwd ? 'Ocultar' : 'Mostrar'}</button>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Mínimo de 6 caracteres</div>
              </div>
              <Button type="submit" className="w-full" disabled={!canSubmit} aria-busy={loading}>Entrar</Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <a className="text-sm underline" href="/help">Precisa de ajuda?</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
 
