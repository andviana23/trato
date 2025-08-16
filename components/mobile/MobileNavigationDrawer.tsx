"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  LayoutDashboard,
  BarChart3,
  ListOrdered,
  Users,
  HelpCircle,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type SimpleItem = { 
  label: string; 
  href: string; 
  icon: React.ReactNode;
};

type ExpandableItem = {
  label: string;
  icon: React.ReactNode;
  children: { label: string; href: string }[];
};

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
}

export default function MobileNavigationDrawer({ 
  isOpen, 
  onClose, 
  onSignOut 
}: MobileNavigationDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Primary navigation items
  const primaryNav: SimpleItem[] = [
    { label: "Agenda", href: "/agenda", icon: <Calendar size={20} /> },
    { label: "Lista da Vez", href: "/lista-da-vez", icon: <ListOrdered size={20} /> },
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Relatórios", href: "/relatorios/principal", icon: <BarChart3 size={20} /> },
  ];

  // Expandable sections
  const expandableItems: ExpandableItem[] = [
    {
      label: "Cadastros",
      icon: <Users size={20} />,
      children: [
        { label: "Clientes", href: "/clientes" },
        { label: "Profissionais", href: "/cadastros/profissionais" },
        { label: "Serviços", href: "/cadastros/servicos" },
        { label: "Produtos", href: "/cadastros/produtos" },
        { label: "Metas", href: "/cadastros/metas-trato" },
      ]
    },
    {
      label: "Assinaturas",
      icon: <BarChart3 size={20} />,
      children: [
        { label: "Dashboard", href: "/assinaturas/dashboard" },
        { label: "Planos", href: "/assinaturas/planos" },
        { label: "Assinantes", href: "/assinaturas/assinantes" },
      ]
    },
    {
      label: "Distribuição",
      icon: <BarChart3 size={20} />,
      children: [
        { label: "Faturamento da Assinatura", href: "/dashboard/distribuicao/faturamento-assinatura" },
        { label: "Lançamento de Assinatura", href: "/dashboard/distribuicao/lancamento-assinatura" },
        { label: "Lançamento de Serviço", href: "/dashboard/distribuicao/lancamento-servico" },
        { label: "Produtos", href: "/dashboard/distribuicao/produtos" },
        { label: "Comissão", href: "/dashboard/distribuicao/comissao" },
        { label: "Comissão Avulsa", href: "/dashboard/distribuicao/comissao-avulsa" },
      ]
    },
    {
      label: "Relatórios",
      icon: <BarChart3 size={20} />,
      children: [
        { label: "Painel Principal", href: "/relatorios/principal" },
        { label: "Painel Agenda", href: "/relatorios/agenda" },
        { label: "Painel Financeiro", href: "/relatorios/financeiro" },
        { label: "Avançados", href: "/relatorios/avancados" },
      ]
    }
  ];

  const userName = (typeof window !== "undefined" && localStorage.getItem("user_name")) || "John Doe";
  const userEmail = (typeof window !== "undefined" && localStorage.getItem("user_email")) || "john@company.com";
  const uniteName = (typeof window !== "undefined" && localStorage.getItem("tb.unidade_nome")) || "Unidade não selecionada";

  // Close drawer when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleLinkClick = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    } else {
      // Default sign out logic
      try { 
        document.cookie = `tb.unidade=; Path=/; Max-Age=0`; 
        document.cookie = "tb.unit=; Path=/; Max-Age=0";
      } catch {}
      try { 
        localStorage.clear(); 
        sessionStorage.clear(); 
      } catch {}
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {}
      router.replace('/auth/login');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-[#0f1115] text-white border-r border-white/20 z-50 md:hidden overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <span className="bg-white/30 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    L
                  </span>
                  <span className="font-bold text-lg">Logo</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Unit Info */}
              <div className="px-4 py-3 bg-white/10 border-b border-white/20">
                <p className="text-xs text-white/70">Unidade Atual</p>
                <p className="text-sm font-medium truncate">{uniteName}</p>
              </div>

              {/* Navigation */}
              <div className="flex-1 px-4 py-4 space-y-1">
                {/* Primary Navigation */}
                {primaryNav.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleLinkClick(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                        isActive 
                          ? "bg-white/20 text-white font-medium" 
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* Separator */}
                <Separator className="my-4 bg-white/20" />

                {/* Expandable Sections */}
                {expandableItems.map((section) => {
                  const isOpen = openSections[section.label];
                  const hasActiveChild = section.children.some(child => 
                    pathname?.startsWith(child.href)
                  );
                  
                  return (
                    <div key={section.label}>
                      <button
                        onClick={() => toggleSection(section.label)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${
                          hasActiveChild 
                            ? "bg-white/20 text-white" 
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {section.icon}
                          <span>{section.label}</span>
                        </div>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden ml-6 mt-1 space-y-1"
                          >
                            {section.children.map((child) => {
                              const isActive = pathname?.startsWith(child.href);
                              return (
                                <button
                                  key={child.href}
                                  onClick={() => handleLinkClick(child.href)}
                                  className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm ${
                                    isActive 
                                      ? "bg-white/20 text-white font-medium" 
                                      : "text-white/70 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  {child.label}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-white/20 p-4">
                {/* Help & Settings */}
                <div className="space-y-1 mb-4">
                  <button
                    onClick={() => handleLinkClick("/help")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <HelpCircle size={18} />
                    <span className="text-sm">Help Center</span>
                  </button>
                  <button
                    onClick={() => handleLinkClick("/settings")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Settings size={18} />
                    <span className="text-sm">Settings</span>
                  </button>
                </div>

                {/* User Info */}
                <div className="bg-white/10 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-medium">
                      {userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userName}</p>
                      <p className="text-xs text-white/70 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
