"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  CubeIcon
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

const navigation = [
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

export default function Sidebar() {
  const pathname = usePathname();
  const [assinaturasOpen, setAssinaturasOpen] = useState(() => pathname.startsWith("/assinaturas"));
  const [cadastrosOpen, setCadastrosOpen] = useState(() => pathname.startsWith("/cadastros"));

  return (
    <aside
      className={
        `h-screen w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        flex-col transition-all duration-300 ease-in-out z-30 hidden md:flex`
      }
      aria-label="Sidebar"
    >
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">Barbearia</span>
        </div>
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
              className={
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
              tabIndex={0}
            >
              <item.icon className={
                `w-5 h-5 mr-3 flex-shrink-0`
              } />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
        {/* Lista da Vez */}
        <Link
          href="/lista-da-vez"
          className={
            `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${pathname === '/lista-da-vez'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`
          }
          tabIndex={0}
        >
          <UsersIcon className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="truncate">Lista da Vez</span>
        </Link>
        {/* Assinaturas (sub-menu) */}
        <div>
          <div
            onClick={() => setAssinaturasOpen((open) => !open)}
            className={
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
              ${pathname.startsWith('/assinaturas')
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`
            }
            tabIndex={0}
            role="button"
            aria-expanded={assinaturasOpen}
            aria-controls="submenu-assinaturas"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setAssinaturasOpen((open) => !open); }}
          >
            <ChartBarIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate flex-1">Assinaturas</span>
            <ChevronDownIcon
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${assinaturasOpen ? 'rotate-180' : ''}`}
            />
          </div>
          {/* Sub-menu */}
          <div
            id="submenu-assinaturas"
            className={`overflow-hidden transition-all duration-300 ${assinaturasOpen ? 'max-h-40' : 'max-h-0'}`}
          >
            <ul className="pl-10 pr-2 py-1 space-y-1">
              {assinaturaSubmenu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        `block px-2 py-1 rounded-md text-sm transition-colors
                        ${isActive
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`
                      }
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
            <span className="truncate flex-1">Cadastros</span>
            <ChevronDownIcon
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${cadastrosOpen ? 'rotate-180' : ''}`}
            />
          </div>
          {/* Sub-menu */}
          <div
            id="submenu-cadastros"
            className={`overflow-hidden transition-all duration-300 ${cadastrosOpen ? 'max-h-40' : 'max-h-0'}`}
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
              className={
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
              tabIndex={0}
            >
              <item.icon className={
                `w-5 h-5 mr-3 flex-shrink-0`
              } />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      {/* Footer da Sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Barbearia
        </div>
      </div>
    </aside>
  );
} 