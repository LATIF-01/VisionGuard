import { useState, useRef, useEffect } from 'react';
import { mockChatHistory } from '../data/mockChat';

export default function LLMQuery() {
  const [messages, setMessages] = useState(mockChatHistory);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };
    
    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-vg-accent/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-vg-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">VisionGuard LLM</h1>
            <p className="text-vg-text-muted text-sm">Natural language event queries</p>
          </div>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Welcome message */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vg-card border border-white/10 text-sm text-vg-text-muted">
            <span className="w-2 h-2 rounded-full bg-vg-success animate-pulse" />
            VisionGuard LLM is ready
          </div>
        </div>

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        <div ref={chatEndRef} />
      </div>

      {/* Quick suggestions */}
      <div className="flex-shrink-0 py-3 border-t border-white/10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <SuggestionChip>Show recent alerts</SuggestionChip>
          <SuggestionChip>Activity in parking lot</SuggestionChip>
          <SuggestionChip>Summarize today's events</SuggestionChip>
          <SuggestionChip>Any unauthorized access?</SuggestionChip>
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pt-2">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask VisionGuard about events..."
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-vg-card border border-white/10 
                text-white placeholder-vg-text-muted resize-none
                focus:outline-none focus:border-vg-accent/50 focus:ring-1 focus:ring-vg-accent/30
                transition-all"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button 
            onClick={handleSend}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-vg-accent flex items-center justify-center
              glow-blue-sm hover:glow-blue transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputValue.trim()}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-vg-text-muted mt-3">
          VisionGuard LLM can search events, generate reports, and provide insights
        </p>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar and name */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <div className="w-6 h-6 rounded-full bg-vg-accent/20 flex items-center justify-center">
              <span className="text-vg-accent text-xs font-bold">VG</span>
            </div>
          )}
          <span className="text-xs text-vg-text-muted">
            {isUser ? 'You' : 'VisionGuard LLM'}
          </span>
          <span className="text-xs text-vg-text-muted/60">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message bubble */}
        <div 
          className={`
            px-4 py-3 rounded-2xl
            ${isUser 
              ? 'bg-vg-accent text-white rounded-tr-sm' 
              : 'bg-vg-card border border-white/10 text-white rounded-tl-sm'
            }
          `}
        >
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ children }) {
  return (
    <button className="flex-shrink-0 px-4 py-2 rounded-full bg-vg-card border border-white/10 
      text-sm text-vg-text-muted hover:text-white hover:border-vg-accent/30 
      transition-all whitespace-nowrap">
      {children}
    </button>
  );
}
