import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainDashboard from './components/MainDashboard';
import ChatInterface from './components/ChatInterface';
import SavedIdeas from './components/SavedIdeas';
import TrendingReddit from './components/TrendingReddit';
import PlatformMetrics from './components/PlatformMetrics';
import { Toaster } from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <MainDashboard />;
      case 'chat': return <ChatInterface />;
      case 'ideas': return <SavedIdeas />;
      case 'reddit': return <TrendingReddit />;
      case 'metrics': return <PlatformMetrics />;
      default: return <MainDashboard />;
    }
  };

  return (
    <div className="app-container">
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          style: { background: '#1e1f24', color: '#fff', border: '1px solid #2d2e35' },
          success: { iconTheme: { primary: '#4ade80', secondary: '#1e1f24' } }
        }} 
      />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <Header />
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
