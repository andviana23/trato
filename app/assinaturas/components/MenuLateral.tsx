import React from 'react';
import { FiFileText, FiUsers } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, usePermissions } from '@/lib/contexts/AuthContext';

export default function MenuLateral() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // Alternativamente, use o hook do Next.js se disponível
  // const pathname = usePathname();
  const { profile } = useAuth();
  const { isRecepcionista } = usePermissions();

  // --- INÍCIO: Checagem de permissão para recepcionista ---
  // Se for recepcionista, só mostra as rotas permitidas
  if (isRecepcionista) {
    return (
      <nav className="flex flex-col gap-2 p-4">
        <Link href="/assinaturas/assinantes" passHref legacyBehavior>
          <a
            className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-150
              ${pathname.startsWith('/assinaturas/assinantes') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FiUsers className="w-5 h-5" />
            <span className="hidden md:inline">Assinantes</span>
          </a>
        </Link>
        <Link href="/assinaturas/planos" passHref legacyBehavior>
          <a
            className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-150
              ${pathname.startsWith('/assinaturas/planos') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FiFileText className="w-5 h-5" />
            <span className="hidden md:inline">Planos</span>
          </a>
        </Link>
        <Link href="/lista-da-vez" passHref legacyBehavior>
          <a
            className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-150
              ${pathname.startsWith('/lista-da-vez') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FiFileText className="w-5 h-5" />
            <span className="hidden md:inline">Lista da Vez</span>
          </a>
        </Link>
      </nav>
    );
  }
  // --- FIM: Checagem de permissão para recepcionista ---

  // Demais perfis: menu padrão
  return (
    <nav className="flex flex-col gap-2 p-4">
      <Link href="/assinaturas" passHref legacyBehavior>
        <a
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-150
            ${pathname === '/assinaturas' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'}`}
          aria-current={pathname === '/assinaturas' ? 'page' : undefined}
        >
          <FiFileText className="w-5 h-5" />
          <span className="hidden md:inline">Assinaturas</span>
        </a>
      </Link>
      <Link href="/assinaturas/assinantes" passHref legacyBehavior>
        <a
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-150
            ${pathname.startsWith('/assinaturas/assinantes') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <FiUsers className="w-5 h-5" />
          <span className="hidden md:inline">Assinantes</span>
        </a>
      </Link>
    </nav>
  );
} 