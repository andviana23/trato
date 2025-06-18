"use client";

import React, { useState } from "react";
import { Button, Input, Checkbox, Link as HeroLink, Form } from "@heroui/react";
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import NextLink from 'next/link';

export default function LoginPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!loading && user) {
      const redirectTo = searchParams.get('redirectTo') || '/dashboard';
      router.replace(redirectTo);
    }
  }, [user, loading, router, searchParams]);

  const toggleVisibility = () => setIsVisible((v) => !v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { success, error } = await signIn(formData.email, formData.password);
      if (success) {
        const redirectTo = searchParams.get('redirectTo') || '/dashboard';
        router.replace(redirectTo);
      } else if (error) {
        alert(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5f6fa 0%, #b3c6e6 100%)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f5f6fa 0%, #b3c6e6 100%)' }}>
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl" style={{ background: '#F9FAFB' }}>
        <div className="flex flex-col items-center gap-2 mb-2 pt-8 px-8">
          <img src="/img/logo-trato-barbados.png" alt="Logo Trato de Barbados" className="h-32 w-auto mb-2 drop-shadow-lg" style={{ objectFit: 'contain' }} />
          <h1 className="text-2xl font-bold text-center" style={{ color: '#365E78' }}>Trato de Barbados</h1>
          <p className="text-small text-[#0a1733] text-center">Bem-vindo! Faça login para acessar o sistema.</p>
        </div>
        <Form className="flex flex-col gap-3 px-8" validationBehavior="native" onSubmit={handleSubmit}>
          <Input
            isRequired
            label="Email"
            name="email"
            placeholder="Digite seu email"
            type="email"
            variant="bordered"
            value={formData.email}
            onChange={handleChange}
            autoComplete="username"
            disabled={isSubmitting}
            className="bg-[#f4f6fa] text-[#040714] border-[#e0e6f0] focus:border-[#0064D7]"
          />
          <Input
            isRequired
            endContent={
              <button type="button" onClick={toggleVisibility} tabIndex={-1} aria-label="Mostrar senha">
                {isVisible ? (
                  <span role="img" aria-label="Ocultar senha">🙈</span>
                ) : (
                  <span role="img" aria-label="Mostrar senha">👁️</span>
                )}
              </button>
            }
            label="Senha"
            name="password"
            placeholder="Digite sua senha"
            type={isVisible ? "text" : "password"}
            variant="bordered"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            disabled={isSubmitting}
            className="bg-[#f4f6fa] text-[#040714] border-[#e0e6f0] focus:border-[#0064D7]"
          />
          <div className="flex w-full items-center justify-between px-1 py-2">
            <Checkbox name="remember" size="sm" color="primary" className="text-[#040714]">
              Lembrar de mim
            </Checkbox>
            <HeroLink as={NextLink} href="/auth/forgot-password" className="text-[#0064D7] hover:underline" size="sm">
              Esqueceu a senha?
            </HeroLink>
          </div>
          <Button
            className="w-full text-lg font-semibold py-3 rounded-xl bg-[#0064D7] hover:bg-[#0051ad] transition text-white shadow-md"
            color="primary"
            type="submit"
            isLoading={isSubmitting}
            style={{ background: '#0064D7', color: '#fff', border: 'none' }}
          >
            Entrar
          </Button>
        </Form>
        <p className="text-center text-small mt-2 text-[#0a1733] px-8">
          Precisa criar uma conta?{' '}
          <HeroLink as={NextLink} href="/auth/register" size="sm" className="text-[#0064D7] hover:underline font-medium">
            Criar conta
          </HeroLink>
        </p>
        <div className="text-xs text-center text-[#0a1733] mt-4 opacity-70 pb-6">
          &copy; {new Date().getFullYear()} Trato de Barbados. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
