'use client';
import Sidebar from '@/components/layout/Sidebar';
import { useState } from 'react';

export default function CadastrosLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  return (
    <div className="flex min-h-screen">
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <div className="flex-1 bg-gray-50">{children}</div>
    </div>
  );
} 
