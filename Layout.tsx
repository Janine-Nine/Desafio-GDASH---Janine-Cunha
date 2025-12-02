import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Globe,
  LogOut,
  Sun,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const NavItem = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        {children}
      </div>
    </Link>
  );
};

export function Sidebar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    setLocation("/login");
  };

  return (
    <div className="flex h-full flex-col gap-4 bg-sidebar text-sidebar-foreground p-4 border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-2 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Sun className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight font-heading">GDASH</span>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1">
        <NavItem href="/" icon={LayoutDashboard}>Dashboard</NavItem>
        <NavItem href="/users" icon={Users}>Users</NavItem>
        <NavItem href="/explore" icon={Globe}>Explore API</NavItem>
      </nav>

      <div className="border-t border-sidebar-border pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 lg:block fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
         <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-sidebar text-sidebar-foreground border-sidebar-border">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-sidebar-border bg-sidebar">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 min-h-screen transition-all duration-300 ease-in-out">
        <div className="container mx-auto p-4 lg:p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
