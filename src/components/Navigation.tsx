import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, LayoutDashboard, Settings, LogOut, PlusCircle } from "lucide-react";

interface NavigationProps {
  user: any;
}

export function Navigation({ user }: NavigationProps) {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center space-x-2 mr-6">
          <FileText className="h-6 w-6" />
          <span className="font-bold">Presell Generator</span>
        </Link>
        <div className="flex items-center space-x-4 flex-1">
          <Link to="/">
            <Button variant={location.pathname === "/" ? "default" : "ghost"} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant={location.pathname === "/dashboard" ? "default" : "ghost"} size="sm">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              My Pages
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant={location.pathname === "/settings" ? "default" : "ghost"} size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
}