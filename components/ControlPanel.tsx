import React, { useState, useRef, useEffect } from 'react';
import { BIMQueryResponse, Message, BIMSuggestion } from '../types';
import { parseBIMQuery } from '../services/geminiService';

interface ControlPanelProps {
  onCommandProcessed: (response: BIMQueryResponse) => void;
  filteredCount: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onCommandProcessed, filteredCount }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'Hello! I am your BIM Assistant. Describe what you want to see, and I will generate controls for you.',
      timestamp: new Date(),
      suggestions: [
        { label: 'Isolate Structure', payload: { operation: 'ISOLATE' as any, category: 'Columns', level: null, material: null } },
        { label: 'Show Level 1', payload: { operation: 'ISOLATE' as any, category: null, level: 'Level 1', material: null } },
        { label: 'Reset View', payload: { operation: 'RESET' as any, category: null, level: null, material: null } }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInputText(''); // Only clear input if not an override
    setIsProcessing(true);

    try {
      const bimResponse = await parseBIMQuery(userMsg.text);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: bimResponse.reasoning,
        timestamp: new Date(),
        suggestions: bimResponse.suggestions
      };

      setMessages(prev => [...prev, assistantMsg]);
      onCommandProcessed(bimResponse);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I encountered an error connecting to the AI service. Please check your API key.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: BIMSuggestion) => {
    // 1. Add user message visually to show selection
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `Selected: ${suggestion.label}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. Execute command
    const fullResponse: BIMQueryResponse = {
      ...suggestion.payload,
      keywords: [],
      reasoning: `Action "${suggestion.label}" applied.`,
      suggestions: []
    };
    onCommandProcessed(fullResponse);

    // 3. Brief assistant confirmation
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `I've applied the filter: ${suggestion.label}`,
        timestamp: new Date()
      }]);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMicrophone = () => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    // @ts-ignore - Typescript doesn't strictly know about webkitSpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl w-full md:w-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-slate-800">AI Commander</h2>
          <p className="text-xs text-slate-500">Powered by Gemini 2.5</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <span className="text-xs font-bold text-blue-700">{filteredCount} Elements</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
            
            {/* Render Suggested Actions if they exist */}
            {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 max-w-[90%] animate-fade-in-up">
                {msg.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="group flex items-center gap-2 text-xs bg-white border border-indigo-100 hover:border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all shadow-sm active:scale-95"
                  >
                    <span className="font-semibold">{suggestion.label}</span>
                    <svg className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Toolbar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar items-center">
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">AI Tools:</span>
         <button 
            onClick={() => handleSendMessage("Analyze structural elements")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap"
         >
            <span className="text-lg">🏗️</span> Analyze Structure
         </button>
         <button 
            onClick={() => handleSendMessage("Show Mechanical and HVAC systems")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors whitespace-nowrap"
         >
            <span className="text-lg">🔧</span> MEP Check
         </button>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 pt-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to filter (e.g. 'Show beams')..."
            className="w-full pl-4 pr-24 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={toggleMicrophone}
              className={`p-2 rounded-lg transition-colors ${
                isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title="Toggle Microphone"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isProcessing}
              className={`p-2 rounded-lg transition-colors ${
                !inputText.trim() || isProcessing ? 'text-slate-300' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;