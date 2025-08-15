"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Button, Input, Checkbox, Card, Select } from "@/components/ui/chakra-adapters";
import Link from "next/link";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: "barbershop_owner" | "professional" | "client";
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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "barbershop_owner",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Nome é obrigatório";
    if (!formData.lastName.trim()) newErrors.lastName = "Sobrenome é obrigatório";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = "Email é obrigatório";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Email inválido";
    if (formData.phone) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(formData.phone)) newErrors.phone = "Telefone deve estar no formato (11) 99999-9999";
    }
    if (!formData.password) newErrors.password = "Senha é obrigatória";
    else if (formData.password.length < 6) newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Senhas não coincidem";
    if (!formData.acceptTerms) newErrors.acceptTerms = "Você deve aceitar os termos de uso";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      const match = numbers.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        const formatted = `${match[1] ? `(${match[1]}` : ""}${match[1] && match[1].length === 2 ? ") " : ""}${match[2]}${match[3] ? `-${match[3]}` : ""}`;
        return formatted;
      }
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    handleInputChange("phone", formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setIsLoading(true);
    const result = await signUp(formData.email, formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      phone: formData.phone || undefined,
    });
    if (result.success) router.push("/auth/sign-up-success");
    else setError(result.error || "Erro ao criar conta");
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-barbershop-light to-white dark:from-barbershop-dark dark:to-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-barbershop-primary to-barbershop-secondary rounded-xl text-white text-2xl shadow-lg">
              ✂️
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Crie sua conta</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Comece a gerenciar sua barbearia hoje mesmo</p>
        </div>

        <Card.Root className="shadow-xl border-0">
          <Card.Header className="pb-0">
            <h3 className="text-lg font-semibold text-center">Cadastro de Usuário</h3>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", (e.target as HTMLInputElement).value)}
                    isInvalid={!!errors.firstName}
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sobrenome *</label>
                  <Input
                    type="text"
                    placeholder="Seu sobrenome"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", (e.target as HTMLInputElement).value)}
                    isInvalid={!!errors.lastName}
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", (e.target as HTMLInputElement).value)}
                  isInvalid={!!errors.email}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  isInvalid={!!errors.phone}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de conta *</label>
                <Select.Root value={formData.role} onValueChange={(e: any) => handleInputChange("role", e.value)}>
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="barbershop_owner">Proprietário de Barbearia</Select.Item>
                    <Select.Item value="professional">Profissional</Select.Item>
                    <Select.Item value="client">Cliente</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Senha *</label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", (e.target as HTMLInputElement).value)}
                    isInvalid={!!errors.password}
                  />
                  <Button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </Button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirmar Senha *</label>
                <div className="flex gap-2">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", (e.target as HTMLInputElement).value)}
                    isInvalid={!!errors.confirmPassword}
                  />
                  <Button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-start">
                <Checkbox
                  isChecked={formData.acceptTerms}
                  onChange={(e: any) => handleInputChange("acceptTerms", !!e.target.checked)}
                  size="sm"
                >
                  <span className="text-sm">
                    Eu aceito os{" "}
                    <Link href="/terms" className="text-primary hover:text-primary-600 transition-colors">
                      termos de uso
                    </Link>{" "}
                    e{" "}
                    <Link href="/privacy" className="text-primary hover:text-primary-600 transition-colors">
                      política de privacidade
                    </Link>
                  </span>
                </Checkbox>
              </div>
              {errors.acceptTerms && <p className="text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>}

              <Button type="submit" colorScheme="blue" className="w-full h-12 font-medium" loading={isLoading}>
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Já tem uma conta?{" "}
                  <Link href="/auth/login" className="font-medium text-primary hover:text-primary-600 transition-colors">
                    Faça login
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

export default RegisterForm;
