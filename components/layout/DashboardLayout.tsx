"use client";

import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MainContainer from "./MainContainer";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-800 overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          isCollapsed={isCollapsed}
          onMobileMenu={() => setMobileSidebarOpen(true)}
        />
        <MainContainer>
          {children}
        </MainContainer>
      </div>
    </div>
  );
} 