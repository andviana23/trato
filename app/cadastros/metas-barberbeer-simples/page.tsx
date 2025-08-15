"use client";

import { useState } from "react";
import { Button, Card } from "@chakra-ui/react";

export default function MetasBarberBeerSimples() {
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      // Simular uma operação
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Teste executado com sucesso!");
    } catch (error) {
      console.error("Erro no teste:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card.Root>
        <Card.Header>
          <Card.Title>Metas BarberBeer - Versão Simplificada</Card.Title>
        </Card.Header>
        <Card.Body>
          <p>Esta é uma versão de teste para verificar se há problemas na implementação.</p>
          <Button mt={4} onClick={handleTest} loading={loading}>
            {loading ? "Testando..." : "Testar Funcionalidade"}
          </Button>
        </Card.Body>
      </Card.Root>
    </div>
  );
} 