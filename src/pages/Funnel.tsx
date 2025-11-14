import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Eye, TrendingDown, MousePointer, ArrowRight, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FunnelData {
  views: number;
  scroll25: number;
  scroll50: number;
  scroll75: number;
  scroll100: number;
  clicks: number;
  ctr: number;
  avgStayDuration: number;
}

interface Page {
  id: string;
  title: string;
}

export default function Funnel() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [funnelData, setFunnelData] = useState<FunnelData>({
    views: 0,
    scroll25: 0,
    scroll50: 0,
    scroll75: 0,
    scroll100: 0,
    clicks: 0,
    ctr: 0,
    avgStayDuration: 0,
  });
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
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPages(data);
        setFilteredPages(data);
        setSelectedPageId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPages(pages);
    } else {
      const filtered = pages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPages(filtered);
    }
  }, [searchQuery, pages]);

  useEffect(() => {
    if (selectedPageId) {
      fetchFunnelData();
    }
  }, [selectedPageId]);

  const fetchFunnelData = async () => {
    if (!selectedPageId) return;

    try {
      // Fetch all analytics data for the page
      const { data: analyticsData, error } = await supabase
        .from("page_analytics")
        .select("event_type, scroll_depth")
        .eq("page_id", selectedPageId);

      if (error) throw error;

      // Calculate funnel metrics
      const views = analyticsData?.filter(e => e.event_type === 'view').length || 0;
      const scroll25 = analyticsData?.filter(e => e.event_type === 'scroll' && e.scroll_depth === 25).length || 0;
      const scroll50 = analyticsData?.filter(e => e.event_type === 'scroll' && e.scroll_depth === 50).length || 0;
      const scroll75 = analyticsData?.filter(e => e.event_type === 'scroll' && e.scroll_depth === 75).length || 0;
      const scroll100 = analyticsData?.filter(e => e.event_type === 'scroll' && e.scroll_depth === 100).length || 0;
      const clicks = analyticsData?.filter(e => e.event_type === 'click').length || 0;

      // Calculate CTR
      const ctr = views > 0 ? (clicks / views) * 100 : 0;

      // Fetch session data for stay duration
      const { data: sessionData } = await supabase
        .from("page_sessions")
        .select("first_seen, last_seen")
        .eq("page_id", selectedPageId);

      // Calculate average stay duration in seconds
      let avgStayDuration = 0;
      if (sessionData && sessionData.length > 0) {
        const durations = sessionData
          .filter(s => s.first_seen && s.last_seen)
          .map(s => {
            const first = new Date(s.first_seen).getTime();
            const last = new Date(s.last_seen).getTime();
            return (last - first) / 1000; // Convert to seconds
          })
          .filter(d => d > 0 && d < 3600); // Filter out invalid durations (0 or > 1 hour)

        if (durations.length > 0) {
          avgStayDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        }
      }

      setFunnelData({
        views,
        scroll25,
        scroll50,
        scroll75,
        scroll100,
        clicks,
        ctr,
        avgStayDuration,
      });
    } catch (error) {
      console.error("Error fetching funnel data:", error);
    }
  };

  const calculateConversionRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return (current / previous) * 100;
  };

  const calculateDropOffRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((previous - current) / previous) * 100;
  };

  const FunnelStage = ({ 
    title, 
    count, 
    previousCount, 
    icon: Icon,
    isLast = false 
  }: { 
    title: string; 
    count: number; 
    previousCount: number; 
    icon: any;
    isLast?: boolean;
  }) => {
    const conversionRate = calculateConversionRate(count, previousCount);
    const dropOffRate = calculateDropOffRate(count, previousCount);
    const widthPercentage = previousCount > 0 ? (count / previousCount) * 100 : 100;

    return (
      <div className="relative">
        <div 
          className="mx-auto transition-all duration-300"
          style={{ 
            width: `${Math.max(widthPercentage, 20)}%`,
            minWidth: '200px'
          }}
        >
          <Card className="relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"
              style={{ opacity: widthPercentage / 100 }}
            />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {count}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {previousCount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium text-green-600">
                        {conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    {dropOffRate > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Drop-off Rate</span>
                        <span className="font-medium text-destructive">
                          {dropOffRate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {!isLast && (
          <div className="flex justify-center py-3">
            <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="ios-large-title mb-1">Conversion Funnel</h1>
            <p className="ios-body text-muted-foreground">
              Track user journey from page view to conversion
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>No Published Pages</CardTitle>
              <CardDescription>
                You need to publish at least one page to see funnel analytics.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto px-4 md:px-5 py-6 md:py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="ios-large-title mb-1">Funnel Analytics</h1>
          <p className="ios-body text-muted-foreground">
            Track user journey from page view to conversion
          </p>
        </div>

        {/* Top Metrics Row */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{funnelData.views}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{funnelData.clicks}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Page CTR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{funnelData.ctr.toFixed(2)}%</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Stay Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{formatDuration(funnelData.avgStayDuration)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Page Selector with Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Select Page</CardTitle>
            <CardDescription>Choose a page to analyze its conversion funnel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedPageId} onValueChange={setSelectedPageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                {filteredPages.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No pages found
                  </div>
                ) : (
                  filteredPages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Funnel Visualization - Two Columns */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-0">
            <FunnelStage
              title="Page View"
              count={funnelData.views}
              previousCount={funnelData.views}
              icon={Eye}
            />
            
            <FunnelStage
              title="Scrolled 25%"
              count={funnelData.scroll25}
              previousCount={funnelData.views}
              icon={TrendingDown}
            />
            
            <FunnelStage
              title="Scrolled 50%"
              count={funnelData.scroll50}
              previousCount={funnelData.scroll25 || funnelData.views}
              icon={TrendingDown}
              isLast={true}
            />
          </div>

          <div className="space-y-0">
            <FunnelStage
              title="Scrolled 75%"
              count={funnelData.scroll75}
              previousCount={funnelData.scroll50 || funnelData.views}
              icon={TrendingDown}
            />
            
            <FunnelStage
              title="Scrolled 100%"
              count={funnelData.scroll100}
              previousCount={funnelData.scroll75 || funnelData.views}
              icon={TrendingDown}
            />
            
            <FunnelStage
              title="CTA Click"
              count={funnelData.clicks}
              previousCount={funnelData.views}
              icon={MousePointer}
              isLast={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
