"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";
import { CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Por favor, insira seu email.');
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Erro ao enviar email de recuperação');
    }

    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-barbershop-light to-white dark:from-barbershop-dark dark:to-gray-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-barbershop-primary to-barbershop-secondary rounded-xl text-white text-2xl shadow-lg">
                ✂️
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email enviado!
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Verifique sua caixa de entrada
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardBody>
              <div className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Verifique seu email
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enviamos um link de recuperação para <strong>{email}</strong>. 
                  Clique no link para redefinir sua senha.
                </p>
                <div className="pt-4">
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                  >
                    Voltar para o login
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-barbershop-light to-white dark:from-barbershop-dark dark:to-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-barbershop-primary to-barbershop-secondary rounded-xl text-white text-2xl shadow-lg">
              ✂️
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recuperar senha
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Digite seu email para receber um link de recuperação
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-0">
            <h3 className="text-lg font-semibold text-center">Recuperação de Senha</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Input
                type="email"
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="bordered"
                color="primary"
                isRequired
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-12"
                }}
              />

              <Button
                type="submit"
                color="primary"
                className="w-full h-12 font-medium"
                isLoading={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lembrou sua senha?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary hover:text-primary-600 transition-colors"
                  >
                    Faça login
                  </Link>
                </p>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordForm; 