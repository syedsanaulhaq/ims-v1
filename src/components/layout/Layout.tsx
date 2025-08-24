
import React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from './Navbar';
import AppSidebar from './AppSidebar';

interface LayoutProps {
  children: React.ReactNode;
  limitedSidebar?: boolean;
}

const Layout = ({ children, limitedSidebar = false }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar limitedMenu={limitedSidebar} />
        <SidebarInset className="flex-1">
          <div className="flex flex-col h-full">
            <Navbar />
            <main className="flex-1 bg-white">
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
