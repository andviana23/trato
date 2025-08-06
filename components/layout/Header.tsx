"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";
import { Button } from "@nextui-org/react";
import ProfileDropdown from "@/components/profile/ProfileDropdown";

interface HeaderProps {
  isCollapsed: boolean;
  onMobileMenu: () => void;
  unified?: boolean;
}

export default function Header({ isCollapsed, onMobileMenu, unified }: HeaderProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className={`h-16 flex items-center ${unified ? 'px-0' : 'px-2 md:px-4'} bg-[#171717] text-gray-100 flex-shrink-0 z-50 border-b-0 shadow-none`}>
      <div className={`flex items-center justify-between h-full w-full ${unified ? 'px-4' : 'px-6'}`}>
        {/* Botão menu mobile */}
        <button
          className="md:hidden mr-2 text-gray-200"
          onClick={onMobileMenu}
          aria-label="Abrir menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        {/* Lado esquerdo - Breadcrumb placeholder */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-100">
            Dashboard
          </h1>
        </div>
        {/* Lado direito - Ações */}
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative text-gray-200"
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>
          {/* Toggle de Tema */}
          <ThemeToggle />
          {/* Usuário REMOVIDO do header */}
        </div>
      </div>
    </header>
  );
} 
