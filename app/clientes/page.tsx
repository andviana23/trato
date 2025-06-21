"use client";
import React, { useState } from "react";
import { Button } from "@nextui-org/react";
import FiltrosClientes from "./components/FiltrosClientes";
import ClientesTable from "./components/ClientesTable";
import ClienteModal from "./components/ClienteModal";

export default function ClientesPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [filtros, setFiltros] = useState({ busca: "", tipo: "todos" });
  const [reload, setReload] = useState(0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Clientes</h1>
        <Button
          color="primary"
          onClick={() => setModalAberto(true)}
          className="font-semibold"
        >
          Cadastrar Cliente
        </Button>
      </div>
      <FiltrosClientes filtros={filtros} setFiltros={setFiltros} />
      <ClientesTable filtros={filtros} reload={reload} />
      <ClienteModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => {
          setModalAberto(false);
          setReload((r) => r + 1);
        }}
      />
    </div>
  );
} 
