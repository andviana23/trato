"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import ProfileDropdown from "@/components/profile/ProfileDropdown";

interface HeaderProps {
  isCollapsed: boolean;
  onMobileMenu: () => void;
}

export default function Header({ isCollapsed, onMobileMenu }: HeaderProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="h-16 flex items-center px-2 md:px-4 border-b bg-white dark:bg-gray-900 shadow-sm flex-shrink-0 z-50">
      <div className="flex items-center justify-between h-full px-6 w-full">
        {/* Botão menu mobile */}
        <button
          className="md:hidden mr-2"
          onClick={onMobileMenu}
          aria-label="Abrir menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Lado esquerdo - Breadcrumb placeholder */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
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
            className="relative"
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Toggle de Tema */}
          <ThemeToggle />

          {/* Usuário */}
          <ProfileDropdown user={user} signOut={handleSignOut} />
        </div>
      </div>
    </header>
  );
} 