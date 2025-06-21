"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button, Input, Card, CardBody } from '@nextui-org/react';
import { toast } from 'sonner';

function LoginForm() {
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        const redirectTo = searchParams.get('redirectTo') || '/dashboard';
        window.location.href = redirectTo;
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="Digite seu email"
        value={formData.email}
        onChange={handleChange}
        required
        disabled={isSubmitting}
      />
      <Input
        name="password"
        type={isVisible ? "text" : "password"}
        label="Senha"
        placeholder="Digite sua senha"
        value={formData.password}
        onChange={handleChange}
        required
        disabled={isSubmitting}
        endContent={
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="focus:outline-none"
          >
            <span role="img" aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}>
              {isVisible ? '🙈' : '👁️'}
            </span>
          </button>
        }
      />
      <Button 
        type="submit" 
        color="primary" 
        className="w-full"
        isLoading={isSubmitting}
      >
        Entrar
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <img
              src="/img/logo-trato-barbados.png"
              alt="Logo"
              className="mx-auto h-12 mb-4"
            />
            <h2 className="text-2xl font-bold">Bem-vindo de volta!</h2>
            <p className="text-gray-600">Faça login para continuar</p>
          </div>
          <Suspense fallback={<div>Carregando...</div>}>
            <LoginForm />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
}
