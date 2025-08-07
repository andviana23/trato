"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MainContainer from "./MainContainer";
export default function DashboardLayout({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const handleMobileClose = () => setMobileSidebarOpen(false);
    return (<div className="flex h-screen bg-[#171717]">
      {/* Sidebar + Header unificados */}
      <div className={`flex flex-col h-screen ${isCollapsed ? 'w-16' : 'w-56'} bg-[#171717]`}>
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} mobileOpen={mobileSidebarOpen} onMobileClose={handleMobileClose} headerSlot={<Header isCollapsed={isCollapsed} onMobileMenu={() => setMobileSidebarOpen(true)} unified/>}/>
      </div>
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen bg-white dark:bg-gray-900`}>
        <MainContainer isCollapsed={isCollapsed}>
          {children}
        </MainContainer>
      </div>
    </div>);
}
