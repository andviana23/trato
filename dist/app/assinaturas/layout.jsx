"use client";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth, usePermissions } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
export default function AssinaturasLayout({ children }) {
    const { profile } = useAuth();
    const { isRecepcionista } = usePermissions();
    const router = useRouter();
    const pathname = usePathname();
    // --- INÍCIO: Checagem de permissão para recepcionista no frontend ---
    useEffect(() => {
        if (isRecepcionista) {
            const allowed = ['/assinaturas/assinantes', '/assinaturas/planos', '/lista-da-vez'];
            if (!allowed.some(route => pathname.startsWith(route))) {
                router.replace('/lista-da-vez');
            }
        }
    }, [isRecepcionista, pathname, router]);
    // --- FIM: Checagem de permissão para recepcionista ---
    return (<div className="flex min-h-screen">
      <Sidebar isCollapsed={false}/>
      <main className="flex-1 bg-gray-50 min-h-screen">{children}</main>
    </div>);
}
