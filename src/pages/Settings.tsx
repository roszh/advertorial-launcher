import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { PagesUsingSetup } from "@/components/PagesUsingSetup";
import { ImageLibrary } from "@/components/ImageLibrary";
import { cn } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  
  // Country Setup state
  const [countrySetups, setCountrySetups] = useState<Array<{
    id: string;
    name: string;
    google_analytics_id: string | null;
    facebook_pixel_id: string | null;
    triplewhale_token: string | null;
    microsoft_clarity_id: string | null;
  }>>([]);
  const [editingSetup, setEditingSetup] = useState<string | null>(null);
  const [editingSetupData, setEditingSetupData] = useState<{
    name: string;
    google_analytics_id: string;
    facebook_pixel_id: string;
    triplewhale_token: string;
    microsoft_clarity_id: string;
  } | null>(null);
  const [newSetupName, setNewSetupName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
      loadCountrySetups(session.user.id);
      loadTags(session.user.id);
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
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    
    if (data) {
      setFullName(data.full_name || "");
    }
  };

  const loadCountrySetups = async (userId: string) => {
    const { data } = await supabase
      .from("tracking_script_sets")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    
    if (data) {
      setCountrySetups(data);
    }
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
        full_name: fullName
      })
      .eq("id", user?.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
    }
    setLoading(false);
  };

  const handleCreateCountrySetup = async () => {
    if (!newSetupName.trim() || !user) {
      toast({ title: "Please enter a country setup name", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("tracking_script_sets")
      .insert({
        user_id: user.id,
        name: newSetupName.trim(),
        google_analytics_id: null,
        facebook_pixel_id: null,
        triplewhale_token: null,
        microsoft_clarity_id: null
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Country Setup created!" });
      setNewSetupName("");
      loadCountrySetups(user.id);
    }
  };

  const handleUpdateCountrySetup = async (setupId: string) => {
    if (!editingSetupData || !user) return;

    const { error } = await supabase
      .from("tracking_script_sets")
      .update({
        name: editingSetupData.name,
        google_analytics_id: editingSetupData.google_analytics_id || null,
        facebook_pixel_id: editingSetupData.facebook_pixel_id || null,
        triplewhale_token: editingSetupData.triplewhale_token || null,
        microsoft_clarity_id: editingSetupData.microsoft_clarity_id || null,
      })
      .eq("id", setupId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Country Setup updated!" });
      setEditingSetup(null);
      setEditingSetupData(null);
      loadCountrySetups(user.id);
    }
  };

  const handleDeleteCountrySetup = async (setupId: string) => {
    if (!user) return;

    // Check if any pages are using this setup
    const { data: pagesUsingSetup } = await supabase
      .from("pages")
      .select("id, title")
      .eq("tracking_script_set_id", setupId)
      .limit(5);

    if (pagesUsingSetup && pagesUsingSetup.length > 0) {
      const pageNames = pagesUsingSetup.map(p => p.title).join(", ");
      toast({ 
        title: "Cannot delete Country Setup", 
        description: `This setup is being used by: ${pageNames}. Please reassign those pages first.`,
        variant: "destructive" 
      });
      return;
    }

    if (!confirm("Delete this Country Setup? This cannot be undone.")) return;

    const { error } = await supabase
      .from("tracking_script_sets")
      .delete()
      .eq("id", setupId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Country Setup deleted" });
      loadCountrySetups(user.id);
    }
  };

  const startEditingSetup = (setup: typeof countrySetups[0]) => {
    setEditingSetup(setup.id);
    setEditingSetupData({
      name: setup.name,
      google_analytics_id: setup.google_analytics_id || "",
      facebook_pixel_id: setup.facebook_pixel_id || "",
      triplewhale_token: setup.triplewhale_token || "",
      microsoft_clarity_id: setup.microsoft_clarity_id || "",
    });
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
      <div className="container mx-auto px-4 md:px-5 py-6 md:py-8 max-w-2xl">
        {/* iOS Large Title */}
        <h1 className="ios-large-title mb-8">Settings</h1>
        
        <Card className="ios-card mb-6">
          <CardHeader>
            <CardTitle className="ios-title3">Profile Information</CardTitle>
            <CardDescription className="ios-subheadline">Update your account details</CardDescription>
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

        <Card className="ios-card mb-6">
          <CardHeader>
            <CardTitle className="ios-title3">Country Setups</CardTitle>
            <CardDescription className="ios-subheadline">
              Create multiple tracking script configurations for different countries or traffic sources. 
              Each page must be assigned to one Country Setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Create New Country Setup */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-3">Create New Country Setup</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Country Setup Name (e.g., Bulgarian Traffic)"
                  value={newSetupName}
                  onChange={(e) => setNewSetupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCountrySetup()}
                />
                <Button onClick={handleCreateCountrySetup}>Create</Button>
              </div>
            </div>

            {/* Existing Country Setups */}
            <div className="space-y-3">
              <h3 className="font-semibold">Your Country Setups ({countrySetups.length})</h3>
              
              {countrySetups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Country Setups yet. Create your first one above!
                </p>
              ) : (
                countrySetups.map(setup => {
                  const scriptCount = [
                    setup.google_analytics_id,
                    setup.facebook_pixel_id,
                    setup.triplewhale_token,
                    setup.microsoft_clarity_id
                  ].filter(Boolean).length;
                  
                  return (
                    <Collapsible key={setup.id} open={editingSetup === setup.id}>
                      <div className={cn(
                        "border rounded-lg p-4",
                        scriptCount === 0 && "opacity-60"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{setup.name}</h4>
                              {scriptCount === 0 ? (
                                <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-600 dark:text-yellow-500">
                                  ⚠️ No scripts configured
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {scriptCount} script{scriptCount !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {scriptCount === 0 ? "Add at least one tracking script" : `Configured: ${[
                                setup.google_analytics_id && "Google Analytics",
                                setup.facebook_pixel_id && "Facebook Pixel",
                                setup.triplewhale_token && "Triple Whale",
                                setup.microsoft_clarity_id && "Clarity"
                              ].filter(Boolean).join(", ")}`}
                            </p>
                          </div>
                        <div className="flex gap-2">
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => editingSetup === setup.id ? setEditingSetup(null) : startEditingSetup(setup)}
                            >
                              {editingSetup === setup.id ? "Close" : "Edit"}
                            </Button>
                          </CollapsibleTrigger>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteCountrySetup(setup.id)}
                          >
                            Delete
                          </Button>
                          </div>
                        </div>
                        
                        <CollapsibleContent className="mt-4 space-y-3">
                        {editingSetupData && (
                          <>
                            <div className="space-y-2">
                              <Label>Country Setup Name</Label>
                              <Input
                                value={editingSetupData.name}
                                onChange={(e) => setEditingSetupData({ ...editingSetupData, name: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Google Analytics ID</Label>
                              <Input
                                placeholder="G-XXXXXXXXXX"
                                value={editingSetupData.google_analytics_id}
                                onChange={(e) => setEditingSetupData({ ...editingSetupData, google_analytics_id: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Facebook Pixel ID</Label>
                              <Input
                                placeholder="XXXXXXXXXXXXXXX"
                                value={editingSetupData.facebook_pixel_id}
                                onChange={(e) => setEditingSetupData({ ...editingSetupData, facebook_pixel_id: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Triple Whale Snippet</Label>
                              <textarea
                                placeholder="Paste your complete Triple Whale HTML snippet here"
                                value={editingSetupData.triplewhale_token}
                                onChange={(e) => setEditingSetupData({ ...editingSetupData, triplewhale_token: e.target.value })}
                                className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Microsoft Clarity ID</Label>
                              <Input
                                placeholder="xxxxxxxxxx"
                                value={editingSetupData.microsoft_clarity_id}
                                onChange={(e) => setEditingSetupData({ ...editingSetupData, microsoft_clarity_id: e.target.value })}
                              />
                            </div>

                            <Button 
                              onClick={() => handleUpdateCountrySetup(setup.id)}
                              className="w-full"
                            >
                              Save Changes
                            </Button>
                          </>
                        )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tracking Verification</CardTitle>
            <CardDescription>
              Overview of your Country Setups and which pages are using them
            </CardDescription>
          </CardHeader>
          <CardContent>
            {countrySetups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Country Setups to verify. Create one above to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {countrySetups.map(setup => {
                  const scripts = [
                    { name: "GA", active: !!setup.google_analytics_id, icon: "📊" },
                    { name: "FB", active: !!setup.facebook_pixel_id, icon: "📘" },
                    { name: "TW", active: !!setup.triplewhale_token, icon: "🐋" },
                    { name: "Clarity", active: !!setup.microsoft_clarity_id, icon: "🔍" }
                  ];
                  const activeCount = scripts.filter(s => s.active).length;
                  
                  return (
                    <div key={setup.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {setup.name}
                            <Badge variant={activeCount === 0 ? "destructive" : activeCount === 4 ? "default" : "secondary"}>
                              {activeCount}/4 scripts
                            </Badge>
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {setup.id.substring(0, 8)}...
                          </p>
                        </div>
                        <PagesUsingSetup setupId={setup.id} />
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {scripts.map(script => (
                          <div
                            key={script.name}
                            className={cn(
                              "text-center p-2 rounded border text-xs",
                              script.active 
                                ? "bg-green-50 border-green-200 text-green-700" 
                                : "bg-gray-50 border-gray-200 text-gray-400"
                            )}
                          >
                            <div className="text-lg mb-1">{script.icon}</div>
                            <div className="font-medium">{script.name}</div>
                            <div className="text-xs">{script.active ? "✓" : "✗"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">💡 How to Verify Tracking</p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Publish a page with a Country Setup assigned</li>
                    <li>Visit the public page (/p/your-slug)</li>
                    <li>Open browser console (F12)</li>
                    <li>Look for <code className="bg-blue-100 px-1 rounded">[Tracking]</code> logs</li>
                    <li>Verify all configured scripts loaded successfully</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Image Library</CardTitle>
            <CardDescription>Upload and manage images to reuse across all your pages</CardDescription>
          </CardHeader>
          <CardContent>
            {user && <ImageLibrary userId={user.id} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
