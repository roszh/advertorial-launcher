import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Globe, Copy, BarChart3, Search, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  content: any;
  tags?: Array<{id: string, name: string, color: string}>;
  countrySetupName?: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [bulkSetupId, setBulkSetupId] = useState<string>("");
  const [availableCountrySetups, setAvailableCountrySetups] = useState<Array<{id: string, name: string}>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined });
  const [sortBy, setSortBy] = useState<"created" | "updated" | "title" | "status">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    const tagMatch = selectedTags.length === 0 || p.tags?.some(t => selectedTags.includes(t.id));
    
    // Search across title, slug, and content
    const searchMatch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(p.content).toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter
    const dateMatch = !dateRange.from || 
      (new Date(p.created_at) >= dateRange.from && 
       (!dateRange.to || new Date(p.created_at) <= dateRange.to));
    
    return statusMatch && tagMatch && searchMatch && dateMatch;
  });

  // Sort filtered pages
  const sortedPages = [...filteredPages].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "created":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "updated":
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
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
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search pages by title, slug, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and Sorting Row */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="updated">Updated Date</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Created:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {dateRange.from && (
                <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Multi-Tag Filter */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filter by tags:</span>
              {availableTags.map(tag => (
                <Badge
                  key={tag.id}
                  style={{
                    backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                    color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                    borderColor: tag.color,
                    cursor: 'pointer'
                  }}
                  className="border-2"
                  onClick={() => {
                    if (selectedTags.includes(tag.id)) {
                      setSelectedTags(selectedTags.filter(id => id !== tag.id));
                    } else {
                      setSelectedTags([...selectedTags, tag.id]);
                    }
                  }}
                >
                  {tag.name}
                  {selectedTags.includes(tag.id) && " ✓"}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])}>
                  Clear tags
                </Button>
              )}
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
        ) : sortedPages.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No pages found. Create your first one!</p>
              <Button onClick={() => navigate("/")} className="mt-4">Create New Page</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedPages.map((page) => (
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