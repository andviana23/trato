"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CubeIcon
} from "@heroicons/react/24/outline";
import { Button } from "@nextui-org/react";
import { useAuth, usePermissions } from "@/lib/contexts/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Menu básico que todos os usuários podem ver
const baseNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
];

// Menu específico para admin
const adminNavigation: NavItem[] = [
  { name: "Lista da Vez", href: "/lista-da-vez", icon: UsersIcon },
  { name: "Clientes", href: "/clientes", icon: UserGroupIcon },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarIcon },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: CurrencyDollarIcon },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: ChartBarIcon },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Cog6ToothIcon },
];

// Menu específico para recepcionista
const recepcionistaNavigation: NavItem[] = [
  { name: "Lista da Vez", href: "/lista-da-vez", icon: UsersIcon },
  { name: "Clientes", href: "/clientes", icon: UserGroupIcon },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarIcon },
];

// Submenu de assinaturas
const assinaturaSubmenu = [
  { name: "Dashboard", href: "/assinaturas/dashboard" },
  { name: "Planos", href: "/assinaturas/planos" },
  { name: "Assinantes", href: "/assinaturas/assinantes" },
];

// Submenu de cadastros
const cadastrosSubmenu = [
  { name: "Profissionais", href: "/cadastros/profissionais", icon: UsersIcon },
  { name: "Serviços", href: "/cadastros/servicos", icon: WrenchScrewdriverIcon },
  { name: "Produtos", href: "/cadastros/produtos", icon: CubeIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [assinaturasOpen, setAssinaturasOpen] = useState(() => pathname.startsWith("/assinaturas"));
  const [cadastrosOpen, setCadastrosOpen] = useState(() => pathname.startsWith("/cadastros"));
  const { profile } = useAuth();
  const { isAdmin, isRecepcionista, canViewSubscriptions } = usePermissions();

  console.log('Sidebar - Profile:', profile);
  console.log('Sidebar - Permissions:', { isAdmin, isRecepcionista, canViewSubscriptions });

  const handleAssinaturasToggle = () => setAssinaturasOpen((open) => !open);
  const handleCadastrosToggle = () => setCadastrosOpen((open) => !open);

  // Função para renderizar um item de navegação
  const renderNavItem = (item: NavItem, isActive: boolean) => (
    <Link
      key={item.name}
      href={item.href}
      className={`
        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${isActive 
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }
      `}
    >
      <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );

  // Determinar quais itens de navegação mostrar
  const getNavigationItems = () => {
    const items = [...baseNavigation];
    
    if (isAdmin) {
      items.push(...adminNavigation);
    } else if (isRecepcionista) {
      items.push(...recepcionistaNavigation);
    }
    
    return items;
  };

  const navigationItems = getNavigationItems();

  const sidebarContent = (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {/* Itens de navegação básicos */}
      {navigationItems.map((item) => renderNavItem(item, pathname === item.href))}

      {/* Submenus - disponíveis para admin e recepcionista */}
      {canViewSubscriptions && (
        <>
          {/* Submenu Assinaturas */}
          <div>
            <div
              onClick={handleAssinaturasToggle}
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                ${pathname.startsWith('/assinaturas')
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
              `}
            >
              <ChartBarIcon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">Assinaturas</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${assinaturasOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </div>
            {!isCollapsed && assinaturasOpen && (
              <div className="pl-10 pr-2 py-1 space-y-1">
                {assinaturaSubmenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      block px-2 py-1 rounded-md text-sm transition-colors
                      ${pathname === item.href
                        ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}
                    `}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Submenu Cadastros - apenas para admin */}
          {isAdmin && (
            <div>
              <div
                onClick={handleCadastrosToggle}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${pathname.startsWith('/cadastros')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                `}
              >
                <ClipboardDocumentListIcon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">Cadastros</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${cadastrosOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </div>
              {!isCollapsed && cadastrosOpen && (
                <div className="pl-10 pr-2 py-1 space-y-1">
                  {cadastrosSubmenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors
                        ${pathname === item.href
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}
                      `}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </nav>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out z-30 hidden md:flex flex-col
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Barbearia</span>
            </div>
          )}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onClick={onToggle}
            className="ml-auto"
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <Bars3Icon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
          </Button>
        </div>

        {sidebarContent}
      </aside>

      {/* Sidebar Mobile */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 z-50 md:hidden flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Barbearia</span>
              </div>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={onMobileClose}
                className="ml-auto"
                aria-label="Fechar menu"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
