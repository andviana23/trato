"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { calcularBonificacao, formatarMoeda } from "@/utils/metasUtils";

type BonificacaoMetasProps = {
  barbeiroId: string;
  barbeiroNome: string;
  mes: string;
  ano: string;
  unidade: 'barberbeer' | 'trato';
  comissaoBase: number;
};

export default function BonificacaoMetas({ 
  barbeiroId, 
  barbeiroNome, 
  mes, 
  ano, 
  unidade, 
  comissaoBase 
}: BonificacaoMetasProps) {
  const [bonificacao, setBonificacao] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [metaBatida, setMetaBatida] = useState(false);

  useEffect(() => {
    async function carregarBonificacao() {
      setLoading(true);
      try {
        const valorBonificacao = await calcularBonificacao(barbeiroId, mes, ano, unidade);
        setBonificacao(valorBonificacao);
        setMetaBatida(valorBonificacao > 0);
      } catch (error) {
        console.error('Erro ao carregar bonificação:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarBonificacao();
  }, [barbeiroId, mes, ano, unidade]);

  const comissaoTotal = comissaoBase + bonificacao;

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{barbeiroNome}</span>
          {metaBatida && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Meta Batida
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Comissão Base</p>
            <p className="text-lg font-semibold">{formatarMoeda(comissaoBase)}</p>
          </div>
          
          {bonificacao > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-1">Bonificação Meta</p>
              <p className="text-lg font-semibold text-green-600">
                +{formatarMoeda(bonificacao)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-1">Bonificação Meta</p>
              <p className="text-lg font-semibold text-gray-400">
                <XCircleIcon className="w-4 h-4 inline mr-1" />
                Não aplicada
              </p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-xl font-bold text-blue-600">
              {formatarMoeda(comissaoTotal)}
            </p>
          </div>
        </div>
        
        {bonificacao > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              <CheckCircleIcon className="w-4 h-4 inline mr-1" />
              Bonificação aplicada automaticamente por atingir a meta do mês!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 