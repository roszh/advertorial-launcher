import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Globe, Copy } from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  published_at: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchPages();
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
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading pages", description: error.message, variant: "destructive" });
    } else {
      setPages(data || []);
    }
    setLoading(false);
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
    const { error: insertError } = await supabase
      .from("pages")
      .insert({
        user_id: user.id,
        title: newTitle,
        slug: newSlug,
        status: "draft",
        template: pageData.template,
        cta_style: pageData.cta_style,
        sticky_cta_threshold: pageData.sticky_cta_threshold,
        content: pageData.content,
        cta_text: pageData.cta_text,
        cta_url: pageData.cta_url,
        image_url: pageData.image_url,
        published_at: null
      });

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Page cloned successfully!", description: "The copy has been saved as a draft." });
      fetchPages();
    }
  };

  const filteredPages = pages.filter(p => filter === "all" || p.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
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
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{page.title}</CardTitle>
                      <CardDescription>
                        Created {new Date(page.created_at).toLocaleDateString()}
                        {page.published_at && ` • Published ${new Date(page.published_at).toLocaleDateString()}`}
                      </CardDescription>
                    </div>
                    <Badge variant={page.status === "published" ? "default" : "secondary"}>
                      {page.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/p/${page.slug}`, "_blank")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
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