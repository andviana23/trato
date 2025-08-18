'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonAvatar } from '@/components/ui/skeleton';
import { EmptyState, EmptyStateNoData, EmptyStateNoResults } from '@/components/ui/empty-state';
import { useModalActions } from '@/components/ui/modal';
import { Search, Plus, Trash2, AlertTriangle } from 'lucide-react';

export default function DesignSystemDemo() {
  const { showModal, showConfirmModal, showAlertModal } = useModalActions();

  const handleShowModal = () => {
    showModal({
      title: 'Modal de Exemplo',
      content: (
        <div className="space-y-4">
          <p>Este é um exemplo de modal usando o sistema de design.</p>
          <p>O modal é controlado pela store Zustand e pode ser facilmente customizado.</p>
        </div>
      ),
      size: 'lg',
    });
  };

  const handleShowConfirmModal = () => {
    showConfirmModal({
      title: 'Confirmar Ação',
      content: (
        <p>Tem certeza que deseja executar esta ação? Esta operação não pode ser desfeita.</p>
      ),
      onConfirm: () => {
        console.log('Ação confirmada!');
      },
      variant: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });
  };

  const handleShowAlertModal = () => {
    showAlertModal({
      title: 'Operação Concluída',
      content: (
        <p>A operação foi executada com sucesso! Os dados foram salvos no sistema.</p>
      ),
      variant: 'success',
      onClose: () => {
        console.log('Modal fechado');
      },
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Design System Demo
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Demonstração dos componentes base e sistema de design
          </p>
        </div>

        {/* Skeleton Loaders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Skeleton Loaders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Skeleton Básico
                </h3>
                <div className="space-y-3">
                  <Skeleton height={20} width="100%" />
                  <Skeleton height={20} width="80%" />
                  <Skeleton height={20} width="60%" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Skeleton Avatar
                </h3>
                <div className="flex items-center gap-3">
                  <SkeletonAvatar size="sm" />
                  <SkeletonAvatar size="md" />
                  <SkeletonAvatar size="lg" />
                  <SkeletonAvatar size="xl" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Skeleton Card
              </h3>
              <SkeletonCard showImage={false} lines={2} />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Skeleton Table
              </h3>
              <SkeletonTable rows={3} columns={4} />
            </div>
          </CardContent>
        </Card>

        {/* Empty States */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Empty States
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EmptyStateNoData
                action={
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Item
                  </Button>
                }
              />
              
              <EmptyStateNoResults
                searchTerm="exemplo"
                action={
                  <Button variant="outline" size="sm">
                    Limpar Filtros
                  </Button>
                }
              />
              
              <EmptyState
                icon={AlertTriangle}
                title="Nenhuma Conexão"
                description="Verifique sua conexão com a internet e tente novamente."
                action={
                  <Button size="sm">
                    Tentar Novamente
                  </Button>
                }
                variant="card"
              />
            </div>
          </CardContent>
        </Card>

        {/* Modal System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              Sistema de Modais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleShowModal}>
                Modal Simples
              </Button>
              
              <Button onClick={handleShowConfirmModal} variant="destructive">
                Modal de Confirmação
              </Button>
              
              <Button onClick={handleShowAlertModal} variant="outline">
                Modal de Alerta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Sistema de Cores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['primary', 'success', 'warning', 'error'].map((color) => (
                <div key={color} className="space-y-2">
                  <h3 className="text-sm font-medium capitalize">{color}</h3>
                  <div className="space-y-1">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                      <div
                        key={shade}
                        className={`h-8 rounded border border-neutral-200 dark:border-neutral-700 bg-${color}-${shade}`}
                        title={`${color}-${shade}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              Tipografia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1 - Título Principal</h1>
            <h2 className="text-3xl font-semibold">Heading 2 - Subtítulo</h2>
            <h3 className="text-2xl font-medium">Heading 3 - Seção</h3>
            <h4 className="text-xl font-medium">Heading 4 - Subseção</h4>
            <h5 className="text-lg font-medium">Heading 5 - Item</h5>
            <h6 className="text-base font-medium">Heading 6 - Subitem</h6>
            
            <div className="space-y-2">
              <p className="text-base">Texto base - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Texto pequeno - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Texto muito pequeno - Ut enim ad minim veniam, quis nostrud exercitation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Spacing System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              Sistema de Espaçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 6, 8, 12, 16].map((spacing) => (
                <div key={spacing} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-mono text-neutral-500">
                    {spacing}
                  </div>
                  <div 
                    className="bg-blue-500 rounded"
                    style={{ 
                      width: `${spacing * 0.25}rem`, 
                      height: '1rem' 
                    }}
                  />
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {spacing * 0.25}rem ({spacing * 4}px)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
