'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Place, RouteResult, ChatMessage } from '../../types/campus';
import { Bot, Send, User, X, Sparkles, Navigation, MapPin, RefreshCw, AlertCircle } from 'lucide-react';

interface GravityChatModalProps {
  onClose: () => void;
  onApplyRoute: (route: RouteResult) => void;
  onSelectPlace: (place: Place) => void;
  userLocation: [number, number] | null;
}

export default function GravityChatModal({
  onClose,
  onApplyRoute,
  onSelectPlace,
  userLocation,
}: GravityChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Hello! I am **Gravity AI**, your digital navigator for **Annamacharya University, Rajampet**.\n\nAsk me any question about university buildings, walking directions, or facilities. Every direction is strictly computed from verified campus walkways.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGrounded: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGrounded: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userLocation,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          text: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          routeData: data.routeData,
          suggestedPlaces: data.suggestedPlaces,
          actionPrompt: data.actionPrompt,
          isGrounded: data.isGrounded ?? true,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-err`,
            sender: 'assistant',
            text: 'I could not process that request. Please try asking about a specific university building or location.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isGrounded: false,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          text: 'Network connection issue. Navigation functions remain available via the search bar and interactive map.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isGrounded: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    'Where is the Canteen?',
    'Route from Main Gate to Central Library',
    'Where is the AIML Block?',
    'How do I reach PG Block from Canteen?',
    'Where is the Health Center?',
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full sm:max-w-lg h-[85vh] sm:h-[650px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gravity AI</h3>
                <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.2 rounded border border-brand-200 dark:border-brand-800">
                  Campus Guide
                </span>
              </div>
              <p className="text-[11px] text-slate-500">AU Verified Geospatial Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'msg-welcome',
                    sender: 'assistant',
                    text: 'Chat reset. How can I help you find your way around Annamacharya University today?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isGrounded: true,
                  },
                ]);
              }}
              title="Reset Chat"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety & Grounding Notice Banner */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 px-3.5 py-1.5 border-b border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-brand-600" />
            All directions grounded in verified Annamacharya University GIS paths.
          </span>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-slate-700 text-white'
                    : 'bg-brand-600 text-white shadow-sm'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700'
                }`}
              >
                <div className="whitespace-pre-line font-normal space-y-1">
                  {msg.text.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                  )}
                </div>

                {/* Embedded Action Button to View Route on Map */}
                {msg.routeData && msg.routeData.found && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onApplyRoute(msg.routeData!);
                        onClose();
                      }}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{msg.actionPrompt || 'Show Route on Map'}</span>
                    </button>
                  </div>
                )}

                {/* Suggested Place Pills */}
                {msg.suggestedPlaces && msg.suggestedPlaces.length > 0 && !msg.routeData && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1">
                    {msg.suggestedPlaces.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPlace(p);
                          onClose();
                        }}
                        className="text-[10px] bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 hover:border-brand-500 flex items-center gap-1 transition"
                      >
                        <MapPin className="w-2.5 h-2.5 text-brand-600" />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span
                  className={`text-[9px] block mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
              <Bot className="w-4 h-4 text-brand-600 animate-spin" />
              <span>Gravity AI is routing verified campus data...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] whitespace-nowrap bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full hover:border-brand-500 hover:text-brand-600 transition flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask directions (e.g. 'How do I reach the library?')..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-500/20 disabled:opacity-40 transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
