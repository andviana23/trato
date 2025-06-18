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
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Clientes", href: "/dashboard/clientes", icon: UserGroupIcon },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarIcon },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: CurrencyDollarIcon },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: ChartBarIcon },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Cog6ToothIcon },
];

const assinaturaSubmenu = [
  { name: "Dashboard", href: "/assinaturas/dashboard" },
  { name: "Planos", href: "/assinaturas/planos" },
  { name: "Assinantes", href: "/assinaturas/assinantes" },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [assinaturasOpen, setAssinaturasOpen] = useState(() => pathname.startsWith("/assinaturas"));

  const handleAssinaturasToggle = () => setAssinaturasOpen((open) => !open);

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out z-40
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header da Sidebar */}
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
        >
          {isCollapsed ? (
            <Bars3Icon className="w-5 h-5" />
          ) : (
            <XMarkIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {/* Dashboard */}
        {navigation.slice(0, 1).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }
              `}
            >
              <item.icon className={`
                w-5 h-5 mr-3 flex-shrink-0
                ${isCollapsed ? 'mr-0' : 'mr-3'}
              `} />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}

        {/* Assinaturas (sub-menu) */}
        <div>
          <div
            onClick={handleAssinaturasToggle}
            className={`
              flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
              ${pathname.startsWith('/assinaturas')
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
            `}
          >
            <ChartBarIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            {!isCollapsed && <span className="truncate flex-1">Assinaturas</span>}
            {!isCollapsed && (
              <ChevronDownIcon
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${assinaturasOpen ? 'rotate-180' : ''}`}
              />
            )}
          </div>
          {/* Sub-menu */}
          <div
            className={`overflow-hidden transition-all duration-300 ${assinaturasOpen && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}
          >
            <ul className="pl-10 pr-2 py-1 space-y-1">
              {assinaturaSubmenu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        block px-2 py-1 rounded-md text-sm transition-colors
                        ${isActive
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}
                      `}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Demais itens */}
        {navigation.slice(1).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }
              `}
            >
              <item.icon className={`
                w-5 h-5 mr-3 flex-shrink-0
                ${isCollapsed ? 'mr-0' : 'mr-3'}
              `} />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer da Sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Barbearia
          </div>
        )}
      </div>
    </div>
  );
} 