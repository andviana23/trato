"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button, Input } from "@chakra-ui/react";
import { Card } from "@/components/ui/chakra-adapters";
import Link from "next/link";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (!email) {
      setError("Por favor, insira seu email.");
      setIsLoading(false);
      return;
    }
    const result = await resetPassword(email);
    setSuccess(!!result.success);
    if (!result.success) setError(result.error || "Erro ao enviar email de recuperação");
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold">Email enviado!</h2>
          <Card.Root>
            <Card.Body>
              <p className="mb-4">
                Enviamos um link de recuperação para <strong>{email}</strong>.
              </p>
              <Link href="/auth/login" className="text-blue-600 underline">
                Voltar para o login
              </Link>
            </Card.Body>
          </Card.Root>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card.Root>
          <Card.Header>
            <h3 className="text-lg font-semibold text-center">Recuperação de Senha</h3>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-red-600 text-sm">{error}</div>}

              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" colorScheme="blue" loading={isLoading} w="100%">
                Enviar link de recuperação
              </Button>

              <div className="text-center text-sm">
                <span>Já lembra da senha? </span>
                <Link href="/auth/login" className="text-blue-600 underline">
                  Faça login
                </Link>
              </div>
            </form>
          </Card.Body>
        </Card.Root>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
