import React, { useState } from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import ProfileModal from "./ProfileModal";
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff';
const ProfileDropdown = ({ user, signOut }) => {
    var _a, _b;
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Verificar se user existe
    if (!user) {
        return null;
    }
    const fullName = ((_a = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) || (user === null || user === void 0 ? void 0 : user.email) || "Usuário";
    const avatarUrl = ((_b = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _b === void 0 ? void 0 : _b.avatar_url) || DEFAULT_AVATAR;
    return (<>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button variant="light" className="flex items-center space-x-2 px-3 py-2 w-full max-w-full border-none shadow-none">
            <Avatar src={avatarUrl} name={fullName} size="sm" className="mr-2 flex-shrink-0"/>
            <span className="truncate text-sm text-gray-900 dark:text-white max-w-[140px] overflow-hidden text-ellipsis block">
              {(user === null || user === void 0 ? void 0 : user.email) || fullName}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500 ml-2"/>
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
      <ProfileModal open={isModalOpen} onClose={() => setIsModalOpen(false)} user={user}/>
    </>);
};
export default ProfileDropdown;
