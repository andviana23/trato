"use client";
import React, { useState, useEffect } from "react";
import { Input, Button } from "@nextui-org/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
export default function FiltrosClientes({ filtros, setFiltros, }) {
    const [busca, setBusca] = useState(filtros.busca);
    // Debounce para busca
    useEffect(() => {
        const timeout = setTimeout(() => {
            setFiltros(Object.assign(Object.assign({}, filtros), { busca }));
        }, 300);
        return () => clearTimeout(timeout);
    }, [busca]);
    return (<div className="flex gap-4 items-center mb-4">
      <Input isClearable placeholder="Pesquisar por nome ou telefone" startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400"/>} value={busca} onValueChange={setBusca} className="max-w-xs"/>
      <Button variant="ghost" onClick={() => {
            setBusca("");
            setFiltros(Object.assign(Object.assign({}, filtros), { busca: "" }));
        }}>
        Limpar filtros
      </Button>
    </div>);
}
