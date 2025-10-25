const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  const startUrl = `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startUrl);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// Addons Management
// ============================================

const ADDONS_FILE = path.join(app.getPath('userData'), 'addons.json');

const loadAddons = () => {
  try {
    if (fs.existsSync(ADDONS_FILE)) {
      return JSON.parse(fs.readFileSync(ADDONS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading addons:', err);
  }
  return [];
};

const saveAddons = (addons) => {
  fs.writeFileSync(ADDONS_FILE, JSON.stringify(addons, null, 2));
};

ipcMain.handle('get-addons', () => loadAddons());

ipcMain.handle('add-addon', (event, { name, url }) => {
  const addons = loadAddons();
  const newAddon = {
    id: Date.now().toString(),
    name,
    url,
    enabled: true,
    addedAt: new Date(),
  };
  addons.push(newAddon);
  saveAddons(addons);
  return newAddon;
});

ipcMain.handle('remove-addon', (event, id) => {
  let addons = loadAddons();
  addons = addons.filter((a) => a.id !== id);
  saveAddons(addons);
  return true;
});

ipcMain.handle('toggle-addon', (event, id) => {
  let addons = loadAddons();
  const addon = addons.find((a) => a.id === id);
  if (addon) {
    addon.enabled = !addon.enabled;
    saveAddons(addons);
  }
  return addon;
});

// ============================================
// Search
// ============================================

const fetchFromAddon = async (addonUrl, searchQuery) => {
  try {
    const manifestUrl = addonUrl.replace(/\/$/, '') + '/manifest.json';
    const manifestRes = await axios.get(manifestUrl, { timeout: 5000 });
    const manifest = manifestRes.data;
    const catalog = manifest.catalogs[0];
    if (!catalog) return [];
    const searchUrl = `${addonUrl}/catalog/${catalog.type}/${catalog.id}/search/${encodeURIComponent(searchQuery)}.json`;
    const res = await axios.get(searchUrl, { timeout: 10000 });
    return res.data.metas || [];
  } catch (err) {
    console.error('Error fetching from addon:', err.message);
    return [];
  }
};

ipcMain.handle('search', async (event, query) => {
  const addons = loadAddons().filter((a) => a.enabled);
  const allResults = {};
  const searchPromises = addons.map(async (addon) => {
    const results = await fetchFromAddon(addon.url, query);
    return { addon: addon.name, results };
  });
  const responses = await Promise.all(searchPromises);
  responses.forEach(({ addon, results }) => {
    if (results.length > 0) {
      allResults[addon] = results.slice(0, 5);
    }
  });
  return allResults;
});

ipcMain.handle('get-streams', async (event, { addonUrl, type, id }) => {
  try {
    const streamsUrl = `${addonUrl}/stream/${type}/${id}.json`;
    const res = await axios.get(streamsUrl, { timeout: 10000 });
    return res.data.streams || [];
  } catch (err) {
    console.error('Error fetching streams:', err.message);
    return [];
  }
});

// ============================================
// Subtitles
// ============================================

const SUBTITLES_CACHE = path.join(app.getPath('userData'), 'subtitles-cache.json');

const loadSubtitlesCache = () => {
  try {
    if (fs.existsSync(SUBTITLES_CACHE)) {
      return JSON.parse(fs.readFileSync(SUBTITLES_CACHE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading subtitles cache:', err);
  }
  return {};
};

const saveSubtitlesCache = (cache) => {
  fs.writeFileSync(SUBTITLES_CACHE, JSON.stringify(cache, null, 2));
};

ipcMain.handle('search-subtitles', async (event, { movieName, season, episode }) => {
  try {
    const cache = loadSubtitlesCache();
    const cacheKey = `${movieName}-s${season}e${episode}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }
    const openSubtitlesUrl = 'https://opensubtitles-stremio.vercel.app';
    const type = season ? 'series' : 'movie';
    let subtitlesUrl;
    if (season) {
      subtitlesUrl = `${openSubtitlesUrl}/subtitles/${type}/${movieName}:${season}:${episode}.json`;
    } else {
      subtitlesUrl = `${openSubtitlesUrl}/subtitles/${type}/${movieName}.json`;
    }
    const res = await axios.get(subtitlesUrl, { timeout: 10000 });
    const subtitles = res.data.subtitles || [];
    cache[cacheKey] = subtitles;
    saveSubtitlesCache(cache);
    return subtitles;
  } catch (err) {
    console.error('Error searching subtitles:', err.message);
    return [];
  }
});

ipcMain.handle('get-subtitle-languages', async (event, subtitles) => {
  const languages = {};
  subtitles.forEach((sub) => {
    const lang = sub.lang || 'Unknown';
    if (!languages[lang]) {
      languages[lang] = [];
    }
    languages[lang].push(sub);
  });
  return languages;
});

ipcMain.handle('get-subtitle-preference', async (event, movieId) => {
  const prefsFile = path.join(app.getPath('userData'), 'subtitle-prefs.json');
  try {
    if (fs.existsSync(prefsFile)) {
      const prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8'));
      return prefs[movieId] || 'English';
    }
  } catch (err) {
    console.error('Error loading prefs:', err);
  }
  return 'English';
});

ipcMain.handle('save-subtitle-preference', async (event, { movieId, language }) => {
  const prefsFile = path.join(app.getPath('userData'), 'subtitle-prefs.json');
  let prefs = {};
  try {
    if (fs.existsSync(prefsFile)) {
      prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading prefs:', err);
  }
  prefs[movieId] = language;
  fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
  return prefs[movieId];
});

// ============================================
// Watch History
// ============================================

const HISTORY_FILE = path.join(app.getPath('userData'), 'watch-history.json');

const loadHistory = () => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading history:', err);
  }
  return [];
};

const saveHistory = (history) => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

ipcMain.handle('add-to-history', async (event, item) => {
  let history = loadHistory();
  history = history.filter(h => h.id !== item.id);
  const entry = {
    ...item,
    watchedAt: new Date(),
  };
  history.unshift(entry);
  history = history.slice(0, 100);
  saveHistory(history);
  return entry;
});

ipcMain.handle('get-history', async (event) => loadHistory());

ipcMain.handle('clear-history', async (event) => {
  saveHistory([]);
  return true;
});

// ============================================
// Favorites
// ============================================

const FAVORITES_FILE = path.join(app.getPath('userData'), 'favorites.json');

const loadFavorites = () => {
  try {
    if (fs.existsSync(FAVORITES_FILE)) {
      return JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading favorites:', err);
  }
  return [];
};

const saveFavorites = (favorites) => {
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
};

ipcMain.handle('add-favorite', async (event, item) => {
  let favorites = loadFavorites();
  if (!favorites.find(f => f.id === item.id)) {
    const favorite = {
      ...item,
      addedAt: new Date(),
    };
    favorites.unshift(favorite);
    saveFavorites(favorites);
    return favorite;
  }
  return null;
});

ipcMain.handle('remove-favorite', async (event, id) => {
  let favorites = loadFavorites();
  favorites = favorites.filter(f => f.id !== id);
  saveFavorites(favorites);
  return true;
});

ipcMain.handle('get-favorites', async (event) => loadFavorites());

ipcMain.handle('is-favorite', async (event, id) => {
  const favorites = loadFavorites();
  return favorites.some(f => f.id === id);
});

// ============================================
// Settings
// ============================================

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings = {
  theme: 'dark',
  language: 'en',
  autoPlayNextEpisode: true,
  defaultSubtitleLanguage: 'English',
  defaultStreamQuality: 'high',
  enableNotifications: true,
  playerAutoplay: true,
  cacheStreamResults: true,
  cacheDurationHours: 24,
};

const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return { ...defaultSettings, ...saved };
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return defaultSettings;
};

const saveSettings = (settings) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

ipcMain.handle('get-settings', async (event) => loadSettings());

ipcMain.handle('update-setting', async (event, { key, value }) => {
  let settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
});
