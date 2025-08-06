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
  ClipboardDocumentListIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  Squares2X2Icon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { Tooltip } from "@nextui-org/react";
import { useAuth, usePermissions } from "@/lib/contexts/AuthContext";
import { useUnidade } from "@/components/UnidadeContext";
import Image from 'next/image';
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import { clsx } from "clsx";

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
const adminNavigationBarberBeer: NavItem[] = [
  { name: "Lista da Vez", href: "/lista-da-vez", icon: UsersIcon },
  { name: "Clientes", href: "/clientes", icon: UserGroupIcon },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarIcon },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: CurrencyDollarIcon },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: ChartBarIcon },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Cog6ToothIcon },
  // Adicione aqui menus exclusivos da BarberBeer, se houver
];
const adminNavigationTrato: NavItem[] = [
  { name: "Lista da Vez", href: "/lista-da-vez", icon: UsersIcon },
  { name: "Clientes", href: "/clientes", icon: UserGroupIcon },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarIcon },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: CurrencyDollarIcon },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: ChartBarIcon },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Cog6ToothIcon },
  // Adicione aqui menus exclusivos da Trato de Barbados, se houver
];

// Menu específico para recepcionista
const recepcionistaNavigationBarberBeer: NavItem[] = [
  { name: "Lista da Vez", href: "/lista-da-vez", icon: UsersIcon },
  { name: "Clientes", href: "/clientes", icon: UserGroupIcon },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarIcon },
  // Adicione aqui menus exclusivos da BarberBeer, se houver
];
const recepcionistaNavigationTrato: NavItem[] = [
  { name: "Lista da Vez", href: "/lista-da-vez", icon: UsersIcon },
  { name: "Clientes", href: "/clientes", icon: UserGroupIcon },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarIcon },
  // Adicione aqui menus exclusivos da Trato de Barbados, se houver
];

// Submenu de assinaturas
const assinaturaSubmenu = [
  { name: "Dashboard", href: "/assinaturas/dashboard" },
  { name: "Planos", href: "/assinaturas/planos" },
  { name: "Assinantes", href: "/assinaturas/assinantes" },
];

// Submenu de cadastros
const cadastrosSubmenuBarberBeer = [
  { name: "Profissionais", href: "/cadastros/profissionais", icon: UsersIcon },
  { name: "Serviços", href: "/cadastros/servicos", icon: WrenchScrewdriverIcon },
  { name: "Serviços Avulsos", href: "/cadastros/servicos-avulsos", icon: WrenchScrewdriverIcon },
  { name: "Produtos", href: "/cadastros/produtos", icon: CubeIcon },
  { name: "Metas", href: "/cadastros/metas-barberbeer", icon: ChartBarIcon },
];
const cadastrosSubmenuTrato = [
  { name: "Profissionais", href: "/cadastros/profissionais", icon: UsersIcon },
  { name: "Serviços", href: "/cadastros/servicos", icon: WrenchScrewdriverIcon },
  { name: "Produtos", href: "/cadastros/produtos", icon: CubeIcon },
  { name: "Metas", href: "/cadastros/metas-trato", icon: ChartBarIcon },
];

// Submenu de distribuição
const distribuicaoSubmenuBarberBeer = [
  { name: "Faturamento da Assinatura BBSC", href: "/dashboard/distribuicao-bbsc/faturamento-assinatura", icon: CurrencyDollarIcon },
  { name: "Lançamento de Assinatura", href: "/dashboard/distribuicao-bbsc/lancamento-assinatura", icon: ClipboardDocumentListIcon },
  { name: "Lançamento", href: "/dashboard/distribuicao-bbsc/lancamento", icon: WrenchScrewdriverIcon },
  { name: "Lançamento de Produto", href: "/dashboard/distribuicao/produtos", icon: CubeIcon },
  { name: "Comissão BBSC", href: "/dashboard/distribuicao-bbsc/comissao", icon: CurrencyDollarIcon },
  { name: "Comissão Avulsa", href: "/dashboard/distribuicao-bbsc/comissao-avulsa", icon: CurrencyDollarIcon },
];
const distribuicaoSubmenuTrato = [
  { name: "Faturamento da Assinatura", href: "/dashboard/distribuicao/faturamento-assinatura", icon: CurrencyDollarIcon },
  { name: "Lançamento de Assinatura", href: "/dashboard/distribuicao/lancamento-assinatura", icon: ClipboardDocumentListIcon },
  { name: "Lançamento", href: "/dashboard/distribuicao/lancamento", icon: WrenchScrewdriverIcon },
  { name: "Lançamento de Produto", href: "/dashboard/distribuicao/produtos", icon: CubeIcon },
  { name: "Comissão", href: "/dashboard/distribuicao/comissao", icon: CurrencyDollarIcon },
  { name: "Comissão Avulsa", href: "/dashboard/distribuicao/comissao-avulsa", icon: CurrencyDollarIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  headerSlot?: React.ReactNode;
}

function SidebarSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 uppercase mb-2 mt-4 px-3 tracking-widest letter-spacing-wider opacity-80">
      {children}
    </div>
  );
}

export default function Sidebar({ isCollapsed, mobileOpen, onMobileClose, headerSlot }: SidebarProps) {
  const pathname = usePathname();
  // Substituir os estados dos submenus por um único estado para controlar qual submenu está aberto
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { profile, signOut } = useAuth();
  const { isAdmin, isRecepcionista, canViewSubscriptions } = usePermissions();
  const { unidade, setUnidade } = useUnidade();

  console.log('Sidebar - Profile:', profile);
  console.log('Sidebar - Permissions:', { isAdmin, isRecepcionista, canViewSubscriptions });

  const handleSubmenuToggle = (menu: string) => {
    setOpenSubmenu((prev) => (prev === menu ? null : menu));
  };

  // Função para renderizar um item de navegação
  const renderNavItem = (item: NavItem, isActive: boolean) => (
      <Link
        key={item.name}
        href={item.href}
        className={`
        flex items-center gap-2 px-3 py-2 rounded text-[15px] font-medium
          ${isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#2c313a] hover:text-blue-700 dark:hover:text-white'}
        `}
      style={{ minHeight: 36 }}
      >
      <item.icon className="w-5 h-5" />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </Link>
  );

  // Determinar quais itens de navegação mostrar
  const getNavigationItems = () => {
    const items = [...baseNavigation];
    if (isAdmin) {
      items.push(...(unidade === "BARBER BEER SPORT CLUB" ? adminNavigationBarberBeer : adminNavigationTrato));
    } else if (isRecepcionista) {
      items.push(...(unidade === "BARBER BEER SPORT CLUB" ? recepcionistaNavigationBarberBeer : recepcionistaNavigationTrato));
    }
    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white dark:bg-[#171717] border-r border-gray-200 dark:border-[#171717] z-30 hidden md:flex flex-col
          ${isCollapsed ? 'w-16' : 'w-56'}
          transition-all
        `}
      >
        {/* Header unificado, se fornecido */}
        {headerSlot}
        {/* Topo */}
        <div className="flex flex-col items-center py-4 px-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#171717]">
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-blue-100 mb-2 text-center">{unidade}</span>
          )}
          <div className="w-full flex justify-center items-center">
            <select
              className="border rounded px-3 py-1 text-xs font-bold text-center bg-white dark:bg-[#23272d] text-gray-800 dark:text-blue-200 focus:ring-2 focus:ring-blue-400 h-8"
              value={unidade}
              onChange={e => setUnidade(e.target.value)}
              style={{ minWidth: 130 }}
              aria-label="Selecionar unidade"
            >
              <option>Trato de Barbados</option>
              <option>BARBER BEER SPORT CLUB</option>
            </select>
          </div>
        </div>
        {/* Menu com scroll */}
        <div className="sidebar-menu overflow-y-auto max-h-screen min-h-0">
          <nav className="px-2 py-4 space-y-6 bg-white dark:bg-[#23272d] flex-1 flex flex-col">
            {/* Menu principal */}
            <div>
              <span className="text-xs text-gray-400 tracking-widest mb-2 block pl-2">MENU</span>
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-[15px] relative
                    transition-colors duration-200
                    ${pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#2c313a] hover:text-blue-700 dark:hover:text-white'}
                  `}
                  style={{ minHeight: 40 }}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              ))}
            </div>
            {/* Submenus agrupados */}
            <div>
              <span className="text-xs text-blue-700 dark:text-blue-400 tracking-widest mb-2 block pl-2">ASSINATURAS</span>
              <button
                onClick={() => handleSubmenuToggle('assinaturas')}
                className={`flex items-center w-full px-3 py-2 rounded-lg font-medium text-[15px] transition-colors duration-200 ${openSubmenu === 'assinaturas' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-white' : 'text-gray-800 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-[#23272d] hover:text-blue-700 dark:hover:text-white'}`}
                aria-expanded={openSubmenu === 'assinaturas'}
                aria-controls="submenu-assinaturas"
              >
                <ChartBarIcon className="w-5 h-5 mr-2" />
                {!isCollapsed && <span className="truncate flex-1">Assinaturas</span>}
                {!isCollapsed && (
                  <span className={`ml-2 transition-transform ${openSubmenu === 'assinaturas' ? 'rotate-180' : ''}`}>{openSubmenu === 'assinaturas' ? '▲' : '▼'}</span>
                )}
              </button>
              {!isCollapsed && openSubmenu === 'assinaturas' && (
                <ul id="submenu-assinaturas" className="pl-8 pr-1 py-2 space-y-1 bg-[#f8fafc] dark:bg-[#1b1e23] rounded-md mt-1 mb-2 border border-gray-200 dark:border-[#23272d]">
                  {assinaturaSubmenu.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-2 rounded text-[14px] font-medium transition-colors
                          ${pathname === item.href
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-white'}
                        `}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Outros submenus (Cadastros, Distribuição) seguem o mesmo padrão... */}
            <div>
              <span className="text-xs text-gray-400 tracking-widest mb-2 block pl-2">CADASTROS</span>
              <button
                onClick={() => handleSubmenuToggle('cadastros')}
                className={`flex items-center w-full px-3 py-2 rounded-lg font-medium text-[15px] transition-colors duration-200 ${openSubmenu === 'cadastros' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-white' : 'text-gray-800 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-[#23272d] hover:text-blue-700 dark:hover:text-white'}`}
                aria-expanded={openSubmenu === 'cadastros'}
                aria-controls="submenu-cadastros"
              >
                <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                {!isCollapsed && <span className="truncate flex-1">Cadastros</span>}
                {!isCollapsed && (
                  <span className={`ml-2 transition-transform ${openSubmenu === 'cadastros' ? 'rotate-180' : ''}`}>{openSubmenu === 'cadastros' ? '▲' : '▼'}</span>
                )}
              </button>
              {!isCollapsed && openSubmenu === 'cadastros' && (
                <ul id="submenu-cadastros" className="pl-8 pr-1 py-2 space-y-1 bg-[#f1f5f9] dark:bg-[#1b1e23] rounded-md mt-1 mb-2 border border-gray-200 dark:border-[#23272d]">
                  {(unidade === 'BARBER BEER SPORT CLUB' ? cadastrosSubmenuBarberBeer : cadastrosSubmenuTrato).map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-2 rounded text-[14px] font-medium transition-colors
                          ${pathname === item.href
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-white'}
                        `}
                      >
                        <item.icon className="w-4 h-4 mr-2 inline" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Submenu Distribuição */}
            <div>
              <button
                className={`flex items-center w-full px-4 py-2 rounded-lg font-semibold text-base transition ${openSubmenu === 'distribuicao' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50'}`}
                onClick={() => setOpenSubmenu(openSubmenu === 'distribuicao' ? null : 'distribuicao')}
              >
                <ChartBarIcon className="w-5 h-5 mr-2" />
                <span className="flex-1 text-left">Distribuição</span>
                <ChevronDownIcon className={clsx('w-4 h-4 ml-auto transition-transform', openSubmenu === 'distribuicao' && 'rotate-180')} />
              </button>
              {openSubmenu === 'distribuicao' && (
                <ul id="submenu-distribuicao" className="pl-8 pr-1 py-2 space-y-1 bg-[#f8fafc] dark:bg-[#1b1e23] rounded-md mt-1 mb-2 border border-gray-200 dark:border-[#23272d]">
                  {(unidade === 'BARBER BEER SPORT CLUB' ? distribuicaoSubmenuBarberBeer : distribuicaoSubmenuTrato).map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-2 rounded text-[14px] font-medium transition-colors
                          ${pathname === item.href
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-white'}
                        `}
                      >
                        <item.icon className="w-4 h-4 mr-2 inline" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </nav>
        </div>
        {/* Rodapé fixo */}
        <div className="mt-auto flex flex-col items-center py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#171717]">
          <ProfileDropdown user={profile} signOut={signOut} />
          <span className="text-sm text-gray-900 dark:text-blue-100 font-semibold mt-2">Usuário</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Bem-vindo!</span>
        </div>
      </aside>

      {/* Sidebar Mobile permanece igual por enquanto */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
            onClick={onMobileClose}
          />
          <aside className="bg-gradient-to-br from-[#0f2233] to-[#112d42] w-60 min-h-screen flex flex-col">
            {/* Topo: Avatar, nome e status */}
            <div className="flex flex-col items-center py-6 border-b border-cyan-700">
              <div className="w-16 h-16 rounded-full bg-gray-700 mb-2" />
              <span className="text-white font-bold">{profile?.name || 'Usuário'}</span>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> Online
              </span>
            </div>
            {/* Seção */}
            <div className="px-4 py-3 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-300 uppercase tracking-widest">Menu</span>
                <span className="flex-1 h-px bg-cyan-700 ml-2"></span>
              </div>
              <nav className="space-y-1">
                <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-cyan-900 transition-colors">
                  <HomeIcon className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium">Dashboard</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-cyan-900 transition-colors">
                  <UserGroupIcon className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">Clientes</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-cyan-900 transition-colors">
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Agendamentos</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-cyan-900 transition-colors">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">Financeiro</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-cyan-900 transition-colors">
                  <ChartBarIcon className="w-5 h-5 text-cyan-400" />
                  <span className="font-medium">Relatórios</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-cyan-900 transition-colors">
                  <Cog6ToothIcon className="w-5 h-5 text-orange-400" />
                  <span className="font-medium">Configurações</span>
                </a>
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
