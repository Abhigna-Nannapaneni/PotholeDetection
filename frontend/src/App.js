import React, { useState } from 'react';
import Upload from './components/Upload';
import Camera from './components/Camera';
import History from './components/History';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'camera', 'history'

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🚧 Pothole Detection System</h1>
          <p>AI-powered road condition monitoring</p>
        </div>
      </header>

      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📸 Upload Image
        </button>
        <button 
          className={`tab-button ${activeTab === 'camera' ? 'active' : ''}`}
          onClick={() => setActiveTab('camera')}
        >
          📷 Live Camera
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Detection History
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'upload' && <Upload />}
        {activeTab === 'camera' && <Camera />}
        {activeTab === 'history' && <History />}
      </div>

      <footer className="app-footer">
        <p>Powered by YOLOv8 | Real-time Pothole Detection</p>
      </footer>
    </div>
  );
}

export default App;