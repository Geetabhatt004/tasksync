import { Home, LayoutGrid, ClipboardList, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    {
      icon: <Home className="h-6 w-6" />,
      label: "Home",
      href: "/",
    },
    {
      icon: <LayoutGrid className="h-6 w-6" />,
      label: "Projects",
      href: "/projects",
    },
    {
      icon: <ClipboardList className="h-6 w-6" />,
      label: "Tasks",
      href: "/tasks",
    },
    {
      icon: <User className="h-6 w-6" />,
      label: "Profile",
      href: "/profile",
    },
  ];
  
  return (
    <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex flex-col items-center py-3 px-4",
                location === item.href ? "text-primary" : "text-gray-500"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
