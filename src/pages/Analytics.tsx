import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, Eye, MousePointer, Globe, Smartphone, Monitor, Tablet, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
// import AlertsPanel from "@/components/AlertsPanel";
// import AlertSettings from "@/components/AlertSettings";

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

interface UtmStats {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  views: number;
  clicks: number;
  ctr: number;
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
  const [utmStats, setUtmStats] = useState<UtmStats[]>([]);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all" | "custom">("30d");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  // const [missingUtmCount, setMissingUtmCount] = useState(0);

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

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [dateRange, customStartDate, customEndDate]);

  const getDateFilter = () => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateRange) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      case "custom":
        if (customStartDate) {
          startDate = customStartDate;
        }
        break;
      case "all":
      default:
        return null;
    }

    return startDate;
  };

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

    // Get date filter
    const startDate = getDateFilter();
    const endDate = dateRange === "custom" && customEndDate ? customEndDate : new Date();

    // Build query with date filter
    const applyDateFilter = (query: any) => {
      let q = query;
      if (startDate) {
        q = q.gte("created_at", startDate.toISOString());
      }
      if (dateRange === "custom" && customEndDate) {
        q = q.lte("created_at", endDate.toISOString());
      }
      return q;
    };

    // Fetch summary with date filter
    let viewsQuery = supabase
      .from("page_analytics")
      .select("id", { count: "exact", head: true })
      .eq("page_id", pageId)
      .eq("event_type", "view");
    
    let clicksQuery = supabase
      .from("page_analytics")
      .select("id", { count: "exact", head: true })
      .eq("page_id", pageId)
      .eq("event_type", "click");

    viewsQuery = applyDateFilter(viewsQuery);
    clicksQuery = applyDateFilter(clicksQuery);

    const [{ count: viewCount }, { count: clickCount }] = await Promise.all([
      viewsQuery,
      clicksQuery
    ]);

    const totalViews = viewCount || 0;
    const totalClicks = clickCount || 0;
    const ctrPercentage = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    setSummary({
      total_views: totalViews,
      total_clicks: totalClicks,
      ctr_percentage: ctrPercentage
    });

    // Fetch daily stats with date filter
    let analyticsQuery = supabase
      .from("page_analytics")
      .select("event_type, created_at")
      .eq("page_id", pageId)
      .order("created_at", { ascending: true });

    analyticsQuery = applyDateFilter(analyticsQuery);
    const { data: analyticsData, error: analyticsError } = await analyticsQuery;

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

    // Fetch clicks by element with date filter
    let elementQuery = supabase
      .from("page_analytics")
      .select("element_id")
      .eq("page_id", pageId)
      .eq("event_type", "click");

    elementQuery = applyDateFilter(elementQuery);
    const { data: elementData, error: elementError } = await elementQuery;

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

    // Fetch traffic sources with date filter
    let trafficQuery = supabase
      .from("page_analytics")
      .select("referrer")
      .eq("page_id", pageId)
      .eq("event_type", "view");

    trafficQuery = applyDateFilter(trafficQuery);
    const { data: analyticsWithReferrer } = await trafficQuery;

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

    // Fetch device and browser stats with date filter
    let deviceUAQuery = supabase
      .from("page_analytics")
      .select("user_agent")
      .eq("page_id", pageId)
      .eq("event_type", "view");

    deviceUAQuery = applyDateFilter(deviceUAQuery);
    const { data: analyticsWithUA } = await deviceUAQuery;

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

    // Fetch UTM attribution data with date filter
    let utmAnalyticsQuery = supabase
      .from("page_analytics")
      .select("utm_source, utm_medium, utm_campaign, event_type")
      .eq("page_id", pageId)
      .not("utm_source", "is", null);

    utmAnalyticsQuery = applyDateFilter(utmAnalyticsQuery);
    const { data: utmAnalytics } = await utmAnalyticsQuery;

    if (utmAnalytics && utmAnalytics.length > 0) {
      const utmGroups: { [key: string]: { views: number; clicks: number } } = {};
      
      utmAnalytics.forEach(event => {
        const key = `${event.utm_source || 'unknown'}|${event.utm_medium || 'unknown'}|${event.utm_campaign || 'unknown'}`;
        if (!utmGroups[key]) {
          utmGroups[key] = { views: 0, clicks: 0 };
        }
        if (event.event_type === 'view') {
          utmGroups[key].views++;
        } else if (event.event_type === 'click') {
          utmGroups[key].clicks++;
        }
      });
      
      const utmStatsArray = Object.entries(utmGroups)
        .map(([key, data]) => {
          const [utm_source, utm_medium, utm_campaign] = key.split('|');
          return {
            utm_source: utm_source === 'unknown' ? null : utm_source,
            utm_medium: utm_medium === 'unknown' ? null : utm_medium,
            utm_campaign: utm_campaign === 'unknown' ? null : utm_campaign,
            views: data.views,
            clicks: data.clicks,
            ctr: data.views > 0 ? (data.clicks / data.views) * 100 : 0
          };
        })
        .sort((a, b) => b.views - a.views);
      
      setUtmStats(utmStatsArray);
    }

    // Count views with missing UTM parameters
    // const { count: missingUtmViews } = await supabase
    //   .from("page_analytics")
    //   .select("*", { count: 'exact', head: true })
    //   .eq("page_id", pageId)
    //   .eq("event_type", "view")
    //   .is("utm_source", null)
    //   .is("utm_medium", null)
    //   .is("utm_campaign", null);

    // setMissingUtmCount(missingUtmViews || 0);

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

        {/* iOS Large Title with Date Range */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <h1 className="ios-large-title mb-1">Analytics</h1>
            <p className="ios-body text-muted-foreground">{pageTitle}</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="w-[180px] rounded-ios">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === "custom" && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal rounded-ios ios-footnote">
                      {customStartDate ? format(customStartDate, "PP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground ios-caption">to</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal rounded-ios ios-footnote">
                      {customEndDate ? format(customEndDate, "PP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
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

            {/* Active Alerts - Temporarily disabled until types regenerate */}
            {/* <div className="mb-6">
              <AlertsPanel 
                pageId={pageId!} 
                summary={summary} 
                missingUtmCount={missingUtmCount}
              />
            </div> */}

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

            {/* UTM Campaign Attribution */}
            {utmStats.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Campaign Attribution (UTM Tracking)</CardTitle>
                  <CardDescription>Performance by marketing source, medium, and campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-sm font-medium">Source</th>
                          <th className="text-left py-2 px-2 text-sm font-medium">Medium</th>
                          <th className="text-left py-2 px-2 text-sm font-medium">Campaign</th>
                          <th className="text-right py-2 px-2 text-sm font-medium">Views</th>
                          <th className="text-right py-2 px-2 text-sm font-medium">Clicks</th>
                          <th className="text-right py-2 px-2 text-sm font-medium">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {utmStats.map((stat, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-3 px-2 text-sm">
                              <Badge variant="outline">{stat.utm_source || '-'}</Badge>
                            </td>
                            <td className="py-3 px-2 text-sm">{stat.utm_medium || '-'}</td>
                            <td className="py-3 px-2 text-sm font-medium">{stat.utm_campaign || '-'}</td>
                            <td className="py-3 px-2 text-sm text-right">{stat.views}</td>
                            <td className="py-3 px-2 text-sm text-right">{stat.clicks}</td>
                            <td className="py-3 px-2 text-sm text-right">
                              <span className="font-semibold text-primary">{stat.ctr.toFixed(2)}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Alert Settings - Temporarily disabled until types regenerate */}
            {/* <div className="mt-6">
              <AlertSettings pageId={pageId!} userId={user?.id} />
            </div> */}
          </>
        )}
      </div>
    </div>
  );
}