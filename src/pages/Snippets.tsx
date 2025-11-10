import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash2, Copy, Search, Filter, ArrowUp, ArrowDown, FileText, BookMarked, Loader2 } from "lucide-react";
import { SnippetEditor } from "@/components/SnippetEditor";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Snippet {
  id: string;
  name: string;
  description: string | null;
  sections: any[];
  tags: Tag[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function Snippets() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [sortBy, setSortBy] = useState<"created" | "updated" | "name">("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchSnippets();
      fetchTags();
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchSnippets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading snippets", description: error.message, variant: "destructive" });
    } else {
      const typedSnippets = (data || []).map(item => ({
        ...item,
        sections: item.sections as any[],
        tags: (item.tags as unknown) as Tag[] | null
      }));
      setSnippets(typedSnippets);
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

  const handleDelete = async () => {
    if (!snippetToDelete) return;

    setDeleting(snippetToDelete.id);
    const { error } = await supabase
      .from("snippets")
      .delete()
      .eq("id", snippetToDelete.id);

    setDeleting(null);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Snippet deleted successfully" });
      fetchSnippets();
    }
    setDeleteDialogOpen(false);
    setSnippetToDelete(null);
  };

  const handleClone = async (snippet: Snippet) => {
    setCloning(snippet.id);
    const { data, error } = await supabase
      .from("snippets")
      .insert({
        user_id: user.id,
        name: `${snippet.name} (Copy)`,
        description: snippet.description,
        sections: snippet.sections as any,
        tags: snippet.tags as any
      })
      .select();

    setCloning(null);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Snippet cloned successfully" });
      fetchSnippets();
    }
  };

  const handleUseInPage = (snippet: Snippet) => {
    // Store snippet data in sessionStorage and navigate to index
    sessionStorage.setItem('loadSnippet', JSON.stringify(snippet));
    navigate('/');
  };

  const filteredSnippets = snippets.filter(snippet => {
    const searchMatch = !searchQuery || 
      snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (snippet.description && snippet.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const tagMatch = selectedTags.length === 0 || 
      (snippet.tags && snippet.tags.some(t => selectedTags.includes(t.id)));
    
    return searchMatch && tagMatch;
  });

  const sortedSnippets = [...filteredSnippets].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "created":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "updated":
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getSectionCount = (sections: any): number => {
    if (!sections) return 0;
    if (Array.isArray(sections)) return sections.length;
    try {
      const parsed = JSON.parse(sections);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookMarked className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Content Snippets Library</h1>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Filter by Tags</h4>
                  {availableTags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag.id]);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== tag.id));
                          }
                        }}
                      />
                      <Badge style={{ backgroundColor: tag.color }}>{tag.name}</Badge>
                    </div>
                  ))}
                  {selectedTags.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedTags([])}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
          
          {(searchQuery || selectedTags.length > 0) && (
            <div className="text-sm text-muted-foreground">
              Showing {sortedSnippets.length} of {snippets.length} snippets
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading snippets...</div>
          </div>
        ) : sortedSnippets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No snippets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedTags.length > 0
                  ? "Try adjusting your filters"
                  : "Create your first snippet from the page editor"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSnippets.map(snippet => (
              <Card key={snippet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{snippet.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {snippet.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{getSectionCount(snippet.sections)} sections</span>
                  </div>
                  
                  {snippet.tags && snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {snippet.tags.map((tag: Tag) => (
                        <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(snippet.updated_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => handleUseInPage(snippet)}
                        >
                          Use in Page
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Load snippet sections into page editor</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSnippet(snippet)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit snippet details and sections</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClone(snippet)}
                          disabled={cloning === snippet.id}
                        >
                          {cloning === snippet.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create a copy of this snippet</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSnippetToDelete(snippet);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={deleting === snippet.id}
                        >
                          {deleting === snippet.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete this snippet permanently</TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editingSnippet && (
        <SnippetEditor
          snippet={editingSnippet}
          availableTags={availableTags}
          onClose={() => setEditingSnippet(null)}
          onSave={() => {
            setEditingSnippet(null);
            fetchSnippets();
          }}
          userId={user?.id}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{snippetToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
