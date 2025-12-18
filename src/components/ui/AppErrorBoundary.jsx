
import React from "react";
import { Button } from "@/components/ui/button";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error for diagnostics
    console.error("AppErrorBoundary caught an error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    try {
      // Clear app caches/local data to recover from bad state
      localStorage.clear();
      sessionStorage.clear();
      // Try to clear service worker cache if present
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } catch (e) {
      console.warn("Cache clear failed (non-blocking):", e);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-500/30 rounded-xl p-6 text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-300 mb-4">
            We hit an unexpected error. You can try reloading the page, or clear cached data and reload.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={this.handleReload} className="bg-cyan-600 hover:bg-cyan-700">Reload</Button>
            <Button variant="outline" onClick={this.handleClearAndReload} className="border-red-500/40 text-red-300 hover:bg-red-500/10">
              Clear cache & reload
            </Button>
          </div>
          {((typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') || 
            (typeof window !== 'undefined' && window.location?.hostname === 'localhost')) && this.state.error && (
            <pre className="text-left text-xs text-gray-400 mt-4 max-h-40 overflow-auto">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
