"use client";
import { useState } from "react";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, Button } from "@nextui-org/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import LayoutCadastros from "../../../components/LayoutCadastros";

export default function PaginaProdutos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  return (
    <LayoutCadastros titulo="Produtos">
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Estoque de Produtos</h2>
              <p className="text-gray-600 text-sm">Controle o estoque e vendas de produtos</p>
            </div>
            <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />}>Novo Produto</Button>
          </div>
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardBody className="text-center"><h3 className="text-2xl font-bold text-blue-600">24</h3><p className="text-sm text-gray-600">Total de Produtos</p></CardBody></Card>
        <Card><CardBody className="text-center"><h3 className="text-2xl font-bold text-green-600">18</h3><p className="text-sm text-gray-600">Em Estoque</p></CardBody></Card>
        <Card><CardBody className="text-center"><h3 className="text-2xl font-bold text-orange-600">6</h3><p className="text-sm text-gray-600">Estoque Baixo</p></CardBody></Card>
        <Card><CardBody className="text-center"><h3 className="text-2xl font-bold text-red-600">2</h3><p className="text-sm text-gray-600">Sem Estoque</p></CardBody></Card>
      </div>
      <Card>
        <CardBody>
          <Table aria-label="Tabela de produtos">
            <TableHeader>
              <TableColumn>PRODUTO</TableColumn>
              <TableColumn>CATEGORIA</TableColumn>
              <TableColumn>PREÇO</TableColumn>
              <TableColumn>ESTOQUE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Nenhum produto cadastrado">
              {/* Dados dos produtos */}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </LayoutCadastros>
  );
} 
