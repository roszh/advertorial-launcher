import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [triplewhaleToken, setTriplewhaleToken] = useState("");
  const [microsoftClarityId, setMicrosoftClarityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

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

    loadTags(userId);
  };

  const loadTags = async (userId: string) => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    
    if (data) {
      setTags(data);
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({ title: "Please enter a tag name", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("tags")
      .insert({ user_id: user?.id, name: newTagName.trim(), color: newTagColor });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tag created!" });
      setNewTagName("");
      setNewTagColor("#3b82f6");
      if (user) loadTags(user.id);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Delete this tag? It will be removed from all pages.")) return;

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tag deleted" });
      if (user) loadTags(user.id);
    }
  };

  const handleUpdateTagColor = async (tagId: string, newColor: string) => {
    const { error } = await supabase
      .from("tags")
      .update({ color: newColor })
      .eq("id", tagId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (user) loadTags(user.id);
    }
  };

  const colorPalette = [
    "#3b82f6", "#22c55e", "#ef4444", "#eab308",
    "#a855f7", "#ec4899", "#f97316", "#14b8a6"
  ];

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
                <Label htmlFor="triplewhale">Triple Whale Snippet</Label>
                <textarea
                  id="triplewhale"
                  placeholder="Paste your complete Triple Whale HTML snippet here (including <script> and <link> tags)"
                  value={triplewhaleToken}
                  onChange={(e) => setTriplewhaleToken(e.target.value)}
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Paste your complete Triple Whale "headless" HTML snippet (starts with &lt;link&gt; and &lt;script&gt; tags)
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

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Create and manage tags to organize your pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Create New Tag</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                  />
                  <div className="flex gap-1">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                        style={{ 
                          backgroundColor: color,
                          borderColor: newTagColor === color ? "hsl(var(--primary))" : "transparent"
                        }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                  <Button onClick={handleCreateTag}>Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Existing Tags</Label>
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags yet. Create your first one above!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-1">
                        <Badge 
                          style={{ backgroundColor: tag.color, color: "white" }}
                          className="cursor-pointer group relative"
                        >
                          {tag.name}
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                        <div className="flex gap-0.5">
                          {colorPalette.slice(0, 4).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color }}
                              onClick={() => handleUpdateTagColor(tag.id, color)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}