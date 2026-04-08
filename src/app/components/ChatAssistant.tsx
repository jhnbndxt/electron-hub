import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatAssistantProps {
  isVisible?: boolean;
  externalIsOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

interface Message {
  text: string;
  sender: "user" | "bot";
  isTyping?: boolean;
}

export function ChatAssistant({ 
  isVisible = true, 
  externalIsOpen, 
  onToggle 
}: ChatAssistantProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I'm your Electron Hub assistant. How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync external state with internal state
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleToggle = () => {
    const newState = !isOpen;
    setInternalIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const quickPrompts = [
    "What tracks are available?",
    "How do I enroll?",
    "Tell me about the Academic Track",
    "Assessment help",
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages([...messages, { text: userMessage, sender: "user" }]);
    setInput("");
    
    // Show typing indicator immediately
    setIsTyping(true);

    // Simulate bot response with typing delay
    setTimeout(() => {
      let botResponse = "Thank you for your question. I'm here to help you with enrollment and track recommendations.";
      
      if (userMessage.toLowerCase().includes("track")) {
        botResponse = "Electron College offers two main tracks: Academic Track (for college-bound students focusing on core academic subjects) and Technical-Professional Track (for those interested in technical and vocational skills). Our AI assessment will help determine which track suits you best!";
      } else if (userMessage.toLowerCase().includes("academic")) {
        botResponse = "The Academic Track prepares students for college programs. Based on your assessment, you'll be recommended electives like Biology & Physics (for STEM), Entrepreneurship & Marketing (for Business), Psychology & Creative Writing (for Humanities), Media Arts & Visual Arts (for Creative fields), or Coaching & Fitness (for Sports).";
      } else if (userMessage.toLowerCase().includes("technical") || userMessage.toLowerCase().includes("professional")) {
        botResponse = "The Technical-Professional Track focuses on practical skills and hands-on learning. Recommended electives include ICT & Programming, Cookery & Bread/Pastry, Automotive & Electrical, Agriculture & Fishery, or Fitness Training & Coaching based on your interests.";
      } else if (userMessage.toLowerCase().includes("enroll")) {
        botResponse = "To enroll, you can start by taking our assessment test which will help recommend the best track for you. After completing the assessment, you can proceed with the enrollment form. Would you like to start the assessment?";
      } else if (userMessage.toLowerCase().includes("assessment")) {
        botResponse = "Our AI-powered assessment evaluates your academic skills (Verbal, Math, Science, Logical) and personal interests to recommend the best track and electives for you. It takes about 15-20 minutes to complete. You can access it from the dashboard.";
      }

      setIsTyping(false);
      
      // Add the bot message and display it with letter-by-letter typing effect
      setMessages(prev => [...prev, { text: "", sender: "bot" }]);
      
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < botResponse.length) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.text = botResponse.substring(0, charIndex + 1);
            return newMessages;
          });
          charIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 20); // Type each character with 20ms delay
    }, 800);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center"
        style={{ backgroundColor: "var(--electron-red)" }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Electron Hub Assistant</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "text-white"
                      : "bg-white border border-gray-200"
                  }`}
                  style={
                    message.sender === "user"
                      ? { backgroundColor: "var(--electron-blue)" }
                      : {}
                  }
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-1 text-xs rounded-full border hover:bg-gray-100 transition-colors"
                    style={{ borderColor: "var(--electron-blue)", color: "var(--electron-blue)" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--electron-blue)" } as any}
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: "var(--electron-red)" }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}