
import React from 'react';
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import UserInfo from "@/components/common/UserInfo";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import UserProfileDropdown from "@/components/ui/UserProfileDropdown";
import { 
  Download,
  Bell,
  Mail,
  Moon,
  User
} from "lucide-react";

const Navbar = () => {
  const { toast } = useToast();

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Preparing comprehensive data export... Please check Reports section for detailed exports."
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4">
        
        {/* Left Section - Sidebar Trigger & Title */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-gray-600 hover:bg-gray-100" />
          <div className="flex items-center space-x-2">
            <div className="w-2 h-6 bg-teal-600"></div>
            <h1 className="text-xl font-semibold text-gray-800">Inventory Management System</h1>
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-4">
          
          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* Messages */}
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Mail className="w-5 h-5" />
          </button>

          {/* Dark Mode Toggle */}
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Moon className="w-5 h-5" />
          </button>

          {/* Export Button */}
          <Button 
            onClick={handleExportData} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          {/* User Profile Dropdown */}
          <UserProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
