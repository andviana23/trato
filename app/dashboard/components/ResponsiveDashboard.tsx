"use client";

import { useAuth, useRequireAuth } from "@/lib/contexts/AuthContext";
import { useMemo } from "react";
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ResponsiveDashboard() {
  useRequireAuth();
  const { user, profile, loading } = useAuth();

  const dataCadastro = useMemo(() => (
    user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : ""
  ), [user?.created_at]);
  
  const ultimoAcesso = useMemo(
    () => (user?.last_sign_in_at || user?.created_at ? 
      new Date(user.last_sign_in_at || user.created_at!).toLocaleDateString("pt-BR") : ""),
    [user?.last_sign_in_at, user?.created_at]
  );

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "barbershop_owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "professional":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "recepcionista":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const StatCard = ({ 
    icon, 
    label, 
    value, 
    change, 
    changeType = "neutral",
    onClick 
  }: { 
    icon: JSX.Element; 
    label: string; 
    value: string | number; 
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    onClick?: () => void;
  }) => (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="h-8 w-8 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ 
    title, 
    description, 
    action, 
    icon 
  }: { 
    title: string; 
    description: string; 
    action: () => void;
    icon: JSX.Element;
  }) => (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button onClick={action} className="w-full">
          Acessar
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Bem-vindo, {profile?.name || "Usuário"}!
            </h1>
            <p className="text-muted-foreground">
              Gerencie sua barbearia de forma eficiente e profissional
            </p>
          </div>
          <Badge className={getRoleBadgeColor(profile?.role || "client")}>
            {getRoleLabel(profile?.role || "client")}
          </Badge>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<UserIcon className="h-6 w-6" />} 
          label="Clientes Hoje" 
          value={12}
          change="+2 desde ontem"
          changeType="positive"
          onClick={() => window.location.href = '/clientes'}
        />
        <StatCard 
          icon={<CalendarIcon className="h-6 w-6" />} 
          label="Agendamentos" 
          value={8}
          change="+12% esta semana"
          changeType="positive"
          onClick={() => window.location.href = '/agenda'}
        />
        <StatCard 
          icon={<BuildingOfficeIcon className="h-6 w-6" />} 
          label="Profissionais" 
          value={3}
          change="Ativos"
          changeType="neutral"
          onClick={() => window.location.href = '/cadastros/profissionais'}
        />
        <StatCard 
          icon={<CurrencyDollarIcon className="h-6 w-6" />} 
          label="Receita Hoje" 
          value="R$ 450"
          change="+8% vs ontem"
          changeType="positive"
          onClick={() => window.location.href = '/relatorios/financeiro'}
        />
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Nova Agenda"
            description="Criar um novo agendamento"
            action={() => window.location.href = '/agenda'}
            icon={<CalendarIcon className="h-6 w-6" />}
          />
          <QuickActionCard
            title="Adicionar Cliente"
            description="Cadastrar novo cliente"
            action={() => window.location.href = '/clientes'}
            icon={<UserIcon className="h-6 w-6" />}
          />
          <QuickActionCard
            title="Ver Relatórios"
            description="Acessar relatórios financeiros"
            action={() => window.location.href = '/relatorios/principal'}
            icon={<ChartBarIcon className="h-6 w-6" />}
          />
        </div>
      </div>

      {/* Recent Activity & User Info - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Agendamento confirmado</p>
                  <p className="text-xs text-muted-foreground">João Silva - Corte + Barba</p>
                </div>
                <span className="text-xs text-muted-foreground">há 10 min</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cliente cadastrado</p>
                  <p className="text-xs text-muted-foreground">Pedro Santos</p>
                </div>
                <span className="text-xs text-muted-foreground">há 1 hora</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Serviço concluído</p>
                  <p className="text-xs text-muted-foreground">Maria Costa - Sobrancelha</p>
                </div>
                <span className="text-xs text-muted-foreground">há 2 horas</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Ver Todas as Atividades
            </Button>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">{user.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">{profile?.name || "Não informado"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">{profile?.phone || "Não informado"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Função</label>
                  <Badge className={getRoleBadgeColor(profile?.role || "client")}>
                    {getRoleLabel(profile?.role || "client")}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">{dataCadastro}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Último Acesso</label>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">{ultimoAcesso}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Editar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
