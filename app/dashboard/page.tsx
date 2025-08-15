"use client";

import { useAuth, useRequireAuth } from "@/lib/contexts/AuthContext";
import { useMemo } from "react";
// Remove Chakra UI e usa Tailwind
import { UserIcon, BuildingOfficeIcon, CalendarIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

export default function DashboardPage() {
  useRequireAuth();
  const { user, profile, loading } = useAuth();

  const dataCadastro = useMemo(() => (user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : ""), [user?.created_at]);
  const ultimoAcesso = useMemo(
    () => (user?.last_sign_in_at || user?.created_at ? new Date(user.last_sign_in_at || user.created_at!).toLocaleDateString("pt-BR") : ""),
    [user?.last_sign_in_at, user?.created_at]
  );

  if (loading || !user) return <div className="p-8">Carregando…</div>;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "barbershop_owner":
        return "Proprietário";
      case "professional":
        return "Profissional";
      case "client":
        return "Cliente";
      case "admin":
        return "Administrador";
      case "recepcionista":
        return "Recepcionista";
      default:
        return role;
    }
  };

  const Stat = ({ icon, label, value, bg }: { icon: JSX.Element; label: string; value: string | number; bg: string }) => (
    <div className={`rounded-lg shadow-md p-6 text-white`} style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <div className="text-sm opacity-90">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Bem-vindo, {profile?.name || "Usuário"}!</h1>
        <p className="text-muted-foreground">Gerencie sua barbearia de forma eficiente e profissional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat icon={<UserIcon className="h-8 w-8" />} label="Clientes Hoje" value={12} bg="#2563eb" />
        <Stat icon={<CalendarIcon className="h-8 w-8" />} label="Agendamentos" value={8} bg="#16a34a" />
        <Stat icon={<BuildingOfficeIcon className="h-8 w-8" />} label="Profissionais" value={3} bg="#7c3aed" />
        <Stat icon={<CurrencyDollarIcon className="h-8 w-8" />} label="Receita Hoje" value="R$ 450" bg="#ea580c" />
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Informações do Usuário</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div>{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Nome</div>
              <div>{profile?.name || "Não informado"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Telefone</div>
              <div>{profile?.phone || "Não informado"}</div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Função</div>
              <div>{getRoleLabel(profile?.role || "client")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Data de Cadastro</div>
              <div>{dataCadastro}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Último Acesso</div>
              <div>{ultimoAcesso}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
