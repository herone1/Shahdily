import React, { useState, useEffect } from 'react';
import './App.css';
import AddonManager from './components/AddonManager';
import SearchBar from './components/SearchBar';
import Results from './components/Results';
import VideoPlayer from './components/VideoPlayer';
import ItemDetails from './components/ItemDetails';
import WatchHistory from './components/WatchHistory';
import Settings from './components/Settings';
import Favorites from './components/Favorites';
import Downloads from './components/Downloads';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchResults, setSearchResults] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const appSettings = await window.api.getSettings();
    setSettings(appSettings);
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    const results = await window.api.search(query);
    setSearchResults(results);
    setCurrentPage('search');
  };

  const handleSelectItem = (item, addonName, addonUrl) => {
    setSelectedItem({ ...item, addonName, addonUrl });
  };

  const handlePlayStream = (stream) => {
    setSelectedStream(stream);
    setCurrentPage('player');
  };

  return (
    <div className={`app theme-${settings.theme || 'dark'}`}>
      <header className="header">
        <h1>🎬 Shahdily</h1>
        <button
          className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentPage('home')}
        >
          Home
        </button>
        <button
          className={`nav-btn ${currentPage === 'addons' ? 'active' : ''}`}
          onClick={() => setCurrentPage('addons')}
        >
          Addons
        </button>
        <button
          className={`nav-btn ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentPage('history')}
        >
          Watch History
        </button>
        <button
          className={`nav-btn ${currentPage === 'favorites' ? 'active' : ''}`}
          onClick={() => setCurrentPage('favorites')}
        >
          ♥️ Favorites
        </button>
        <button
          className={`nav-btn ${currentPage === 'downloads' ? 'active' : ''}`}
          onClick={() => setCurrentPage('downloads')}
        >
          ⬇️ Downloads
        </button>
        <button
          className={`nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
        >
          ⚙️ Settings
        </button>
      </header>

      <main className="main-content">
        {currentPage === 'home' && (
          <div className="home">
            <SearchBar onSearch={handleSearch} />
            {Object.keys(searchResults).length > 0 && (
              <Results
                results={searchResults}
                onSelectItem={handleSelectItem}
              />
            )}
            {!selectedItem && Object.keys(searchResults).length === 0 && (
              <div className="hero">
                <h2>Welcome to Shahdily</h2>
                <p>Add addons and start searching for content</p>
              </div>
            )}
          </div>
        )}

        {currentPage === 'addons' && <AddonManager />}

        {currentPage === 'player' && selectedStream && (
          <VideoPlayer
            stream={selectedStream}
            item={selectedItem}
            onBack={() => setCurrentPage('home')}
          />
        )}

        {currentPage === 'history' && (
          <WatchHistory onSelectItem={handleSelectItem} />
        )}

        {currentPage === 'favorites' && (
          <Favorites onSelectItem={handleSelectItem} />
        )}

        {currentPage === 'downloads' && (
          <Downloads />
        )}

        {currentPage === 'settings' && (
          <Settings settings={settings} onSettingsChange={loadSettings} />
        )}

        {currentPage === 'search' && selectedItem && (
          <div className="details-page">
            <button className="back-btn" onClick={() => setSelectedItem(null)}>
              ← Back
            </button>
            <ItemDetails
              item={selectedItem}
              onPlayStream={handlePlayStream}
            />
          </div>
        )}
      </main>
    </div>
  );
}
