
import React, { useState, useEffect, useRef } from 'react';
import { SmartConsultation } from '@/entities/SmartConsultation';
import { User } from '@/entities/User';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, User as UserIcon, Bot } from 'lucide-react'; // Changed User as UserIcon to User below for consistency with outline
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SmartConsultationChat({ assessmentId, assessmentData }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // currentUser is not used in the new renderMessage, but is kept for potential future use or other parts of the component.
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, [assessmentId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, loading]);

  const initializeChat = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const existingSessions = await SmartConsultation.filter({ assessment_id: assessmentId }, '-last_message_date', 1);
      
      let currentSession;
      if (existingSessions.length > 0) {
        currentSession = existingSessions[0];
        // Ensure historical messages have a timestamp, adding current time if missing for display purposes
        setMessages(JSON.parse(currentSession.conversation_history).map(msg => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString() // Fallback timestamp for existing messages
        })));
      } else {
        const newSessionData = {
          assessment_id: assessmentId,
          session_title: `Consultation for ${assessmentData.company_name} - ${format(new Date(), 'PP')}`,
          conversation_history: '[]'
        };
        currentSession = await SmartConsultation.create(newSessionData);
        
        const introPrompt = `You are Fortigap's Smart Security Consultant. Your task is to initiate a consultation based on a user's security assessment. The user is from "${assessmentData.company_name}". Their overall security score is ${assessmentData.overall_score}% which is rated as "${assessmentData.maturity_level}". Start the conversation with a warm and professional greeting. Briefly state their score and maturity level. Then, list the top 2-3 most critical areas for improvement based on their smart_analysis: ${JSON.stringify(assessmentData.smart_analysis)}. Conclude by asking an open-ended question like, "Where would you like to begin?" or "Which of these areas would you like to discuss first?". Your entire response should be formatted using markdown.`;
        
        const response = await InvokeLLM({ prompt: introPrompt, feature: 'consultation' });
        const initialMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
        setMessages([initialMessage]);
        
        await SmartConsultation.update(currentSession.id, {
          conversation_history: JSON.stringify([initialMessage]),
          last_message_date: new Date().toISOString()
        });
      }
      setSession(currentSession);
    } catch (error) {
      console.error("Error initializing consultation:", error);
      setMessages([{ role: 'assistant', content: 'There was an error starting the consultation. Please refresh and try again.', timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !session || loading) return;

    const userMessage = { role: 'user', content: inputValue, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      const conversationHistory = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp // Preserve timestamp for history
      }));
      
      const prompt = `Continue the conversation as Fortigap's Smart Security Consultant. Here is the conversation history: ${JSON.stringify(conversationHistory)}. The user's latest message is: "${inputValue}". Provide a helpful response based on the entire conversation context and the initial assessment data: ${JSON.stringify(assessmentData)}. Keep your answer concise, helpful, and formatted in markdown.`;
      
      const response = await InvokeLLM({ prompt, feature: 'consultation' });
      const assistantMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      
      await SmartConsultation.update(session.id, {
        conversation_history: JSON.stringify(finalMessages),
        last_message_date: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { role: 'assistant', content: "Sorry, I encountered an error processing your request. Please try again.", timestamp: new Date().toISOString() };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`flex items-start space-x-3 max-w-4xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-cyan-500/20' : 'bg-purple-500/20'
          }`}>
            {/* Using UserIcon (alias from User) for user message and Sparkles for assistant */}
            {isUser ? (
              <UserIcon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-4 rounded-lg ${
              isUser 
                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-100' 
                : 'bg-slate-700/50 border border-slate-600/50 text-gray-100'
            }`}>
              {/* Note: 'prose-cyan' and 'prose-gray' assume custom Tailwind typography configurations */}
              <ReactMarkdown 
                className={`prose prose-sm max-w-none ${
                  isUser ? 'prose-cyan' : 'prose-gray'
                } prose-headings:text-gray-200 prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-white prose-ul:my-4 prose-li:my-2 prose-li:leading-relaxed`}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.timestamp && ( // Only render timestamp if it exists
              <div className={`text-xs text-gray-500 mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
                {format(new Date(message.timestamp), 'MMM d, h:mm a')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-effect border-purple-500/20 h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          Smart Consultation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-grow px-6">
          {loading && !messages.length && (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
             </div>
          )}
          {messages.map(renderMessage)}
          {loading && messages.length > 0 && (
            <div className="flex items-start gap-3 my-4 animate-in fade-in">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                <Bot className="w-5 h-5 text-purple-300" />
              </div>
              <div className="max-w-xl p-4 rounded-xl bg-slate-700/50 border border-gray-600/50">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t border-gray-700/50 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask for clarification or next steps..."
              className="bg-slate-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 resize-none h-12"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
