import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [triplewhaleToken, setTriplewhaleToken] = useState("");
  const [microsoftClarityId, setMicrosoftClarityId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, google_analytics_id, facebook_pixel_id, triplewhale_token, microsoft_clarity_id")
      .eq("id", userId)
      .single();
    
    if (data) {
      setFullName(data.full_name || "");
      setGoogleAnalyticsId(data.google_analytics_id || "");
      setFacebookPixelId(data.facebook_pixel_id || "");
      setTriplewhaleToken(data.triplewhale_token || "");
      setMicrosoftClarityId(data.microsoft_clarity_id || "");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: fullName,
        google_analytics_id: googleAnalyticsId || null,
        facebook_pixel_id: facebookPixelId || null,
        triplewhale_token: triplewhaleToken || null,
        microsoft_clarity_id: microsoftClarityId || null
      })
      .eq("id", user?.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings updated successfully" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracking Scripts</CardTitle>
            <CardDescription>Add tracking scripts to all your published pages</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                <Input
                  id="googleAnalytics"
                  placeholder="G-XXXXXXXXXX"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Google Analytics 4 measurement ID (starts with G-)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                <Input
                  id="facebookPixel"
                  placeholder="123456789012345"
                  value={facebookPixelId}
                  onChange={(e) => setFacebookPixelId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Facebook Pixel ID (15-16 digit number)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triplewhale">Triple Whale Token</Label>
                <Input
                  id="triplewhale"
                  placeholder="Your Triple Whale tracking token"
                  value={triplewhaleToken}
                  onChange={(e) => setTriplewhaleToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Triple Whale tracking token
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="microsoftClarity">Microsoft Clarity ID</Label>
                <Input
                  id="microsoftClarity"
                  placeholder="abc123def456"
                  value={microsoftClarityId}
                  onChange={(e) => setMicrosoftClarityId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Microsoft Clarity project ID
                </p>
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Tracking Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}