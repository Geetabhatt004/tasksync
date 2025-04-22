import { cn } from "@/lib/utils";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Home, ClipboardList, LayoutGrid, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      icon: <Home className="h-5 w-5 mr-3" />,
      href: "/",
    },
    {
      label: "My Projects",
      icon: <LayoutGrid className="h-5 w-5 mr-3" />,
      href: "/projects",
    },
    {
      label: "My Tasks",
      icon: <ClipboardList className="h-5 w-5 mr-3" />,
      href: "/tasks",
    },
    {
      label: "Calendar",
      icon: <Calendar className="h-5 w-5 mr-3" />,
      href: "/calendar",
    },
    {
      label: "Team Members",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/team",
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className={cn("flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm", className)}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-primary rounded-lg p-2 mr-3">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">TaskFlow</h1>
        </div>
      </div>
      
      <nav className="flex-grow p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center px-4 py-3 rounded-md",
                location === item.href
                  ? "text-gray-700 bg-gray-100"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {item.icon}
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Avatar className="w-10 h-10 rounded-full mr-3">
            <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto text-gray-400 hover:text-gray-600"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
