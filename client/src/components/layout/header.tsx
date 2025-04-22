import { useState } from "react";
import { Search, Bell, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const [hasNotifications] = useState(true);
  
  return (
    <header className="flex items-center bg-white h-16 px-6 border-b border-gray-200 z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden text-gray-600"
        onClick={onOpenMobileSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <div className="relative ml-auto flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Bell className="h-6 w-6" />
            {hasNotifications && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </Button>
        </div>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="relative hidden sm:block">
          <Input
            type="text"
            placeholder="Search..."
            className="py-2 pl-10 pr-4 w-64"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>
    </header>
  );
}
