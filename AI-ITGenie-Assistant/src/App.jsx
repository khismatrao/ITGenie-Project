import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import Dashboard from './components/Dashboard';


// Main Component
const App = () => {
  const [selectedModel, setSelectedModel] = useState('mistral-small');
  const [connectionMode, setConnectionMode] = useState('online');
  const [selectedChat, setSelectedChat] = useState('');

  const [selectedChatHistory, setSelectedChatHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null); 

  return (
  <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        setSelectedChatHistory={setSelectedChatHistory}
        setSessionId={setSessionId}
      />

      {/* Main */}
      <Dashboard 
      selectedModel={selectedModel}
      connectionMode={connectionMode}
      selectedChatHistory={selectedChatHistory}
      sessionId={sessionId}
      setSessionId={setSessionId}
      />
    </div>
  );
};

export default App;