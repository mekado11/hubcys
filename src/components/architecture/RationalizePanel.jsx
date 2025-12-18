import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Sparkles, MessageCircle, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { InvokeLLM } from "@/integrations/Core";

export default function RationalizePanel({ isOpen, onClose, analysisData }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeMessageShown, setWelcomeMessageShown] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !welcomeMessageShown) {
      // Initialize with welcome message and context
      const welcomeMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `Hello! I'm your AI architecture consultant. I can help you analyze, rationalize, and improve your security architecture based on the findings from your diagram analysis.

**Available Analysis Context:**
${analysisData ? `
- **Components:** ${analysisData.components?.length || 0} identified
- **Security Gaps:** ${analysisData.security_gaps?.length || 0} potential issues
- **Recommendations:** ${analysisData.recommendations?.length || 0} suggestions
` : 'No analysis data available yet. Please run an architecture analysis first.'}

Feel free to ask me questions like:
• "Why is network segmentation important for my architecture?"
• "How can I improve the security of my database layer?"
• "What are the risks of my current setup?"
• "Prioritize the security recommendations for implementation"

What would you like to explore?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setWelcomeMessageShown(true);
    }
    
    // Reset when panel is closed
    if (!isOpen) {
      setWelcomeMessageShown(false);
      setMessages([]);
    }
  }, [isOpen, analysisData, welcomeMessageShown]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create context-rich prompt for the AI
      const contextualPrompt = `
You are an expert security architecture consultant helping a user understand and improve their security posture.

ANALYSIS CONTEXT:
${analysisData ? `
Architecture Analysis Results:
- Components: ${JSON.stringify(analysisData.components || [], null, 2)}
- Security Gaps: ${JSON.stringify(analysisData.security_gaps || [], null, 2)}
- Recommendations: ${JSON.stringify(analysisData.recommendations || [], null, 2)}
- Risk Score: ${analysisData.risk_score || 'Not calculated'}
- Compliance Issues: ${JSON.stringify(analysisData.compliance_issues || [], null, 2)}
` : 'No architecture analysis data is currently available.'}

CONVERSATION HISTORY:
${messages.slice(-5).map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

USER QUESTION: ${userMessage.content}

Please provide a helpful, expert response that:
1. Directly addresses the user's question
2. References specific findings from the analysis context when relevant
3. Provides actionable, practical advice
4. Uses clear, professional language
5. Includes specific recommendations where appropriate

Format your response in markdown for better readability.
`;

      const response = await InvokeLLM({
        prompt: contextualPrompt,
        add_context_from_internet: false
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    console.log('RationalizePanel: Close button clicked');
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-4xl h-[80vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center"
                >
                  <Brain className="w-6 h-6 text-white" />
                </motion.div>
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-md"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  AI Architecture Consultant
                </h2>
                <p className="text-sm text-gray-400">Get expert insights on your security architecture</p>
              </div>
            </div>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-red-500/20 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/30">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <Card className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/30' 
                      : 'bg-slate-800/60 border-slate-700/50'
                  } backdrop-blur-sm`}>
                    <CardContent className="p-4">
                      {message.type === 'user' ? (
                        <p className="text-white">{message.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            className="text-gray-300 leading-relaxed"
                            components={{
                              h1: ({children}) => <h1 className="text-lg font-bold text-cyan-300 mb-3">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-semibold text-cyan-300 mb-2">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-semibold text-white mb-2">{children}</h3>,
                              p: ({children}) => <p className="text-gray-300 mb-2 leading-relaxed">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="text-gray-300">{children}</li>,
                              strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                              code: ({children}) => <code className="bg-slate-700 text-cyan-300 px-1 py-0.5 rounded text-xs">{children}</code>,
                              blockquote: ({children}) => (
                                <blockquote className="border-l-2 border-cyan-500 pl-3 py-1 bg-cyan-500/5 rounded-r my-2">
                                  <div className="text-cyan-200">{children}</div>
                                </blockquote>
                              )
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                        />
                      </div>
                      <span className="text-gray-400 text-sm">AI is analyzing...</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your architecture, security gaps, or recommendations..."
                  className="bg-slate-800/60 border-slate-600/50 text-white placeholder-gray-400 pr-12 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Powered by AI</span>
                </div>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-slate-700/50 text-xs"
              >
                Close Chat
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}