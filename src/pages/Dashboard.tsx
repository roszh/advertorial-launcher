import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Globe, Copy, BarChart3 } from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  published_at: string | null;
  tags?: Array<{id: string, name: string, color: string}>;
  countrySetupName?: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [bulkSetupId, setBulkSetupId] = useState<string>("");
  const [availableCountrySetups, setAvailableCountrySetups] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchPages();
      fetchTags();
      fetchCountrySetups();
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPages = async () => {
    setLoading(true);
    const { data: pagesData, error } = await supabase
      .from("pages")
      .select(`
        *,
        page_tags (
          tags (id, name, color)
        ),
        tracking_script_sets (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading pages", description: error.message, variant: "destructive" });
    } else {
      const pagesWithTags = pagesData?.map(page => ({
        ...page,
        tags: page.page_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
        countrySetupName: page.tracking_script_sets?.name || null
      })) || [];
      setPages(pagesWithTags);
    }
    setLoading(false);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .order("name");
    setAvailableTags(data || []);
  };

  const fetchCountrySetups = async () => {
    const { data } = await supabase
      .from("tracking_script_sets")
      .select("id, name")
      .order("name");
    setAvailableCountrySetups(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Page deleted" });
      fetchPages();
    }
  };

  const handleToggleStatus = async (page: Page) => {
    const newStatus = page.status === "draft" ? "published" : "draft";
    const { error } = await supabase
      .from("pages")
      .update({
        status: newStatus,
        published_at: newStatus === "published" ? new Date().toISOString() : null
      })
      .eq("id", page.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Page ${newStatus === "published" ? "published" : "unpublished"}` });
      fetchPages();
    }
  };

  const handleClone = async (pageId: string) => {
    if (!user) return;

    // Fetch the full page data
    const { data: pageData, error: fetchError } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (fetchError || !pageData) {
      toast({ title: "Error", description: "Failed to load page data", variant: "destructive" });
      return;
    }

    // Create a new slug by appending -copy-{timestamp}
    const timestamp = Date.now();
    const newSlug = `${pageData.slug}-copy-${timestamp}`;
    const newTitle = `${pageData.title} (Copy)`;

    // Insert the cloned page
    const { data: insertResult, error: insertError } = await supabase
      .from("pages")
      .insert({
        user_id: user.id,
        title: newTitle,
        slug: newSlug,
        status: "draft",
        template: pageData.template,
        cta_style: pageData.cta_style,
        sticky_cta_threshold: pageData.sticky_cta_threshold,
        tracking_script_set_id: pageData.tracking_script_set_id,
        content: pageData.content,
        cta_text: pageData.cta_text,
        cta_url: pageData.cta_url,
        image_url: pageData.image_url,
        published_at: null
      })
      .select();

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
      return;
    }

    // Copy tags from original page
    if (insertResult && insertResult[0]) {
      const newPageId = insertResult[0].id;
      const { data: originalTags } = await supabase
        .from("page_tags")
        .select("tag_id")
        .eq("page_id", pageId);

      if (originalTags && originalTags.length > 0) {
        const newPageTags = originalTags.map(pt => ({
          page_id: newPageId,
          tag_id: pt.tag_id
        }));

        await supabase
          .from("page_tags")
          .insert(newPageTags);
      }
    }

    toast({ title: "Page cloned successfully!", description: "The copy has been saved as a draft." });
    fetchPages();
  };

  const handleBulkAssignSetup = async () => {
    if (selectedPages.length === 0) {
      toast({ title: "No pages selected", variant: "destructive" });
      return;
    }
    
    if (!bulkSetupId) {
      toast({ title: "Please select a Country Setup", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase
      .from("pages")
      .update({ tracking_script_set_id: bulkSetupId })
      .in("id", selectedPages);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: `Updated ${selectedPages.length} page${selectedPages.length > 1 ? 's' : ''}`,
        description: "Country Setup has been reassigned"
      });
      setSelectedPages([]);
      setBulkSetupId("");
      fetchPages();
    }
  };

  const filteredPages = pages.filter(p => {
    const statusMatch = filter === "all" || p.status === filter;
    const tagMatch = !selectedTag || p.tags?.some(t => t.id === selectedTag);
    return statusMatch && tagMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">My Pages</h1>
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
                All
              </Button>
              <Button variant={filter === "draft" ? "default" : "outline"} onClick={() => setFilter("draft")}>
                Drafts
              </Button>
              <Button variant={filter === "published" ? "default" : "outline"} onClick={() => setFilter("published")}>
                Published
              </Button>
            </div>
          </div>
          
          {availableTags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by tag:</span>
              <Select value={selectedTag || "all"} onValueChange={(val) => setSelectedTag(val === "all" ? null : val)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: tag.color}} />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {selectedPages.length > 0 && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">{selectedPages.length} selected</Badge>
              <Select value={bulkSetupId} onValueChange={setBulkSetupId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select Country Setup..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCountrySetups.map(setup => (
                    <SelectItem key={setup.id} value={setup.id}>
                      {setup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleBulkAssignSetup} size="sm">
                Assign Setup
              </Button>
              <Button 
                onClick={() => setSelectedPages([])} 
                variant="ghost" 
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredPages.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No pages found. Create your first one!</p>
              <Button onClick={() => navigate("/")} className="mt-4">Create New Page</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPages([...selectedPages, page.id]);
                        } else {
                          setSelectedPages(selectedPages.filter(id => id !== page.id));
                        }
                      }}
                      className="mt-1 h-4 w-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <CardTitle>{page.title}</CardTitle>
                      <CardDescription>
                        Created {new Date(page.created_at).toLocaleString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {page.published_at && ` • Published ${new Date(page.published_at).toLocaleString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}`}
                        {page.countrySetupName && (
                          <Badge variant="outline" className="ml-2">
                            📊 {page.countrySetupName}
                          </Badge>
                        )}
                      </CardDescription>
                      {page.tags && page.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {page.tags.map(tag => (
                            <Badge 
                              key={tag.id}
                              style={{backgroundColor: tag.color, color: 'white'}}
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant={page.status === "published" ? "default" : "secondary"}>
                      {page.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {page.status === "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/p/${page.slug}`, "_blank")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/?edit=${page.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClone(page.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clone
                    </Button>
                    {page.status === "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/analytics/${page.id}`)}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(page)}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      {page.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  {page.status === "published" && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Public URL: <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {window.location.origin}/p/{page.slug}
                      </a>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}