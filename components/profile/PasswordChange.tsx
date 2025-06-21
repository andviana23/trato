import React, { useState } from "react";
import { Input, Button } from "@nextui-org/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z.string().min(8, "Mínimo 8 caracteres").regex(/[A-Z]/, "1 maiúscula").regex(/[0-9]/, "1 número"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordChangeProps {
  user: any;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Simular API
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 2000);
    }, 1500);
  };

  return (
    <form className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="font-semibold text-sm mb-1">Alterar Senha</div>
      <Controller
        name="currentPassword"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Senha atual"
            type="password"
            isInvalid={!!errors.currentPassword}
            errorMessage={errors.currentPassword?.message}
          />
        )}
      />
      <Controller
        name="newPassword"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Nova senha"
            type="password"
            isInvalid={!!errors.newPassword}
            errorMessage={errors.newPassword?.message}
          />
        )}
      />
      <Controller
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Confirmar nova senha"
            type="password"
            isInvalid={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword?.message}
          />
        )}
      />
      {error && <div className="text-red-500 text-xs">{error}</div>}
      {success && <div className="text-green-600 text-xs">Senha alterada com sucesso!</div>}
      <Button type="submit" color="primary" isLoading={loading} disabled={loading} className="mt-2 w-full">
        Alterar Senha
      </Button>
    </form>
  );
};

export default PasswordChange; 
