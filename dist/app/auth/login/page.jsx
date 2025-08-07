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
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            const result = await signIn(formData.email, formData.password);
            if (result.success) {
                const redirectTo = searchParams.get('redirectTo') || '/dashboard';
                window.location.href = redirectTo;
            }
            else if (result.error) {
                toast.error(result.error);
            }
        }
        catch (error) {
            toast.error('Erro ao fazer login');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input id="email" name="email" type="email" placeholder="Digite seu email" value={formData.email} onChange={handleChange} required disabled={isSubmitting} className="focus:ring-2 focus:ring-orange-400 bg-gray-50" autoFocus/>
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <Input id="password" name="password" type={isVisible ? "text" : "password"} placeholder="Digite sua senha" value={formData.password} onChange={handleChange} required disabled={isSubmitting} className="focus:ring-2 focus:ring-orange-400 bg-gray-50" endContent={<button type="button" onClick={() => setIsVisible(!isVisible)} className="focus:outline-none text-gray-500 hover:text-orange-500 transition" tabIndex={-1} aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}>
              {isVisible ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>)}
            </button>}/>
      </div>
      <div className="flex items-center justify-between">
        <a href="/auth/forgot-password" className="text-sm text-orange-600 hover:underline font-medium">Esqueci minha senha</a>
      </div>
      <Button type="submit" color="primary" className="w-full py-3 text-base font-bold rounded-xl shadow-md bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 transition" isLoading={isSubmitting}>
        Entrar
      </Button>
    </form>);
}
export default function LoginPage() {
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 px-2 animate-fade-in">
      <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-gray-100">
        <CardBody className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Bem-vindo de volta!</h1>
            <p className="text-gray-500 text-base md:text-lg">Acesse sua conta para continuar</p>
          </div>
          <Suspense fallback={<div>Carregando...</div>}>
            <LoginForm />
          </Suspense>
        </CardBody>
      </Card>
    </div>);
}
