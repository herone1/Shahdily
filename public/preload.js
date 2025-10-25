const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAddons: () => ipcRenderer.invoke('get-addons'),
  addAddon: (name, url) => ipcRenderer.invoke('add-addon', { name, url }),
  removeAddon: (id) => ipcRenderer.invoke('remove-addon', id),
  toggleAddon: (id) => ipcRenderer.invoke('toggle-addon', id),
  search: (query) => ipcRenderer.invoke('search', query),
  getStreams: (addonUrl, type, id) => ipcRenderer.invoke('get-streams', { addonUrl, type, id }),
  searchSubtitles: (movieName, season, episode) => 
    ipcRenderer.invoke('search-subtitles', { movieName, season, episode }),
  getSubtitleLanguages: (subtitles) => 
    ipcRenderer.invoke('get-subtitle-languages', subtitles),
  getSubtitlePreference: (movieId) => 
    ipcRenderer.invoke('get-subtitle-preference', movieId),
  saveSubtitlePreference: (movieId, language) => 
    ipcRenderer.invoke('save-subtitle-preference', { movieId, language }),
  addToHistory: (item) => 
    ipcRenderer.invoke('add-to-history', item),
  getHistory: () => 
    ipcRenderer.invoke('get-history'),
  clearHistory: () => 
    ipcRenderer.invoke('clear-history'),
  addFavorite: (item) => 
    ipcRenderer.invoke('add-favorite', item),
  removeFavorite: (id) => 
    ipcRenderer.invoke('remove-favorite', id),
  getFavorites: () => 
    ipcRenderer.invoke('get-favorites'),
  isFavorite: (id) => 
    ipcRenderer.invoke('is-favorite', id),
  getSettings: () => 
    ipcRenderer.invoke('get-settings'),
  updateSetting: (key, value) => 
    ipcRenderer.invoke('update-setting', { key, value }),
});
