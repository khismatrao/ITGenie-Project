import { useState, useEffect } from "react";
import { MessageSquare, Bot, SquarePen, Wifi, WifiOff } from "lucide-react";
import { Dropdown } from "./reusable/Dropdown";
import Logo from "../assets/LOGO.png";
import API_BASE_URL from "../config/config";

export const Sidebar = ({
  selectedModel,
  setSelectedModel,
  connectionMode,
  setConnectionMode,
  selectedChat,
  setSelectedChat,
  setSelectedChatHistory,
  setSessionId,
}) => {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  console.log(connectionMode, "model");

  const getHistory = () => {
    fetch(`${API_BASE_URL}/sessions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) {
          setChatHistory(data.sessions);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch sessions:", err);
      });
  };
  useEffect(() => {
    getHistory();
  }, []);

  // Fetch chat history
  useEffect(() => {
    if (selectedChat) {
      fetch(`${API_BASE_URL}/history/${selectedChat}`)
        .then((res) => res.json())
        .then((data) => {
          setSelectedChatHistory(data.messages || []);
          setSessionId(data.sessionId);
        })
        .catch((err) => {
          console.error("Failed to fetch chat history:", err);
          setSelectedChatHistory([]);
        });
    } else {
      setSelectedChatHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  const models =
    connectionMode === "online"
      ? [
          {
            id: "mistral-small",
            name: "Mistral",
            description: "Most accurate model",
          },
          {
            id: "command-r-plus",
            name: "Cohere",
            description: "Good for General Tasks",
          },
        ]
      : [
          { id: "llama3.2", name: "Llama", description: "Runs on your device" },
          {
            id: "deepseek-r1:latest",
            name: "Deepseek",
            description: "Secured one",
          },
        ];

  return (
    <div className="w-80 h-screen bg-blue-50 border-r border-blue-200 flex flex-col">
      <div className="w-full flex flex-col items-center border-b px-4 py-3 bg-blue-100">
        <img width="100" alt="logo" src={Logo} />
        <p className="mt-2 text-sm font-bold" style={{ color: "#15273f" }}>
          IT Genie{" "}
        </p>
      </div>

      <div className="space-y-6 flex-1 p-6">
        {/* New chat */}
        <div className="w-full flex items-center p-3 gap-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-200 text-blue-900">
          <SquarePen size={18} color="#45c4e9" />
          <button
            className="text-sm w-full text-start"
            onClick={() => {
              setSelectedChat("");
              setSelectedChatHistory([]);
              setSessionId(null);
              getHistory();
            }}
          >
            New Chat
          </button>
        </div>
        {/* Connection Mode */}
        <div>
          <label className="block text-blue-900 text-sm font-medium mb-3">
            Connection Mode
          </label>
          <Dropdown
            isOpen={isModeOpen}
            setIsOpen={setIsModeOpen}
            value={connectionMode === "online" ? "Online" : "Offline"}
            icon={connectionMode === "online" ? Wifi : WifiOff}
          >
            <button
              onClick={() => {
                setConnectionMode("online");
                setIsModeOpen(false);
              }}
              className="w-full p-3 text-left hover:bg-blue-200 transition-colors border-b border-blue-200 flex items-center gap-3"
            >
              <Wifi size={16} className="text-green-400" />
              <div>
                <div className="text-blue-900 text-sm font-medium">Online</div>
                <div className="text-blue-700 text-xs">
                  Real-time AI responses
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setConnectionMode("offline");
                setIsModeOpen(false);
              }}
              className="w-full p-3 text-left hover:bg-blue-200 transition-colors flex items-center gap-3"
            >
              <WifiOff size={16} className="text-orange-400" />
              <div>
                <div className="text-blue-900 text-sm font-medium">Offline</div>
                <div className="text-blue-700 text-xs">
                  Local processing only
                </div>
              </div>
            </button>
          </Dropdown>
        </div>
        {/* Model Selection */}
        <div>
          <label className="block text-blue-900 text-sm font-medium mb-3">
            Select Model
          </label>
          <Dropdown
            isOpen={isModelOpen}
            setIsOpen={setIsModelOpen}
            value={
              models.find((m) => m.id === selectedModel)?.name ||
              "Select a model"
            }
            icon={Bot}
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id);
                  setIsModelOpen(false);
                }}
                className="w-full p-3 text-left hover:bg-blue-200 transition-colors border-b border-blue-200 last:border-b-0"
              >
                <div className="text-blue-900 text-sm font-medium">
                  {model.name}
                </div>
                <div className="text-blue-700 text-xs mt-1">
                  {model.description}
                </div>
              </button>
            ))}
          </Dropdown>
        </div>
        {/* Chat History */}
        <div className="flex-1">
          <label className="block text-blue-900 text-sm font-medium mb-3">
            Chat History
          </label>
          <Dropdown
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
            value={
              chatHistory.find((chat) => chat.id === selectedChat)?.name ||
              "Select a chat"
            }
            icon={MessageSquare}
          >
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat.id);
                  setIsChatOpen(false);
                }}
                className="w-full p-3 text-left hover:bg-blue-200 transition-colors border-b border-blue-200 last:border-b-0"
              >
                <div className="text-blue-900 text-sm font-medium truncate">
                  {chat.name}
                </div>
              </button>
            ))}
          </Dropdown>
        </div>
      </div>
      <h1 className="p-6 text-xl text-center font-extrabold text-[#45c4e9] m-0 tracking-wide">
        Your Personalized IT Help Center{" "}
      </h1>
      {/* Status Indicator */}
      <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionMode === "online" ? "bg-green-400" : "bg-orange-400"
            }`}
          ></div>
          <span className="text-blue-900 text-sm">
            Status: {connectionMode === "online" ? "Connected" : "Offline Mode"}
          </span>
        </div>
        <div className="text-blue-700 text-xs mt-1">
          Model: {models.find((m) => m.id === selectedModel)?.name}
        </div>
      </div>
    </div>
  );
};
