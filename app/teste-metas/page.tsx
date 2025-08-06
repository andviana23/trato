"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TesteMetas() {
  const [teste, setTeste] = useState("Teste funcionando!");

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste das Metas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{teste}</p>
          <Button onClick={() => setTeste("Botão clicado!")}>
            Testar Botão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 