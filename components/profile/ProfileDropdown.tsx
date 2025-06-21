import React, { useState } from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
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
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button variant="light" className="flex items-center space-x-2 px-3 py-2">
            <Avatar src={avatarUrl} name={fullName} size="sm" className="mr-2" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{fullName}</p>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Menu do usuário">
          <DropdownItem key="profile" onClick={() => setIsModalOpen(true)}>
            Perfil
          </DropdownItem>
          <DropdownItem key="logout" color="danger" onClick={signOut}>
            Sair
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <ProfileModal open={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
    </>
  );
};

export default ProfileDropdown; 
