import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test backend connectivity
        const { error } = await supabase.from('pages').select('count', { count: 'exact', head: true });
        if (!error) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (err) {
        console.error('Connection check failed:', err);
        setConnectionStatus('disconnected');
      }
    };

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) navigate("/");
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };

    checkConnection();
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent, retryCount = 0) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Handle specific error cases
          if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
            throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
          }
          throw error;
        }
        toast({ title: "Welcome back!" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName }
          }
        });
        if (error) {
          if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
            throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
          }
          throw error;
        }
        toast({ title: "Account created! You can now log in." });
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Retry logic for network errors
      if ((error.message.includes('fetch') || error.message.includes('network')) && retryCount < 2) {
        toast({ 
          title: "Connection issue", 
          description: `Retrying... (${retryCount + 1}/2)`,
        });
        setTimeout(() => {
          handleAuth(e, retryCount + 1);
        }, 1500);
        return;
      }
      
      toast({ 
        title: "Authentication Error", 
        description: error.message || "An unexpected error occurred", 
        variant: "destructive" 
      });
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              {connectionStatus === 'checking' && (
                <span className="text-muted-foreground">Checking connection...</span>
              )}
              {connectionStatus === 'connected' && (
                <span className="text-green-600 flex items-center gap-1">
                  <Wifi className="h-4 w-4" /> Connected
                </span>
              )}
              {connectionStatus === 'disconnected' && (
                <span className="text-destructive flex items-center gap-1">
                  <WifiOff className="h-4 w-4" /> Offline
                </span>
              )}
            </div>
          </div>
          <CardDescription>
            {isLogin ? "Log in to manage your pages" : "Sign up to start creating"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus === 'disconnected' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to connect to the backend. Please check your internet connection or try again later.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Log In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}