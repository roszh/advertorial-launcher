import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function PagesUsingSetup({ setupId }: { setupId: string }) {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pages, setPages] = useState<Array<{ id: string, title: string, status: string }>>([]);
  const [showPages, setShowPages] = useState(false);
  
  useEffect(() => {
    supabase
      .from("pages")
      .select("id, title, status")
      .eq("tracking_script_set_id", setupId)
      .then(({ data }) => {
        setPageCount(data?.length || 0);
        setPages(data || []);
      });
  }, [setupId]);
  
  if (pageCount === null) return <Loader2 className="h-4 w-4 animate-spin" />;
  
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => setShowPages(!showPages)}
      >
        {pageCount} page{pageCount !== 1 ? 's' : ''} using this
      </Button>
      {showPages && pages.length > 0 && (
        <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
          {pages.map(page => (
            <div key={page.id} className="flex items-center justify-between">
              <span className="truncate">{page.title}</span>
              <Badge variant={page.status === "published" ? "default" : "secondary"} className="text-xs ml-2">
                {page.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
