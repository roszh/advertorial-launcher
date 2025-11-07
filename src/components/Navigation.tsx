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
    <nav className="sticky top-0 z-50 border-b border-border/30 ios-blur">
      <div className="container flex h-11 md:h-13 items-center px-4 md:px-5">
        <Link to="/" className="flex items-center space-x-2 mr-6">
          <FileText className="h-5 w-5 text-primary" />
          <span className="ios-headline hidden sm:inline">Advertorial Launcher</span>
        </Link>
        <div className="flex items-center space-x-1 md:space-x-2 flex-1">
          <Link to="/">
            <Button 
              variant={location.pathname === "/" ? "default" : "ghost"} 
              size="sm"
              className="h-8 px-3 rounded-ios transition-all active:scale-95"
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline ios-callout">Create New</span>
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button 
              variant={location.pathname === "/dashboard" ? "default" : "ghost"} 
              size="sm"
              className="h-8 px-3 rounded-ios transition-all active:scale-95"
            >
              <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline ios-callout">My Pages</span>
            </Button>
          </Link>
          <Link to="/settings">
            <Button 
              variant={location.pathname === "/settings" ? "default" : "ghost"} 
              size="sm"
              className="h-8 px-3 rounded-ios transition-all active:scale-95"
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline ios-callout">Settings</span>
            </Button>
          </Link>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="h-8 px-3 rounded-ios transition-all active:scale-95"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline ios-callout">Logout</span>
        </Button>
      </div>
    </nav>
  );
}