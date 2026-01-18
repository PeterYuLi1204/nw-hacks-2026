import { useState, useRef, useEffect } from 'react';
import { IoClose, IoTrash, IoSend, IoSparkles } from 'react-icons/io5';
import ReactMarkdown from 'react-markdown';
import type { DecisionWithContext } from '../App';

const API_BASE_URL = 'http://localhost:3001';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: string[]; // Array of decisionIds
}

interface AIChatInterfaceProps {
  onClose: () => void;
  decisions: DecisionWithContext[];
  onSelectDecision: (decision: DecisionWithContext) => void;
}

export default function AIChatInterface({ 
  onClose, 
  decisions, 
  onSelectDecision 
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearHistory = () => {
    setMessages([]);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare decisions context for the API
      const decisionsContext = decisions.map(d => ({
        decisionId: d.decisionId,
        title: d.title,
        summary: d.summary,
        meetingType: d.meetingType,
        meetingDate: d.meetingDate,
        location: d.location,
      }));

      const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText.trim(),
          decisions: decisionsContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();
      console.log('API response:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        references: data.references || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        references: [],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const getDecisionById = (decisionId: string): DecisionWithContext | undefined => {
    return decisions.find(d => d.decisionId === decisionId);
  };

  const handleReferenceClick = (decisionId: string) => {
    const decision = getDecisionById(decisionId);
    if (decision) {
      onSelectDecision(decision);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1000] w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b-2 border-blue-200">
        <div className="flex items-center gap-2">
          <IoSparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-base text-gray-900">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleClearHistory}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear chat history"
          >
            <IoTrash className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close chat"
          >
            <IoClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <IoSparkles className="w-10 h-10 mx-auto mb-3 text-blue-300" />
            <p className="text-sm">Ask me anything about the council decisions!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-blue-50 border border-blue-200 text-gray-800'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}
            >
              {message.role === 'user' ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-1">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
              
              {/* References section for assistant messages */}
              {message.role === 'assistant' && message.references && message.references.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">References:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {message.references.slice(0, 5).map((refId) => {
                      const decision = getDecisionById(refId);
                      if (!decision) return null;
                      return (
                        <button
                          key={refId}
                          onClick={() => handleReferenceClick(refId)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full transition-colors truncate max-w-[180px]"
                          title={decision.title}
                        >
                          {decision.title}
                        </button>
                      );
                    })}
                    {message.references.length > 5 && (
                      <span className="text-xs text-gray-500 px-2.5 py-1">
                        and {message.references.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-4 py-2 bg-white border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickQuestion("What decisions affect my area?")}
            disabled={isLoading}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            What decisions affect my area?
          </button>
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about council decisions..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoSend className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
