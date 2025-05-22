import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/conversations", label: "Conversations", icon: "forum" },
    { href: "/inventory", label: "Inventory", icon: "directions_car" },
    { href: "/personas", label: "Personas", icon: "people" },
    { href: "/analytics", label: "Analytics", icon: "analytics" },
    { href: "/settings", label: "Settings", icon: "settings" },
    { href: "/prompt-testing", label: "Prompt Testing", icon: "psychology" },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-md transform drawer-transition lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white">
            <span className="material-icons text-sm">smart_toy</span>
          </div>
          <h1 className="text-xl font-medium text-primary">Rylie AI</h1>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-neutral-500 rounded-full hover:bg-neutral-100 lg:hidden"
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 rounded-md group",
              location === item.href
                ? "text-primary bg-primary/5"
                : "text-neutral-700 hover:bg-neutral-100"
            )}
          >
            <span className="material-icons mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
            <span className="material-icons text-neutral-600">person</span>
          </div>
          <div>
            <p className="text-sm font-medium">Alex Johnson</p>
            <p className="text-xs text-neutral-500">Administrator</p>
          </div>
          <button className="p-1 ml-auto text-neutral-500 rounded-full hover:bg-neutral-100">
            <span className="material-icons text-sm">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
