"use client";

import React, { useEffect, useMemo, useState } from "react";
import PlanoModal from "./components/PlanoModal";
import { getPlanos, criarPlano } from "@/lib/services/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

type Plano = {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria?: string;
};

export default function PlanosPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("all");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);

  useEffect(() => {
    async function fetchPlanos() {
      setCarregando(true);
      try {
        const data = (await getPlanos()) as unknown as Plano[];
        setPlanos(data || []);
        setCategorias(
          Array.from(new Set((data || []).map((p) => p.categoria).filter(Boolean))) as string[]
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setErro("Erro ao buscar planos: " + msg);
      } finally {
        setCarregando(false);
      }
    }
    fetchPlanos();
  }, []);

  async function handleNovoPlano(plano: Omit<Plano, "id">) {
    try {
      const novo = (await criarPlano(plano)) as unknown as Plano | undefined;
      if (!novo) throw new Error("Plano não foi criado.");
      setPlanos((prev) => [...prev, novo]);
      if (novo.categoria && !categorias.includes(novo.categoria)) {
        setCategorias((prev) => [...prev, novo.categoria!]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErro("Erro ao criar plano: " + msg);
    }
  }

  function handleEditarPlano(plano: Plano) {
    setPlanoEditando(plano);
    setModalAberto(true);
  }

  function handleSalvarPlanoEditado(planoEditado: Plano) {
    setPlanos((prev) => prev.map((p) => (p.id === planoEditado.id ? planoEditado : p)));
    if (planoEditado.categoria && !categorias.includes(planoEditado.categoria)) {
      setCategorias((prev) => [...prev, planoEditado.categoria!]);
    }
    setPlanoEditando(null);
    setModalAberto(false);
  }

  function handleExcluirPlano(planoId: string) {
    if (window.confirm("Tem certeza que deseja excluir este plano?")) {
      setPlanos((prev) => prev.filter((p) => p.id !== planoId));
    }
  }

  const planosFiltrados = planos.filter(
    (plano) => categoriaFiltro === "all" || plano.categoria === categoriaFiltro
  );

  // coleção não é necessária com shadcn Select; usamos map direto

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Planos</h1>
          <p className="text-sm text-muted-foreground">Gestão de planos de assinatura disponíveis</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Filtrar por categoria</div>
            <Select value={categoriaFiltro} onValueChange={(v) => setCategoriaFiltro(v)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setModalAberto(true)}>Novo Plano</Button>
        </div>
      </div>

      {erro && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {carregando ? (
        <div className="flex justify-center py-10">Carregando...</div>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-3">Planos cadastrados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planosFiltrados.map((plano) => (
               <Card
                key={plano.id}
                className="rounded-xl border border-border"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold">{plano.nome}</div>
                        {plano.categoria && <Badge>{plano.categoria}</Badge>}
                      </div>
                      <div className="text-lg font-extrabold text-blue-500">
                        {Number.isFinite(plano.preco)
                          ? `R$ ${Number(plano.preco).toFixed(2)}`
                          : "R$ --"}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditarPlano(plano)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleExcluirPlano(plano.id)}>
                        Excluir
                      </Button>
                    </div>
                  </div>
                  {plano.descricao && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {plano.descricao}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <PlanoModal
        open={modalAberto}
        plano={planoEditando ?? undefined}
        onClose={() => {
          setModalAberto(false);
          setPlanoEditando(null);
        }}
        onSalvar={planoEditando ? handleSalvarPlanoEditado : (p) => handleNovoPlano(p as Omit<Plano, "id">)}
      />
    </div>
  );
} 
