import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileModal from "./ProfileModal";

interface ProfileDropdownProps {
  user: any;
  signOut: () => void;
}

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff';

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, signOut }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Verificar se user existe
  if (!user) {
    return null;
  }
  
  const fullName = user?.user_metadata?.full_name || user?.email || "Usuário";
  const avatarUrl = user?.user_metadata?.avatar_url || DEFAULT_AVATAR;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 w-full max-w-full">
            <img src={avatarUrl} alt={fullName} className="w-6 h-6 rounded-full mr-2" />
            <span className="truncate text-sm text-gray-900 dark:text-white max-w-[140px] overflow-hidden text-ellipsis block">
              {user?.email || fullName}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsModalOpen(true)}>Perfil</DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="text-red-600">Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileModal open={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
    </>
  );
};

export default ProfileDropdown; 
