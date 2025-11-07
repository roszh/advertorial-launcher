import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, Eye, MousePointer, Globe, Smartphone, Monitor, Tablet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface TrafficSource {
  source: string;
  views: number;
  percentage: number;
}

interface DeviceStats {
  device_type: string;
  count: number;
  percentage: number;
}

interface BrowserStats {
  browser: string;
  count: number;
  percentage: number;
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
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
  const [browserStats, setBrowserStats] = useState<BrowserStats[]>([]);

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

  const parseReferrer = (referrer: string | null): string => {
    if (!referrer) return "Direct";
    
    try {
      const url = new URL(referrer);
      const hostname = url.hostname.toLowerCase();
      
      // Social media
      if (hostname.includes('facebook')) return "Facebook";
      if (hostname.includes('instagram')) return "Instagram";
      if (hostname.includes('twitter') || hostname.includes('x.com')) return "X/Twitter";
      if (hostname.includes('linkedin')) return "LinkedIn";
      if (hostname.includes('tiktok')) return "TikTok";
      if (hostname.includes('pinterest')) return "Pinterest";
      
      // Search engines
      if (hostname.includes('google')) return "Google";
      if (hostname.includes('bing')) return "Bing";
      if (hostname.includes('yahoo')) return "Yahoo";
      if (hostname.includes('duckduckgo')) return "DuckDuckGo";
      
      // Check if same domain (internal)
      if (hostname.includes(window.location.hostname)) return "Internal";
      
      // Other referrers - show domain
      return hostname.replace('www.', '');
    } catch {
      return "Direct";
    }
  };

  const parseUserAgent = (ua: string | null): { device: string, browser: string } => {
    if (!ua) return { device: "Unknown", browser: "Unknown" };
    
    const uaLower = ua.toLowerCase();
    
    // Device detection
    let device = "Desktop";
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(uaLower)) {
      device = "Tablet";
    } else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(uaLower)) {
      device = "Mobile";
    }
    
    // Browser detection
    let browser = "Unknown";
    if (uaLower.includes('edg/')) browser = "Edge";
    else if (uaLower.includes('chrome/')) browser = "Chrome";
    else if (uaLower.includes('safari/') && !uaLower.includes('chrome')) browser = "Safari";
    else if (uaLower.includes('firefox/')) browser = "Firefox";
    else if (uaLower.includes('opera/') || uaLower.includes('opr/')) browser = "Opera";
    
    return { device, browser };
  };

  const fetchAnalytics = async () => {
    if (!pageId) return;
    
    setLoading(true);
    
    // Fetch page info
    const { data: pageData, error: pageError } = await supabase
      .from("pages")
      .select("title")
      .eq("id", pageId)
      .maybeSingle();

    if (pageError || !pageData) {
      toast({ title: "Error", description: pageError?.message || "Page not found", variant: "destructive" });
      setLoading(false);
      navigate("/dashboard");
      return;
    }

    setPageTitle(pageData.title);

    // Fetch summary from view
    const { data: summaryData, error: summaryError } = await supabase
      .from("page_analytics_summary")
      .select("*")
      .eq("page_id", pageId)
      .maybeSingle();

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

    // Fetch traffic sources
    const { data: analyticsWithReferrer } = await supabase
      .from("page_analytics")
      .select("referrer")
      .eq("page_id", pageId)
      .eq("event_type", "view");

    if (analyticsWithReferrer) {
      const sourceCounts: { [key: string]: number } = {};
      const totalViews = analyticsWithReferrer.length;
      
      analyticsWithReferrer.forEach(event => {
        const source = parseReferrer(event.referrer);
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      
      const sources = Object.entries(sourceCounts)
        .map(([source, views]) => ({
          source,
          views,
          percentage: (views / totalViews) * 100
        }))
        .sort((a, b) => b.views - a.views);
      
      setTrafficSources(sources);
    }

    // Fetch device and browser stats
    const { data: analyticsWithUA } = await supabase
      .from("page_analytics")
      .select("user_agent")
      .eq("page_id", pageId)
      .eq("event_type", "view");

    if (analyticsWithUA) {
      const deviceCounts: { [key: string]: number } = {};
      const browserCounts: { [key: string]: number } = {};
      const total = analyticsWithUA.length;
      
      analyticsWithUA.forEach(event => {
        const { device, browser } = parseUserAgent(event.user_agent);
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      });
      
      const devices = Object.entries(deviceCounts)
        .map(([device_type, count]) => ({
          device_type,
          count,
          percentage: (count / total) * 100
        }))
        .sort((a, b) => b.count - a.count);
      
      const browsers = Object.entries(browserCounts)
        .map(([browser, count]) => ({
          browser,
          count,
          percentage: (count / total) * 100
        }))
        .sort((a, b) => b.count - a.count);
      
      setDeviceStats(devices);
      setBrowserStats(browsers);
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
      <div className="container mx-auto px-4 md:px-5 py-6 md:py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-ios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="ios-callout">Back to Dashboard</span>
          </Button>
        </div>

        {/* iOS Large Title with Subtitle */}
        <div className="mb-8">
          <h1 className="ios-large-title mb-1">Analytics</h1>
          <p className="ios-body text-muted-foreground">{pageTitle}</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading analytics...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="ios-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="ios-callout font-medium">Total Views</CardTitle>
                  <Eye className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="ios-large-title">{summary.total_views}</div>
                  <p className="ios-footnote text-muted-foreground mt-1">Page impressions</p>
                </CardContent>
              </Card>

              <Card className="ios-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="ios-callout font-medium">Total Clicks</CardTitle>
                  <MousePointer className="h-5 w-5 text-primary" />
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

            {/* Traffic Sources */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                {trafficSources.length === 0 ? (
                  <p className="text-muted-foreground">No traffic data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {trafficSources.map((source, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{source.views} views</span>
                          <span className="text-sm font-semibold">{source.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device & Browser Stats */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {/* Device Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Mobile vs Desktop vs Tablet</CardDescription>
                </CardHeader>
                <CardContent>
                  {deviceStats.length === 0 ? (
                    <p className="text-muted-foreground">No device data available</p>
                  ) : (
                    <div className="space-y-3">
                      {deviceStats.map((stat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {stat.device_type === "Mobile" && <Smartphone className="h-4 w-4" />}
                            {stat.device_type === "Desktop" && <Monitor className="h-4 w-4" />}
                            {stat.device_type === "Tablet" && <Tablet className="h-4 w-4" />}
                            <span className="text-sm font-medium">{stat.device_type}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{stat.count}</span>
                            <Badge variant="secondary">{stat.percentage.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Browser Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Browser Breakdown</CardTitle>
                  <CardDescription>Which browsers visitors use</CardDescription>
                </CardHeader>
                <CardContent>
                  {browserStats.length === 0 ? (
                    <p className="text-muted-foreground">No browser data available</p>
                  ) : (
                    <div className="space-y-3">
                      {browserStats.map((stat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{stat.browser}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{stat.count}</span>
                            <Badge variant="secondary">{stat.percentage.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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