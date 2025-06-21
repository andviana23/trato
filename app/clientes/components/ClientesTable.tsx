"use client";
import React, { useEffect, useState } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Pagination, Spinner, Tooltip
} from "@nextui-org/react";
import { Cliente } from "../types";
import { listarClientes } from "@/lib/services/clients";
import ClienteModal from "./ClienteModal";
import { StarIcon, UserIcon } from '@heroicons/react/24/solid';

export default function ClientesTable({ filtros, reload }: { filtros: any, reload: number }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    setLoading(true);
    listarClientes(filtros.busca)
      .then((data) => setClientes(data))
      .finally(() => setLoading(false));
  }, [filtros, reload]);

  // Paginação
  const pageSize = 10;
  const totalPages = Math.ceil(clientes.length / pageSize);
  const clientesPagina = clientes.slice((pagina - 1) * pageSize, pagina * pageSize);

  function handleEditarCliente(cliente: Cliente) {
    setClienteEditando(cliente);
    setModalAberto(true);
  }

  function handleFecharModal() {
    setModalAberto(false);
    setClienteEditando(null);
  }

  function handleSucessoEdicao() {
    setModalAberto(false);
    setClienteEditando(null);
    // Recarregar lista após edição
    listarClientes(filtros.busca).then((data) => setClientes(data));
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-4 md:p-8 transition-colors duration-300">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner label="Carregando clientes..." />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-8">Nenhum cliente encontrado.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label="Tabela de clientes" removeWrapper className="min-w-[700px]">
              <TableHeader>
                <TableColumn>Nome</TableColumn>
                <TableColumn>Email</TableColumn>
                <TableColumn>Telefone</TableColumn>
                <TableColumn>Tipo</TableColumn>
                <TableColumn>Ações</TableColumn>
              </TableHeader>
              <TableBody>
                {clientesPagina.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <TableCell className="font-medium text-zinc-800 dark:text-zinc-100">{cliente.nome || 'Sem nome'}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-300">{cliente.email}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-300">{cliente.telefone}</TableCell>
                    <TableCell>
                      <Tooltip content={cliente.tipo === "assinante" ? "Assinatura ativa" : "Sem assinatura ativa"} placement="top" className="text-xs">
                        <span
                          className={
                            cliente.tipo === "assinante"
                              ? "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ring-2 ring-blue-400/30 hover:ring-purple-500/50"
                              : "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 shadow hover:shadow-md transition-all duration-200 cursor-pointer"
                          }
                          tabIndex={0}
                        >
                          {cliente.tipo === "assinante" ? (
                            <StarIcon className="w-4 h-4 text-yellow-300 drop-shadow" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-zinc-400" />
                          )}
                          {cliente.tipo === "assinante" ? "Assinante" : "Avulso"}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleEditarCliente(cliente)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Editar cliente"
                      >
                        <span className="text-lg">✏️</span> Editar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4">
            <Pagination
              total={totalPages}
              page={pagina}
              onChange={setPagina}
              showControls
              size="sm"
              className="dark:text-zinc-100"
            />
          </div>
          {/* Modal de edição */}
          <ClienteModal
            open={modalAberto}
            onClose={handleFecharModal}
            onSuccess={handleSucessoEdicao}
            cliente={clienteEditando}
          />
        </>
      )}
    </div>
  );
} 
