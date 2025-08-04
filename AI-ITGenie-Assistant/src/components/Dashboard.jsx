import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Loader2, Sparkles, User } from "lucide-react";
import Prompt from "./Prompt";
import API_BASE_URL from "../config/config";

const makeAIRequest = async (
  question,
  connectionMode,
  selectedModel,
  sessionId,
  setSessionId
) => {
  try {
    const requestBody = {
      isOnline: connectionMode === "online" ? 1 : 0,
      question: question.trim(),
      llm: selectedModel,
      ...(sessionId && { sessionId }),
    };
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setSessionId(data.sessionId);
    return {
      success: true,
      data: data.answer,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

const Dashboard = ({
  selectedModel,
  connectionMode,
  selectedChatHistory,
  sessionId,
  setSessionId,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedChatHistory && selectedChatHistory.length > 0) {
      setConversation(
        selectedChatHistory.map((msg) => ({
          role: msg.type === "user" ? "user" : "ai",
          content: msg.content,
        }))
      );
    } else {
      setConversation([]);
    }
  }, [selectedChatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError("");
    const userMessage = { role: "user", content: prompt };
    setConversation((prev) => [...prev, userMessage]);

    try {
      const result = await makeAIRequest(
        prompt,
        connectionMode,
        selectedModel,
        sessionId,
        setSessionId
      );
      if (result.success) {
        setConversation((prev) => [
          ...prev,
          { role: "ai", content: result.data },
        ]);
        setPrompt("");
      } else {
        setError(result.error || "Failed to get AI response");
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white-900 p-6 pb-4 overflow-hidden">
      {/* Header */}
      {conversation.length === 0 && !isLoading && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#45c4e9] via-[#54b3a6] to-[#005c97] bg-clip-text text-transparent mb-2 tracking-wider">
            Welcome to ITGenie, your AI-powered IT support{" "}
          </h2>
          <p className="text-gray-500">How can we assist you today? </p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full overflow-hidden">
        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto mb-4 dropdown-scroll space-y-4 px-2">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg border text-sm leading-relaxed
                  ${
                    msg.role === "user"
                      ? "bg-blue-50 border-blue-200 text-blue-900 rounded-bl-none"
                      : "border-[#42adc6] text-[#42adc6] rounded-br-none bg-cyan-50"
                  }
                `}
              >
                <div className="flex items-center gap-2mb-1">
                  {msg.role === "user" ? (
                    <div className="mb-2 flex items-center gap-2">
                      <User size={16} className="text-blue-500" />
                      <span className="font-semibold text-blue-600">You</span>
                    </div>
                  ) : (
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-[#42adc6]" />
                      <span className="font-semibold text-[#42adc6]">AI</span>
                    </div>
                  )}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end">
              <div className="max-w-[70%] px-4 py-3 rounded-lg border border-[#42adc6] bg-cyan-100 text-[#42adc6] rounded-br-none flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-6 bg-red-100 rounded-lg border border-red-300">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={18} className="text-red-500" />
              <span className="text-red-500 font-medium">Error</span>
            </div>
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Prompt */}
        <div className="sticky bottom-0 bg-white">
          <Prompt
            handleSubmit={handleSubmit}
            setPrompt={setPrompt}
            prompt={prompt}
            handleKeyPress={handleKeyPress}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
