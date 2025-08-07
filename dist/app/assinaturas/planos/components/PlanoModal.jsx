"use client";
import React, { useState, useEffect } from "react";
export default function PlanoModal({ open, onClose, onSalvar, plano }) {
    const [nome, setNome] = useState("");
    const [preco, setPreco] = useState("");
    const [descricao, setDescricao] = useState("");
    const [categoria, setCategoria] = useState("");
    const [erro, setErro] = useState("");
    const [categorias, setCategorias] = useState(["Básico", "Premium"]);
    const [novaCategoria, setNovaCategoria] = useState("");
    const [adicionandoCategoria, setAdicionandoCategoria] = useState(false);
    useEffect(() => {
        if (plano) {
            setNome(plano.nome || "");
            setPreco(plano.preco !== undefined ? String(plano.preco) : "");
            setDescricao(plano.descricao || "");
            setCategoria(plano.categoria || "");
        }
        else {
            setNome("");
            setPreco("");
            setDescricao("");
            setCategoria("");
        }
    }, [plano, open]);
    if (!open)
        return null;
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
                setCategorias([...categorias, novaCategoria]);
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
            setCategorias([...categorias, novaCategoria]);
            setCategoria(novaCategoria);
            setNovaCategoria("");
            setAdicionandoCategoria(false);
        }
    }
    return (open && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md mx-2 animate-fade-in">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 text-center">Novo Plano</h2>
          <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); handleSalvar(); }}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do plano</label>
              <input placeholder="Nome do plano" value={nome} onChange={e => setNome(e.target.value)} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none"/>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Preço</label>
              <input placeholder="Preço" type="number" min="0" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none"/>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
              <div className="flex gap-2 items-center">
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none flex-1">
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <button type="button" onClick={() => setAdicionandoCategoria((v) => !v)} className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  +
                </button>
              </div>
              {adicionandoCategoria && (<div className="flex gap-2 items-center mt-2">
                  <input placeholder="Nova categoria" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none flex-1"/>
                  <button type="button" onClick={handleAdicionarCategoria} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                    Salvar
                  </button>
                </div>)}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
              <textarea placeholder="Descrição do plano" value={descricao} onChange={e => setDescricao(e.target.value)} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none min-h-[80px] resize-y"/>
            </div>
            {erro && <span className="text-red-600 dark:text-red-400 text-sm text-center">{erro}</span>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>));
}
