import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

export default function EarlyCareer() {
  useEffect(() => {
    const url = createPageUrl("Pricing") + "?section=early-career";
    window.location.replace(url);
  }, []);
  return (
    <div className="min-h-screen cyber-gradient flex items-center justify-center p-6">
      <p className="text-gray-300">Redirecting to Pricing…</p>
    </div>
  );
}