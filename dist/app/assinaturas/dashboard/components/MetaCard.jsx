"use client";
import { useState } from 'react';
import { Card, CardBody, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { PencilIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
export default function MetaCard({ data, loading, onUpdate }) {
    var _a, _b;
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [goalAmount, setGoalAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };
    const handleSave = async () => {
        try {
            setIsSaving(true);
            const response = await fetch('/api/dashboard/metas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    goalAmount: parseFloat(goalAmount),
                    description
                })
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Erro ao salvar meta');
            }
            toast.success('Meta salva com sucesso!');
            onOpenChange(false);
            onUpdate === null || onUpdate === void 0 ? void 0 : onUpdate();
        }
        catch (error) {
            console.error('Erro ao salvar meta:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar meta');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja remover a meta deste mês?'))
            return;
        try {
            setIsSaving(true);
            const response = await fetch(`/api/dashboard/metas?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Erro ao remover meta');
            }
            toast.success('Meta removida com sucesso!');
            onOpenChange(false);
            onUpdate === null || onUpdate === void 0 ? void 0 : onUpdate();
        }
        catch (error) {
            console.error('Erro ao remover meta:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao remover meta');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (<>
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium">Meta Mensal</p>
              <p className="text-3xl font-bold">
                {loading ? '...' : formatCurrency(((_a = data === null || data === void 0 ? void 0 : data.goal) === null || _a === void 0 ? void 0 : _a.amount) || 0)}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                {((_b = data === null || data === void 0 ? void 0 : data.goal) === null || _b === void 0 ? void 0 : _b.description) || 'Nenhuma meta definida'}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-blue-400 p-3 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6"/>
              </div>
              <Button size="sm" variant="light" className="text-white" startContent={<PencilIcon className="w-4 h-4"/>} onPress={onOpen}>
                Editar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (<>
              <ModalHeader className="flex flex-col gap-1">
                Definir Meta Mensal
              </ModalHeader>
              <ModalBody>
                <Input label="Valor da Meta" placeholder="50000.00" type="number" step="0.01" value={goalAmount} onValueChange={setGoalAmount} startContent={<div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">R$</span>
                    </div>}/>
                <Input label="Descrição (opcional)" placeholder="Meta Janeiro 2025" value={description} onValueChange={setDescription}/>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={handleDelete} isLoading={isSaving}>
                  Remover Meta
                </Button>
                <Button color="primary" onPress={handleSave} isLoading={isSaving}>
                  Salvar Meta
                </Button>
              </ModalFooter>
            </>)}
        </ModalContent>
      </Modal>
    </>);
}
