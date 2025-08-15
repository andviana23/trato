"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Menu as MenuIcon,
  Search,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  HelpCircle,
  Settings,
  ListOrdered,
  Users,
  MoreHorizontal,
  Calendar,
} from "lucide-react";

type SimpleItem = { label: string; href: string; icon: React.ReactNode };
type ChildItem = { label: string; href: string };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();
  React.useEffect(() => { /* ensure theme resolved on mount */ }, []);
  const isDark = resolvedTheme === "dark";
  const pathname = usePathname();
  const [openCad, setOpenCad] = useState(false);
  const [openAssin, setOpenAssin] = useState(false);
  const [openDist, setOpenDist] = useState(false);
  const [openRel, setOpenRel] = useState(false);

  const userName = (typeof window !== "undefined" && localStorage.getItem("user_name")) || "John Doe";
  const userEmail = (typeof window !== "undefined" && localStorage.getItem("user_email")) || "john@company.com";

  const primaryNav: SimpleItem[] = [
    { label: "Agenda", href: "/agenda", icon: <Calendar size={18} /> },
    { label: "Lista da Vez", href: "/lista-da-vez", icon: <ListOrdered size={18} /> },
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Relatórios", href: "/relatorios/principal", icon: <BarChart3 size={18} /> },
  ];

  const cadastrosChildren: ChildItem[] = [
    { label: "Clientes", href: "/clientes" },
    { label: "Profissionais", href: "/cadastros/profissionais" },
    { label: "Serviços", href: "/cadastros/servicos" },
    { label: "Produtos", href: "/cadastros/produtos" },
    { label: "Metas", href: "/cadastros/metas-trato" },
  ];

  const assinaturasChildren: ChildItem[] = [
    { label: "Dashboard", href: "/assinaturas/dashboard" },
    { label: "Planos", href: "/assinaturas/planos" },
    { label: "Assinantes", href: "/assinaturas/assinantes" },
  ];

  const distribuicaoChildren: ChildItem[] = [
    { label: "Faturamento da Assinatura", href: "/dashboard/distribuicao/faturamento-assinatura" },
    { label: "Lançamento de Assinatura", href: "/dashboard/distribuicao/lancamento-assinatura" },
    { label: "Lançamento de Serviço", href: "/dashboard/distribuicao/lancamento-servico" },
    { label: "Produtos", href: "/dashboard/distribuicao/produtos" },
    { label: "Comissão", href: "/dashboard/distribuicao/comissao" },
    { label: "Comissão Avulsa", href: "/dashboard/distribuicao/comissao-avulsa" },
  ];

  const relatoriosChildren: ChildItem[] = [
    { label: "Painel Principal", href: "/relatorios/principal" },
    { label: "Painel Agenda", href: "/relatorios/agenda" },
    { label: "Painel Financeiro", href: "/relatorios/financeiro" },
    { label: "Avançados", href: "/relatorios/avancados" },
  ];

  const isAgenda = pathname?.startsWith('/agenda');

  return (
    <div className="flex">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-screen w-[264px] bg-[#0f1115] text-white border-r border-white/20 overflow-y-auto px-4 py-4" aria-label="Primary">
        <div className="flex flex-col gap-4 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-1">
            <span className="bg-white/30 w-7 h-7 rounded-full" />
            <span className="font-bold">Logo</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Input aria-label="Buscar na navegação" placeholder="Search" className="pl-7 bg-white/20 border-white/20 placeholder:text-white/70" />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70">
                <Search size={14} />
            </span>
          </div>

          {/* Primary nav */}
          <div className="flex flex-col gap-1 mt-1">
            {primaryNav.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-2 py-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 ${active ? "bg-white/20" : "hover:bg-white/20"}`}>
                  <span>{item.icon}</span>
                  <span className={`text-sm ${active ? "font-semibold" : ""}`}>{item.label}</span>
                </Link>
              );
            })}

            {/* Cadastros */}
            <button className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/20" aria-expanded={openCad} onClick={() => setOpenCad((v) => !v)} aria-controls="cadastros-subnav">
              <div className="flex items-center gap-3"><Users size={18} /><span className="text-sm">Cadastros</span></div>
              {openCad ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {openCad && (
              <div id="cadastros-subnav" className="flex flex-col gap-1 pl-8 py-1">
                  {cadastrosChildren.map((child) => {
                    const active = pathname?.startsWith(child.href);
                    return (
                    <Link key={child.href} href={child.href} className={`px-2 py-1.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 ${active ? "bg-white/20" : "hover:bg-white/20"}`}>
                      <span className={`text-sm ${active ? "font-semibold" : ""}`}>{child.label}</span>
                      </Link>
                    );
                  })}
              </div>
            )}

            {/* Assinaturas */}
            <button className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/20" aria-expanded={openAssin} onClick={() => setOpenAssin((v) => !v)} aria-controls="assinaturas-subnav">
              <div className="flex items-center gap-3"><BarChart3 size={18} /><span className="text-sm">Assinaturas</span></div>
              {openAssin ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {openAssin && (
              <div id="assinaturas-subnav" className="flex flex-col gap-1 pl-8 py-1">
                  {assinaturasChildren.map((child) => {
                    const active = pathname?.startsWith(child.href);
                    return (
                    <Link key={child.href} href={child.href} className={`px-2 py-1.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 ${active ? "bg-white/20" : "hover:bg-white/20"}`}>
                      <span className={`text-sm ${active ? "font-semibold" : ""}`}>{child.label}</span>
                      </Link>
                    );
                  })}
              </div>
            )}

            {/* Distribuição */}
            <button className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/20" aria-expanded={openDist} onClick={() => setOpenDist((v) => !v)} aria-controls="distribuicao-subnav">
              <div className="flex items-center gap-3"><BarChart3 size={18} /><span className="text-sm">Distribuição</span></div>
              {openDist ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {openDist && (
              <div id="distribuicao-subnav" className="flex flex-col gap-1 pl-8 py-1">
                  {distribuicaoChildren.map((child) => {
                    const active = pathname?.startsWith(child.href);
                    return (
                    <Link key={child.href} href={child.href} className={`px-2 py-1.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 ${active ? "bg-white/20" : "hover:bg-white/20"}`}>
                      <span className={`text-sm ${active ? "font-semibold" : ""}`}>{child.label}</span>
                      </Link>
              );
            })}
              </div>
            )}

            {/* Relatórios */}
            <button className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/20" aria-expanded={openRel} onClick={() => setOpenRel((v) => !v)} aria-controls="relatorios-subnav">
              <div className="flex items-center gap-3"><BarChart3 size={18} /><span className="text-sm">Relatórios</span></div>
              {openRel ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {openRel && (
              <div id="relatorios-subnav" className="flex flex-col gap-1 pl-8 py-1">
                {relatoriosChildren.map((child) => {
                  const active = pathname?.startsWith(child.href);
                  return (
                    <Link key={child.href} href={child.href} className={`px-2 py-1.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 ${active ? "bg-white/20" : "hover:bg-white/20"}`}>
                      <span className={`text-sm ${active ? "font-semibold" : ""}`}>{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <Separator className="my-3 bg-white/20" />
            <div className="flex flex-col gap-1">
              <Link href="/help" className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/20"><HelpCircle size={18} /><span className="text-sm">Help Center</span></Link>
              <Link href="/settings" className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/20"><Settings size={18} /><span className="text-sm">Settings</span></Link>
            </div>

            <Card className="mt-3 bg-white/10 border-white/20">
              <CardContent className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/30 grid place-items-center text-xs">{userName.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-medium">{userName}</div>
                    <div className="text-xs text-white/70">{userEmail}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="User menu"><MoreHorizontal size={16} /></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="pl-[264px] w-full">
        <header className={`sticky top-0 z-10 border-b ${isDark ? "bg-gray-900" : "bg-white"} border-white/20`}>
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu"><MenuIcon size={18} /></Button>
              <div className="relative w-[220px] md:w-[360px]">
                <Input aria-label="Search global" placeholder="Search" className="pl-7" />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"><Search size={14} /></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-md bg-white/20 text-xs mr-2">
                {typeof window !== 'undefined' && (localStorage.getItem('tb.unidade_nome') || 'Unidade não selecionada')}
              </div>
              <Button variant="ghost" size="sm" aria-label="Toggle theme" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                {isDark ? '🌙' : '☀️'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-white/30 grid place-items-center text-xs" aria-label="Abrir menu do usuário">J</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Meu Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    try { document.cookie = `tb.unidade=; Path=/; Max-Age=0`; } catch {}
                    try { localStorage.clear(); sessionStorage.clear(); } catch {}
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' });
                    } catch {}
                    window.location.assign('/auth/login');
                  }}>Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className={`${isAgenda ? 'px-0 py-0 overflow-hidden h-[100dvh]' : 'px-6 py-6'}`}>
          {isAgenda ? (
            <div className="w-full min-h-0 overflow-hidden">{children}</div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              <Card>
                <CardContent className="p-4">
                  {children ?? (
                    <div className="flex flex-col gap-3">
                      <div className="text-lg font-bold">Demo content</div>
                      <div className="text-muted-foreground">Este é um wire do AppShell (sidebar + header + content). Substitua este conteúdo pela sua página.</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
