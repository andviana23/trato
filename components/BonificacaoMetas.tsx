"use client";

import { useState, useEffect } from "react";
import { Card, Badge } from "@chakra-ui/react";
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
      <Card.Root>
        <Card.Body>
          <div>Carregando...</div>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <span>{barbeiroNome}</span>
          {metaBatida && (
            <Badge colorPalette="green" variant="subtle">Meta Batida</Badge>
          )}
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <div>
          <div>
            <p>Comissão Base</p>
            <p>{formatarMoeda(comissaoBase)}</p>
          </div>
          
          {bonificacao > 0 ? (
            <div>
              <p>Bonificação Meta</p>
              <p>+{formatarMoeda(bonificacao)}</p>
            </div>
          ) : (
            <div>
              <p>Bonificação Meta</p>
              <p>Não aplicada</p>
            </div>
          )}
          
          <div>
            <p>Total</p>
            <p>{formatarMoeda(comissaoTotal)}</p>
          </div>
        </div>
      </Card.Body>
    </Card.Root>
  );
} 