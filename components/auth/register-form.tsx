"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Button, Input, Checkbox, Card, CardBody, CardHeader, Select, SelectItem } from "@nextui-org/react";
import Link from 'next/link';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'barbershop_owner' | 'professional' | 'client';
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

const RegisterForm = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'barbershop_owner',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nome
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }

    // Sobrenome
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Telefone (opcional, mas se preenchido deve ser válido)
    if (formData.phone) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Telefone deve estar no formato (11) 99999-9999';
      }
    }

    // Senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Confirmar senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    // Termos
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo ao digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 11) {
      const match = numbers.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        const formatted = `${match[1] ? `(${match[1]}` : ''}${match[1] && match[1].length === 2 ? ') ' : ''}${match[2]}${match[3] ? `-${match[3]}` : ''}`;
        return formatted;
      }
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    handleInputChange('phone', formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const result = await signUp(formData.email, formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      phone: formData.phone || undefined,
    });

    if (result.success) {
      router.push('/auth/sign-up-success');
    } else {
      setError(result.error || 'Erro ao criar conta');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-barbershop-light to-white dark:from-barbershop-dark dark:to-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-barbershop-primary to-barbershop-secondary rounded-xl text-white text-2xl shadow-lg">
              ✂️
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Comece a gerenciar sua barbearia hoje mesmo
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-0">
            <h3 className="text-lg font-semibold text-center">Cadastro de Usuário</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  type="text"
                  label="Nome *"
                  placeholder="Seu nome"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  variant="bordered"
                  color="primary"
                  isRequired
                  isInvalid={!!errors.firstName}
                  errorMessage={errors.firstName}
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-12"
                  }}
                />

                <Input
                  type="text"
                  label="Sobrenome *"
                  placeholder="Seu sobrenome"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  variant="bordered"
                  color="primary"
                  isRequired
                  isInvalid={!!errors.lastName}
                  errorMessage={errors.lastName}
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-12"
                  }}
                />
              </div>

              <Input
                type="email"
                label="Email *"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                variant="bordered"
                color="primary"
                isRequired
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-12"
                }}
              />

              <Input
                type="tel"
                label="Telefone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={handlePhoneChange}
                variant="bordered"
                color="primary"
                isInvalid={!!errors.phone}
                errorMessage={errors.phone}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-12"
                }}
              />

              <Select
                label="Tipo de conta *"
                placeholder="Selecione o tipo de conta"
                selectedKeys={[formData.role]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange('role', selectedKey as 'barbershop_owner' | 'professional' | 'client');
                }}
                variant="bordered"
                color="primary"
                classNames={{
                  trigger: "h-12"
                }}
              >
                <SelectItem key="barbershop_owner">
                  Proprietário de Barbearia
                </SelectItem>
                <SelectItem key="professional">
                  Profissional
                </SelectItem>
                <SelectItem key="client">
                  Cliente
                </SelectItem>
              </Select>

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Senha *"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                variant="bordered"
                color="primary"
                isRequired
                isInvalid={!!errors.password}
                errorMessage={errors.password}
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

              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirmar Senha *"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                variant="bordered"
                color="primary"
                isRequired
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                  >
                    {showConfirmPassword ? (
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

              <div className="flex items-start">
                <Checkbox
                  isSelected={formData.acceptTerms}
                  onValueChange={(checked) => handleInputChange('acceptTerms', checked)}
                  color="primary"
                  size="sm"
                >
                  <span className="text-sm">
                    Eu aceito os{' '}
                    <Link href="/terms" className="text-primary hover:text-primary-600 transition-colors">
                      termos de uso
                    </Link>{' '}
                    e{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary-600 transition-colors">
                      política de privacidade
                    </Link>
                  </span>
                </Checkbox>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
              )}

              <Button
                type="submit"
                color="primary"
                className="w-full h-12 font-medium"
                isLoading={isLoading}
              >
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Já tem uma conta?{' '}
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

export default RegisterForm; 
