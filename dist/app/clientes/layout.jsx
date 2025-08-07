"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MainContainer from "@/components/layout/MainContainer";
export default function ClientesLayout({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };
    return (<div className="flex h-screen bg-gray-50 dark:bg-gray-800">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar}/>
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Main Container */}
        <MainContainer isCollapsed={isCollapsed}>
          {children}
        </MainContainer>
      </div>
    </div>);
}
