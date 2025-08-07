"use client";

import React, { useState } from "react";
import { useAuth } from '@/lib/contexts/AuthContext';
import Image from 'next/image';
import { LockClosedIcon } from '@heroicons/react/24/solid';

// =================== FORMULÁRIO DE LOGIN ===================
function LoginForm() {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        window.location.href = '/dashboard';
      } else if (result.error) {
        setError(result.error);
      }
    } catch {
      setError('Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">E-mail ou Telefone</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="E-mail ou Telefone"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Sua senha</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={isVisible ? 'text' : 'password'}
            placeholder="Sua senha"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white pr-10 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500 hover:text-white"
            tabIndex={-1}
            aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <LockClosedIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
      <button
        type="submit"
        className="w-full py-2 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
      <div className="flex justify-between text-sm text-gray-300">
        <a href="/auth/forgot-password" className="hover:underline">Esqueci minha senha</a>
        <a href="/auth/sign-up" className="hover:underline">Não possui uma conta? Faça seu cadastro</a>
      </div>
    </form>
  );
}

// =================== PÁGINA DE LOGIN ===================
export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundImage: 'url(/path/to/background.jpg)', backgroundSize: 'cover' }}>
      <div className="bg-gray-800 bg-opacity-75 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <Image src="/path/to/logo.png" alt="Logo" width={150} height={50} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Acesse sua conta</h2>
          <p className="text-gray-300">Gerencie sua barbearia de forma fácil e rápida</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
