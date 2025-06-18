"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

interface HeaderProps {
  isCollapsed: boolean;
}

export default function Header({ isCollapsed }: HeaderProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className={`
      fixed top-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out z-30
      ${isCollapsed ? 'left-16' : 'left-64'}
    `}>
      <div className="flex items-center justify-between h-full px-6">
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
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="flex items-center space-x-2 px-3 py-2"
              >
                <UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.user_metadata?.full_name || user?.email || "Usuário"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Menu do usuário">
              <DropdownItem key="profile">Perfil</DropdownItem>
              <DropdownItem key="settings">Configurações</DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={handleSignOut}>
                Sair
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
} 