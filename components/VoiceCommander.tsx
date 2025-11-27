import React, { useState } from 'react';
import { BIMQueryResponse, BIMSuggestion, Message } from '../types';
import { parseBIMQuery } from '../services/geminiService';

interface VoiceCommanderProps {
  onCommand: (response: BIMQueryResponse) => void;
}

const VoiceCommander: React.FC<VoiceCommanderProps> = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<BIMQueryResponse | null>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    setIsListening(true);
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
       // Optional sound effect or visual cue start
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await parseBIMQuery(text);
      setLastResponse(response);
      onCommand(response);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: BIMSuggestion) => {
    const response: BIMQueryResponse = {
      ...suggestion.payload,
      keywords: [],
      reasoning: `Executing: ${suggestion.label}`,
      suggestions: []
    };
    setLastResponse(response);
    onCommand(response);
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-4 w-full max-w-lg px-4">
      
      {/* Result Card Overlay */}
      {(lastResponse || isProcessing) && (
        <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 w-full animate-fade-in-up">
          {isProcessing ? (
             <div className="flex items-center gap-3 text-slate-600">
               <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-sm font-medium">Processing command...</span>
             </div>
          ) : (
             <div>
                <div className="flex justify-between items-start mb-2">
                   <p className="text-sm text-slate-800 font-medium leading-relaxed">
                     {lastResponse?.reasoning}
                   </p>
                   <button onClick={() => setLastResponse(null)} className="text-slate-400 hover:text-slate-600">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                
                {lastResponse?.suggestions && lastResponse.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {lastResponse.suggestions.map((s, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
             </div>
          )}
        </div>
      )}

      {/* Main Microphone Button */}
      <button 
        onClick={startListening}
        className={`group relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${
           isListening 
             ? 'bg-red-500 scale-110' 
             : 'bg-slate-900 hover:bg-blue-600 hover:scale-105'
        }`}
      >
        {/* Ripple Effect when listening */}
        {isListening && (
           <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20 animate-pulse delay-75 scale-150"></span>
           </>
        )}

        <svg className={`w-6 h-6 z-10 transition-colors ${isListening ? 'text-white' : 'text-slate-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      {/* Helper Text */}
      <div className={`text-xs font-medium text-slate-500 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm transition-opacity ${isListening ? 'opacity-0' : 'opacity-100'}`}>
        Tap to Speak
      </div>
    </div>
  );
};

export default VoiceCommander;
