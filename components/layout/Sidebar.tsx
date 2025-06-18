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
import { Button } from "@heroui/react";
import { useAuth } from "@/lib/contexts/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Lista da Vez", href: "/lista-da-vez", icon: UsersIcon },
  { name: "Clientes", href: "/clientes", icon: UserGroupIcon },
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
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role;
  console.log('Sidebar - userRole:', userRole, user);

  const handleAssinaturasToggle = () => setAssinaturasOpen((open) => !open);

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className={`
          h-screen w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          flex-col transition-all duration-300 ease-in-out z-30
          hidden md:flex
        `}
        aria-label="Sidebar"
      >
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
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? (
              <Bars3Icon className="w-5 h-5" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </Button>
        </div>
        {/* Navegação */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {userRole === "admin" && (
            <>
              {/* Todos os menus para admin */}
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
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
                    tabIndex={0}
                  >
                    <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
              {/* Assinaturas (sub-menu completo) */}
              <div>
                <div
                  onClick={handleAssinaturasToggle}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
                    ${pathname.startsWith('/assinaturas')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                  `}
                  tabIndex={0}
                  role="button"
                  aria-expanded={assinaturasOpen}
                  aria-controls="submenu-assinaturas"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleAssinaturasToggle(); }}
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
                  id="submenu-assinaturas"
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
              {/* Cadastros (sub-menu completo) */}
              <div>
                <div
                  onClick={() => setCadastrosOpen((open) => !open)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
                    ${pathname.startsWith('/cadastros')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                  `}
                  tabIndex={0}
                  role="button"
                  aria-expanded={cadastrosOpen}
                  aria-controls="submenu-cadastros"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setCadastrosOpen((open) => !open); }}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate flex-1">Cadastros</span>}
                  {!isCollapsed && (
                    <ChevronDownIcon
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${cadastrosOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>
                {/* Sub-menu */}
                <div
                  id="submenu-cadastros"
                  className={`overflow-hidden transition-all duration-300 ${cadastrosOpen && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}
                >
                  <ul className="pl-10 pr-2 py-1 space-y-1">
                    {cadastrosSubmenu.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`
                              flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors
                              ${isActive
                                ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}
                            `}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </>
          )}
          {userRole === "recepcionista" && (
            <>
              {/* Menus restritos para recepcionista */}
              {/* Lista da Vez */}
              <Link
                href="/lista-da-vez"
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${pathname === "/lista-da-vez"
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
                tabIndex={0}
              >
                <UsersIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                {!isCollapsed && <span className="truncate">Lista da Vez</span>}
              </Link>
              {/* Clientes */}
              <Link
                href="/clientes"
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${pathname === "/clientes"
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
                tabIndex={0}
              >
                <UserGroupIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                {!isCollapsed && <span className="truncate">Clientes</span>}
              </Link>
              {/* Assinaturas (Planos e Assinantes) */}
              <div>
                <div
                  onClick={handleAssinaturasToggle}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
                    ${pathname.startsWith('/assinaturas')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                  `}
                  tabIndex={0}
                  role="button"
                  aria-expanded={assinaturasOpen}
                  aria-controls="submenu-assinaturas"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleAssinaturasToggle(); }}
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
                  id="submenu-assinaturas"
                  className={`overflow-hidden transition-all duration-300 ${assinaturasOpen && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}
                >
                  <ul className="pl-10 pr-2 py-1 space-y-1">
                    {[{ name: "Planos", href: "/assinaturas/planos" }, { name: "Assinantes", href: "/assinaturas/assinantes" }].map((item) => {
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
              {/* Cadastros (apenas Serviços e Produtos para recepcionista) */}
              <div>
                <div
                  onClick={() => setCadastrosOpen((open) => !open)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
                    ${pathname.startsWith('/cadastros')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                  `}
                  tabIndex={0}
                  role="button"
                  aria-expanded={cadastrosOpen}
                  aria-controls="submenu-cadastros"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setCadastrosOpen((open) => !open); }}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate flex-1">Cadastros</span>}
                  {!isCollapsed && (
                    <ChevronDownIcon
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${cadastrosOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>
                {/* Sub-menu */}
                <div
                  id="submenu-cadastros"
                  className={`overflow-hidden transition-all duration-300 ${cadastrosOpen && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}
                >
                  <ul className="pl-10 pr-2 py-1 space-y-1">
                    {[
                      { name: "Serviços", href: "/cadastros/servicos", icon: WrenchScrewdriverIcon },
                      { name: "Produtos", href: "/cadastros/produtos", icon: CubeIcon }
                    ].map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`
                              flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors
                              ${isActive
                                ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}
                            `}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </>
          )}
          {/* Outros papéis podem ser tratados aqui */}
        </nav>
      </aside>
      {/* Sidebar mobile */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
            onClick={onMobileClose}
            aria-label="Fechar menu"
            tabIndex={-1}
          />
          <aside
            className={`
              fixed left-0 top-0 h-full w-4/5 max-w-xs bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
              flex flex-col z-50 shadow-xl transition-transform duration-300
              ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
              scroll-smooth
            `}
            aria-label="Sidebar mobile"
            tabIndex={0}
          >
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
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                onClick={onMobileClose}
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>
            {/* Navegação */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {/* Dashboard */}
              {navigation.slice(0, 1).map((item) => {
                const isActive = pathname === item.href;
                return (
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
                    tabIndex={0}
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
                  tabIndex={0}
                  role="button"
                  aria-expanded={assinaturasOpen}
                  aria-controls="submenu-assinaturas"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleAssinaturasToggle(); }}
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
                  id="submenu-assinaturas"
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
              {/* Cadastros (sub-menu) */}
              <div>
                <div
                  onClick={() => setCadastrosOpen((open) => !open)}
                  className={
                    `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
                    ${pathname.startsWith('/cadastros')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`
                  }
                  tabIndex={0}
                  role="button"
                  aria-expanded={cadastrosOpen}
                  aria-controls="submenu-cadastros"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setCadastrosOpen((open) => !open); }}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate flex-1">Cadastros</span>}
                  {!isCollapsed && (
                    <ChevronDownIcon
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${cadastrosOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>
                {/* Sub-menu */}
                <div
                  id="submenu-cadastros"
                  className={`overflow-hidden transition-all duration-300 ${cadastrosOpen && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}
                >
                  <ul className="pl-10 pr-2 py-1 space-y-1">
                    {cadastrosSubmenu.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={
                              `flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors
                              ${isActive
                                ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`
                            }
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
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
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }
                    `}
                    tabIndex={0}
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              {!isCollapsed && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  © 2024 Barbearia
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
} 