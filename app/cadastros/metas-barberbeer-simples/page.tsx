"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Metas BarberBeer - Versão Simplificada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Esta é uma versão de teste para verificar se há problemas na implementação.</p>
          <Button onClick={handleTest} disabled={loading}>
            {loading ? "Testando..." : "Testar Funcionalidade"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 