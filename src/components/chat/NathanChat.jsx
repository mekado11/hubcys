
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  User as UserIcon,
  Loader2,
  Shield,
  Brain,
  AlertTriangle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InvokeLLM } from '@/integrations/Core';
import { Assessment } from '@/entities/Assessment';
import { ActionItem } from '@/entities/ActionItem';
import { User } from '@/entities/User';

// MessageBubble component
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-3`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <Shield className="w-7 h-7 p-1 rounded-full bg-slate-700 text-cyan-400" />
        </div>
      )}
      
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        <div className={`px-4 py-3 rounded-lg ${
          isUser 
            ? 'bg-purple-600 text-white' 
            : 'bg-slate-700 text-gray-100'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <ReactMarkdown 
              className="text-sm prose prose-invert prose-sm max-w-none"
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 leading-relaxed text-gray-100">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mb-3 mt-4 first:mt-0 text-white">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-white">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1 text-gray-100">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-100">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-100 leading-relaxed">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">
                    {children}
                  </strong>
                ),
                code: ({ inline, children }) => (
                  inline ? (
                    <code className="bg-slate-600 px-1 py-0.5 rounded text-cyan-300 text-xs">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-slate-600 p-3 rounded mt-2 mb-3 overflow-x-auto">
                      <code className="text-cyan-300 text-xs">
                        {children}
                      </code>
                    </pre>
                  )
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-purple-500 pl-4 my-3 italic text-gray-300">
                    {children}
                  </blockquote>
                ),
                br: () => <br className="my-1" />
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <UserIcon className="w-7 h-7 p-1 rounded-full bg-purple-600 text-white" />
        </div>
      )}
    </div>
  );
};

// Disclaimer component that appears inside the chat
const DisclaimerContent = ({ onAccept, onDecline }) => {
  return (
    <div className="p-4 h-full flex flex-col bg-slate-800 text-white">
      <div className="flex items-center mb-4">
        <AlertTriangle className="w-6 h-6 mr-3 text-red-400" />
        <h3 className="text-lg font-bold text-red-300">Nathan AI Assistant - Important Disclaimer</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 text-sm">
        <p className="text-gray-300">
          Please read and accept the following terms before using Nathan.
        </p>
        
        <div className="bg-slate-700/50 p-3 rounded-lg border border-red-500/20">
          <h4 className="font-semibold text-white mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
            AI Assistant Limitations
          </h4>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-start">
              <span className="text-red-400 mr-2 mt-0.5">•</span>
              <span><strong>Not Legal Advice:</strong> Nathan does not provide legal advice and cannot replace qualified legal professionals.</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2 mt-0.5">•</span>
              <span><strong>AI Model:</strong> Nathan is an artificial intelligence that uses training data and advanced logic to provide guidance.</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2 mt-0.5">•</span>
              <span><strong>Human Oversight Required:</strong> All recommendations must be reviewed by qualified cybersecurity professionals.</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2 mt-0.5">•</span>
              <span><strong>Professional Consultation:</strong> For critical security decisions, always consult with certified security experts and legal advisors.</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2 mt-0.5">•</span>
              <span><strong>Information Only:</strong> Nathan's responses are for informational and educational purposes only.</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-slate-700/50 p-3 rounded-lg border border-green-500/20">
          <h4 className="font-semibold text-white mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
            What Nathan Can Help With
          </h4>
          <ul className="space-y-1 text-xs text-gray-300">
            <li className="flex items-start">
              <span className="text-green-400 mr-2 mt-0.5">•</span>
              <span>Understanding FortiGap platform features and capabilities</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2 mt-0.5">•</span>
              <span>General cybersecurity best practices and guidance</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2 mt-0.5">•</span>
              <span>Explaining assessment results and recommendations</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2 mt-0.5">•</span>
              <span>Providing educational information about security frameworks</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
        <Button
          onClick={onDecline}
          variant="outline"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
        >
          Decline & Close
        </Button>
        <Button
          onClick={onAccept}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Accept & Continue
        </Button>
      </div>
    </div>
  );
};

export default function NathanChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null); // New ref for scrolling to the top
  const inputRef = useRef(null);
  const shouldScrollToBottom = useRef(false);

  // Check localStorage for disclaimer acceptance
  useEffect(() => {
    const accepted = localStorage.getItem('nathanDisclaimerAccepted');
    if (accepted === 'true') {
      setDisclaimerAccepted(true);
    }
  }, []);

  useEffect(() => {
    // Get current user info for context
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Could not fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  const scrollToTop = () => {
    if (messagesTopRef.current) {
      messagesTopRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    if (shouldScrollToBottom.current) {
      const timer = setTimeout(() => {
        scrollToBottom();
        shouldScrollToBottom.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const getContextualInfo = async () => {
    let contextInfo = '';
    
    try {
      // Get recent assessments
      const assessments = await Assessment.list('-created_date', 3);
      if (assessments.length > 0) {
        contextInfo += `\n\nRecent Assessments Context:\n`;
        assessments.forEach(assessment => {
          contextInfo += `- ${assessment.company_name}: ${assessment.overall_score}% maturity (${assessment.maturity_level})\n`;
        });
      }

      // Get active action items
      const actionItems = await ActionItem.filter({status: 'not_started'}, '-created_date', 5);
      if (actionItems.length > 0) {
        contextInfo += `\n\nActive Action Items:\n`;
        actionItems.forEach(item => {
          contextInfo += `- ${item.title} (${item.priority} priority)\n`;
        });
      }

      // Add user context
      if (currentUser) {
        contextInfo += `\n\nUser Context:\n- Company: ${currentUser.company_name}\n- Industry: ${currentUser.company_industry || 'Not specified'}\n- Size: ${currentUser.company_size || 'Not specified'}`;
      }
    } catch (error) {
      console.log('Could not fetch contextual info:', error);
    }

    return contextInfo;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // User message should scroll to bottom
    shouldScrollToBottom.current = true;

    try {
      // Get contextual information about the user's FortiGap data
      const contextInfo = await getContextualInfo();

      // Create Nathan's persona and system prompt - focused on answering what's asked
      const systemPrompt = `You are Nathan, an expert cybersecurity consultant and assistant working within the FortiGap platform. 

CRITICAL GUIDELINES:
- You are an AI model - remind users when providing significant recommendations that they should consult with qualified cybersecurity professionals
- ONLY answer what the user specifically asks for - do not volunteer unrequested information
- Be conversational and helpful, but focused
- If asked about their security posture, then you can reference their data
- For simple greetings, respond naturally and ask how you can help

FortiGap is a comprehensive cybersecurity assessment and management platform that helps organizations conduct security assessments, generate compliance reports, track action items, manage policies, and conduct incident response training.

**FORMATTING INSTRUCTIONS:**
- Use clear section headers with **bold text** when needed
- Add proper spacing between sections
- Keep responses concise and focused on the user's question
- Use bullet points for lists when appropriate

**AVAILABLE CONTEXT (use only when relevant to user's question):**
${contextInfo}

Your role is to:
1. Answer the specific question asked by the user
2. Provide helpful cybersecurity guidance when requested
3. Help users understand FortiGap features when asked
4. Include appropriate disclaimers for significant recommendations

Communication style: Professional yet conversational, direct, and focused on answering what's asked.

IMPORTANT: Do not provide unsolicited security assessments or recommendations unless specifically asked!`;

      const response = await InvokeLLM({
        prompt: `${systemPrompt}\n\nUser Question: ${currentInput}`,
        feature: 'consultation',
        add_context_from_internet: false
      });

      const assistantMessage = {
        role: 'assistant', 
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // For Nathan's responses, scroll to top to show beginning of response
      setTimeout(() => {
        scrollToTop();
      }, 100);

    } catch (error) {
      console.error('Error getting Nathan response:', error);
      const errorMessage = {
        role: 'assistant',
        content: `I apologize, but I'm having trouble processing your request right now. Please try again in a moment.

If the issue persists, please contact support. Remember that I'm an AI assistant and any guidance I provide should be reviewed by qualified cybersecurity professionals.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = async () => {
    setIsOpen(true);
    
    // Show disclaimer if not accepted yet
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
      return;
    }

    // Initialize chat normally if disclaimer already accepted and no messages exist
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hello, I am Nathan, your cybersecurity assistant! How may I help you today?',
        timestamp: new Date().toISOString()
      }]);
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    localStorage.setItem('nathanDisclaimerAccepted', 'true');
    setShowDisclaimer(false); // Hide the disclaimer UI
    
    // Add initial greeting after disclaimer is accepted, only if chat is empty
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hello, I am Nathan, your cybersecurity assistant! How may I help you today?',
        timestamp: new Date().toISOString()
      }]);
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false);
    setIsOpen(false); // Close the chat if declined
  };

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          key="chat-button"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={handleOpenChat}
            className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg flex items-center justify-center"
            title="Open Nathan Chat"
          >
            <MessageCircle className="w-7 h-7 text-white" />
          </Button>
        </motion.div>
      )}

      {isOpen && (
        <motion.div
          key="chat-window"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[calc(100vh-100px)] max-h-[600px] flex flex-col"
        >
          <Card className="glass-effect border-purple-500/30 flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pr-2 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8 text-purple-400" />
                <div>
                  <CardTitle className="text-white text-lg font-bold">Nathan</CardTitle>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                    Cybersecurity Assistant
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} title="Close">
                  <X className="h-5 w-5 text-gray-400 hover:text-white" />
                </Button>
              </div>
            </CardHeader>
            
            {showDisclaimer ? (
              <CardContent className="flex flex-col flex-1 overflow-hidden p-0">
                <DisclaimerContent 
                  onAccept={handleAcceptDisclaimer}
                  onDecline={handleDeclineDisclaimer}
                />
              </CardContent>
            ) : (
              <>
                <CardContent className="flex flex-col flex-1 p-4 overflow-hidden min-h-0">
                  <div 
                    className="flex flex-col flex-1 overflow-y-auto space-y-4 pr-2 min-h-0"
                    style={{
                      scrollBehavior: 'smooth',
                      maxHeight: '100%'
                    }}
                  >
                    <div ref={messagesTopRef} style={{ height: '1px', width: '100%' }} />
                    
                    {messages.map((msg, index) => (
                      <MessageBubble key={index} message={msg} />
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex-shrink-0 mr-3">
                          <Shield className="w-7 h-7 p-1 rounded-full bg-slate-700 text-cyan-400" />
                        </div>
                        <div className="bg-slate-700 text-gray-100 px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                            <span className="text-sm">Nathan is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />
                  </div>
                </CardContent>
                
                <div className="p-4 border-t border-slate-700/50 bg-slate-800 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask Nathan anything about cybersecurity..."
                      className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
