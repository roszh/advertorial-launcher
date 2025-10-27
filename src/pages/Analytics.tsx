import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, Eye, MousePointer } from "lucide-react";

interface AnalyticsSummary {
  total_views: number;
  total_clicks: number;
  ctr_percentage: number;
}

interface DailyStats {
  date: string;
  views: number;
  clicks: number;
}

interface ElementStats {
  element_id: string;
  click_count: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const [summary, setSummary] = useState<AnalyticsSummary>({ 
    total_views: 0, 
    total_clicks: 0, 
    ctr_percentage: 0 
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [elementStats, setElementStats] = useState<ElementStats[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchAnalytics();
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate, pageId]);

  const fetchAnalytics = async () => {
    if (!pageId) return;
    
    setLoading(true);
    
    // Fetch page info
    const { data: pageData, error: pageError } = await supabase
      .from("pages")
      .select("title")
      .eq("id", pageId)
      .single();

    if (pageError) {
      toast({ title: "Error", description: pageError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setPageTitle(pageData.title);

    // Fetch summary from view
    const { data: summaryData, error: summaryError } = await supabase
      .from("page_analytics_summary")
      .select("*")
      .eq("page_id", pageId)
      .single();

    if (!summaryError && summaryData) {
      setSummary({
        total_views: summaryData.total_views || 0,
        total_clicks: summaryData.total_clicks || 0,
        ctr_percentage: summaryData.ctr_percentage || 0
      });
    }

    // Fetch daily stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analyticsData, error: analyticsError } = await supabase
      .from("page_analytics")
      .select("event_type, created_at")
      .eq("page_id", pageId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (!analyticsError && analyticsData) {
      // Group by date
      const statsByDate: { [key: string]: { views: number; clicks: number } } = {};
      
      analyticsData.forEach(event => {
        const date = new Date(event.created_at).toLocaleDateString();
        if (!statsByDate[date]) {
          statsByDate[date] = { views: 0, clicks: 0 };
        }
        if (event.event_type === 'view') {
          statsByDate[date].views++;
        } else if (event.event_type === 'click') {
          statsByDate[date].clicks++;
        }
      });

      const dailyStatsArray = Object.entries(statsByDate).map(([date, stats]) => ({
        date,
        views: stats.views,
        clicks: stats.clicks
      }));

      setDailyStats(dailyStatsArray);
    }

    // Fetch clicks by element
    const { data: elementData, error: elementError } = await supabase
      .from("page_analytics")
      .select("element_id")
      .eq("page_id", pageId)
      .eq("event_type", "click");

    if (!elementError && elementData) {
      const elementCounts: { [key: string]: number } = {};
      
      elementData.forEach(event => {
        const elementId = event.element_id || "untracked";
        elementCounts[elementId] = (elementCounts[elementId] || 0) + 1;
      });

      const elementStatsArray = Object.entries(elementCounts)
        .map(([element_id, click_count]) => ({
          element_id,
          click_count
        }))
        .sort((a, b) => b.click_count - a.click_count);

      setElementStats(elementStatsArray);
    }

    setLoading(false);
  };

  const getElementLabel = (elementId: string): string => {
    if (elementId === "sticky_button") return "Sticky Button";
    if (elementId === "final_cta") return "Final CTA (Footer)";
    if (elementId.startsWith("button")) {
      const num = elementId.replace("button", "");
      return `Button ${num} (Section CTA)`;
    }
    if (elementId === "untracked") return "Untracked Clicks";
    return elementId;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground mb-6">{pageTitle}</p>

        {loading ? (
          <p className="text-muted-foreground">Loading analytics...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_views}</div>
                  <p className="text-xs text-muted-foreground">Page impressions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_clicks}</div>
                  <p className="text-xs text-muted-foreground">CTA button clicks</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.ctr_percentage.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">Clicks / Views</p>
                </CardContent>
              </Card>
            </div>

            {/* Clicks by Element */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Clicks by Button</CardTitle>
                <CardDescription>Which buttons get the most engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {elementStats.length === 0 ? (
                  <p className="text-muted-foreground">No click data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {elementStats.map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium">{getElementLabel(stat.element_id)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{stat.click_count} clicks</span>
                          <span className="text-sm font-semibold">
                            {summary.total_clicks > 0 
                              ? ((stat.click_count / summary.total_clicks) * 100).toFixed(1) 
                              : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Last 30 Days</CardTitle>
                <CardDescription>Daily views and clicks breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyStats.length === 0 ? (
                  <p className="text-muted-foreground">No data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {dailyStats.map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm font-medium">{stat.date}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <Eye className="inline h-3 w-3 mr-1" />
                            {stat.views}
                          </span>
                          <span className="text-muted-foreground">
                            <MousePointer className="inline h-3 w-3 mr-1" />
                            {stat.clicks}
                          </span>
                          <span className="font-medium">
                            {stat.views > 0 ? ((stat.clicks / stat.views) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}