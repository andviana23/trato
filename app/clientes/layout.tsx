"use client";
import { useState, ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MainContainer from "@/components/layout/MainContainer";

interface ClientesLayoutProps {
  children: ReactNode;
}

export default function ClientesLayout({ children }: ClientesLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-800">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Main Container */}
        <MainContainer isCollapsed={isCollapsed}>
          {children}
        </MainContainer>
      </div>
    </div>
  );
} 
