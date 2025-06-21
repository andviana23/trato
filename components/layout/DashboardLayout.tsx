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
  const handleMobileClose = () => setMobileSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-800">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header
          isCollapsed={isCollapsed}
          onMobileMenu={() => setMobileSidebarOpen(true)}
        />
        <MainContainer isCollapsed={isCollapsed}>
          {children}
        </MainContainer>
      </div>
    </div>
  );
} 
