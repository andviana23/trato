"use client";

import { useState } from "react";
import { Button, Card } from "@chakra-ui/react";

export default function TesteMetas() {
  const [teste, setTeste] = useState("Teste funcionando!");

  return (
    <div>
      <Card.Root>
        <Card.Header>
          <Card.Title>Teste das Metas</Card.Title>
        </Card.Header>
        <Card.Body>
          <p>{teste}</p>
          <Button mt={4} onClick={() => setTeste("Botão clicado!")}>Testar Botão</Button>
        </Card.Body>
      </Card.Root>
    </div>
  );
} 