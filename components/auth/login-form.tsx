"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Button, Input, Checkbox, Card, CardBody, CardHeader } from "@heroui/react";
import Link from 'next/link';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, user, testSupabaseConnection } = useAuth();
  const router = useRouter();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    const result = await signIn(email, password);

    if (result.success) {
      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } else {
      setError(result.error || 'Erro ao fazer login');
      setIsLoading(false);
    }
  };

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
            Entre na sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gerencie sua barbearia de forma profissional
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-0">
            <h3 className="text-lg font-semibold text-center">Acesso ao Sistema</h3>
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

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Senha"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="bordered"
                color="primary"
                isRequired
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                }
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-12"
                }}
              />

              <div className="flex items-center justify-between">
                <Checkbox
                  isSelected={rememberMe}
                  onValueChange={setRememberMe}
                  color="primary"
                  size="sm"
                >
                  Lembrar de mim
                </Checkbox>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                color="primary"
                className="w-full h-12 font-medium"
                isLoading={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              {/* Botão de debug de conectividade */}
              <Button
                type="button"
                color="secondary"
                variant="flat"
                className="w-full h-10 font-medium"
                onClick={testSupabaseConnection}
              >
                Testar Conectividade Supabase
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <Link
                    href="/auth/register"
                    className="font-medium text-primary hover:text-primary-600 transition-colors"
                  >
                    Cadastre-se grátis
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

export default LoginForm; 