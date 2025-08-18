"use client";

import { useMemo, useState, ReactNode } from "react";
// import Sidebar from "./Sidebar";
import Header from "./Header";
import MainContainer from "./MainContainer";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed] = useState(false);
  // const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sidebarWidthPx = useMemo(() => (isCollapsed ? 64 : 224), [isCollapsed]); // 16 -> 64px, 56 -> 224px

  // const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  // const handleMobileClose = () => setMobileSidebarOpen(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Sidebar fixa (desktop) + sidebar mobile controlada) */}
      {/* <Sidebar
        isCollapsed={isCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleMobileClose}
      /> */}

      {/* Header fixo alinhado ao lado da sidebar */}
      <div
        className="fixed top-0 right-0 z-40"
        style={{ left: sidebarWidthPx }}
      >
        <Header
          isCollapsed={isCollapsed}
          onMobileMenu={() => {/* setMobileSidebarOpen(true) */}}
        />
      </div>

      {/* Área de conteúdo: aplica margem esquerda = largura da sidebar e padding-top = altura do header */}
      <div
        className="relative h-full"
        style={{ marginLeft: sidebarWidthPx }}
      >
        <div className="pt-16 h-full flex flex-col">
          <MainContainer isCollapsed={isCollapsed}>{children}</MainContainer>
        </div>
      </div>
    </div>
  );
}
