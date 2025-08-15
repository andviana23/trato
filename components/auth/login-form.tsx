"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Button, Input } from "@chakra-ui/react";
import { Checkbox, Card } from "@/components/ui/chakra-adapters";
import Link from 'next/link';
import { toast } from 'sonner';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, user, loading } = useAuth();
  const router = useRouter();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        toast.success('Login realizado com sucesso!');
        router.replace('/dashboard');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro inesperado ao fazer login');
      console.error('Erro no login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-barbershop-light to-white dark:from-barbershop-dark dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
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
            Entre na sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gerencie sua barbearia de forma profissional
          </p>
        </div>

        <Card.Root>
          <Card.Header className="pb-0">
            <h3 className="text-lg font-semibold text-center">Acesso ao Sistema</h3>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Senha</label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Checkbox checked={rememberMe} onChange={(e: any) => setRememberMe(!!e.target?.checked)} size="sm">
                  Lembrar de mim
                </Checkbox>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" colorScheme="blue" className="w-full h-12 font-medium" loading={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <Link
                    href="/auth/sign-up"
                    className="font-medium text-primary hover:text-primary-600 transition-colors"
                  >
                    Cadastre-se grátis
                  </Link>
                </p>
              </div>
            </form>
          </Card.Body>
        </Card.Root>
      </div>
    </div>
  );
};

export default LoginForm; 

