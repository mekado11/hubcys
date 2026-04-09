import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";

const AIAssistButton = React.memo(({ prompt, onResult, className = "" }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!prompt || loading) return;
    
    setLoading(true);
    try {
      const response = await InvokeLLM({
        prompt: prompt,
        feature: 'bia_analysis',
        add_context_from_internet: false
      });
      
      if (onResult && response) {
        onResult(response);
      }
    } catch (error) {
      console.error("AI assist error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={loading}
      className={`border-purple-500/30 text-purple-300 hover:bg-purple-500/10 shrink-0 ${className}`}
      title="AI Assist"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
    </Button>
  );
});

AIAssistButton.displayName = 'AIAssistButton';

export default AIAssistButton;