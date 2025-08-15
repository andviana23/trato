"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlanoModalProps {
  open: boolean;
  onClose: () => void;
  onSalvar: (plano: { id?: string; nome: string; preco: number; descricao: string; categoria?: string }) => void;
  plano?: { id?: string; nome?: string; preco?: number; descricao?: string; categoria?: string };
}

export default function PlanoModal({ open, onClose, onSalvar, plano }: PlanoModalProps) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [erro, setErro] = useState("");
  const [categorias, setCategorias] = useState<string[]>(["Básico", "Premium"]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [adicionandoCategoria, setAdicionandoCategoria] = useState(false);

  useEffect(() => {
    if (plano) {
      setNome(plano.nome || "");
      setPreco(plano.preco !== undefined ? String(plano.preco) : "");
      setDescricao(plano.descricao || "");
      setCategoria(plano.categoria || "");
    } else {
      setNome("");
      setPreco("");
      setDescricao("");
      setCategoria("");
    }
  }, [plano, open]);

  const opcoes = useMemo(() => ["", ...categorias], [categorias]);

  function handleSalvar() {
    if (!nome || !preco) {
      setErro("Nome e preço são obrigatórios.");
      return;
    }
    setErro("");
    let categoriaFinal = categoria;
    if (adicionandoCategoria && novaCategoria) {
      categoriaFinal = novaCategoria;
      if (!categorias.includes(novaCategoria)) {
        setCategorias((prev) => [...prev, novaCategoria]);
      }
    }
    const planoData = { nome, preco: Number(preco), descricao, categoria: categoriaFinal };
    onSalvar(planoData);
    setNome("");
    setPreco("");
    setDescricao("");
    setCategoria("");
    setNovaCategoria("");
    setAdicionandoCategoria(false);
    onClose();
  }

  function handleAdicionarCategoria() {
    if (novaCategoria && !categorias.includes(novaCategoria)) {
      setCategorias((prev) => [...prev, novaCategoria]);
      setCategoria(novaCategoria);
      setNovaCategoria("");
      setAdicionandoCategoria(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Plano</DialogTitle>
        </DialogHeader>
        {erro && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label className="text-sm">Nome do plano</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do plano" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Preço</label>
            <Input type="number" min={0} step={0.01} value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="Preço" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Categoria</label>
            <div className="flex items-start gap-2">
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {opcoes.map((c, i) => (
                    <SelectItem key={i} value={c}>{c || 'Selecione uma categoria'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setAdicionandoCategoria((v) => !v)}>
                {adicionandoCategoria ? "Cancelar" : "+ Categoria"}
              </Button>
            </div>
            {adicionandoCategoria && (
              <div className="flex items-center gap-2 mt-2">
                <Input placeholder="Nova categoria" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} />
                <Button onClick={handleAdicionarCategoria}>Salvar</Button>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Descrição</label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição do plano" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSalvar}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
