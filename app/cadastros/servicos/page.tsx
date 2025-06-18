"use client";
import { useState } from "react";
import { Card, CardBody, CardHeader, Chip, Avatar, Button } from "@heroui/react";
import { PlusIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import LayoutCadastros from "../../../components/LayoutCadastros";

export default function PaginaServicos() {
  const [servicos, setServicos] = useState<any[]>([]);
  return (
    <LayoutCadastros titulo="Serviços">
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Catálogo de Serviços</h2>
              <p className="text-gray-600 text-sm">Gerencie os serviços oferecidos pela barbearia</p>
            </div>
            <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />}>Novo Serviço</Button>
          </div>
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map((servico: any) => (
          <Card key={servico.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 w-full">
                <Avatar icon={<WrenchScrewdriverIcon className="w-4 h-4" />} classNames={{ base: "bg-blue-100", icon: "text-blue-600" }} />
                <div className="flex-1">
                  <h3 className="font-semibold">{servico.nome}</h3>
                  <p className="text-small text-gray-600">{servico.categoria}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3">
                <p className="text-sm text-gray-700">{servico.descricao}</p>
                <div className="flex items-center justify-between">
                  <Chip color="success" variant="flat">R$ {servico.preco}</Chip>
                  <span className="text-xs text-gray-500">{servico.duracao} min</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="flat">Editar</Button>
                  <Button size="sm" color="danger" variant="flat">Excluir</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </LayoutCadastros>
  );
} 