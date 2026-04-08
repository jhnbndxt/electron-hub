import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const quickPrompts = [
  "What strand should I choose?",
  "Help me with enrollment",
  "What are the requirements?",
  "Tell me about STEM",
  "What programs are available?",
];

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Electron Hub assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(input),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 800);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] shadow-lg z-50"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-[#1E3A8A] text-white p-4 rounded-t-lg">
            <h3 className="text-lg">Electron Hub Assistant</h3>
            <p className="text-sm text-blue-100">
              Ask me anything about enrollment and strands
            </p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-[#1E3A8A] text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-blue-200"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                className="bg-[#B91C1C] hover:bg-[#991B1B]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("strand") || lower.includes("choose")) {
    return "To help you choose the right strand, I recommend taking our AI-Assisted Assessment. It will analyze your skills, interests, and career goals to recommend the best strand for you. Would you like to start the assessment?";
  }

  if (lower.includes("stem")) {
    return "STEM (Science, Technology, Engineering, and Mathematics) is perfect for students interested in pursuing careers in engineering, medicine, research, and technology. It focuses on advanced mathematics, physics, chemistry, and biology.";
  }

  if (lower.includes("abm")) {
    return "ABM (Accountancy, Business and Management) is designed for students who want to pursue business, accounting, management, and entrepreneurship. It covers business finance, marketing, and organization management.";
  }

  if (lower.includes("gas")) {
    return "GAS (General Academic Strand) offers flexibility for students who are still undecided about their career path or want to explore various disciplines before specializing in college.";
  }

  if (lower.includes("tvl")) {
    return "TVL (Technical-Vocational-Livelihood) prepares students for employment or entrepreneurship immediately after senior high school. It includes specializations in ICT, Home Economics, and Industrial Arts.";
  }

  if (lower.includes("enroll") || lower.includes("requirement")) {
    return "To enroll, you'll need: 1) Completed Assessment Form, 2) Form 138 (Report Card), 3) Birth Certificate, 4) 2x2 ID Photos, 5) Good Moral Certificate. You can start your enrollment online through our portal!";
  }

  if (lower.includes("program") || lower.includes("course")) {
    return "Electron College offers various technology-focused programs including Computer Technology, Electronics Technology, Electrical Technology, and more. Would you like to explore our complete program offerings?";
  }

  return "I'm here to help! You can ask me about strand recommendations, enrollment requirements, assessment procedures, or our available programs. What would you like to know?";
}
