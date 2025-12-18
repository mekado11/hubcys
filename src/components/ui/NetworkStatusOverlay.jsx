import React from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function NetworkStatusOverlay() {
  const [online, setOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70]">
      <div className="flex items-center gap-3 bg-slate-900/90 border border-yellow-500/30 text-yellow-200 rounded-lg px-4 py-3 shadow-lg">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">You’re offline. Check your connection.</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/10"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
}