import React, { useState, useEffect } from 'react';

export default function AddonManager() {
  const [addons, setAddons] = useState([]);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonUrl, setNewAddonUrl] = useState('');

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    const data = await window.api.getAddons();
    setAddons(data);
  };

  const handleAddAddon = async (e) => {
    e.preventDefault();
    if (!newAddonName || !newAddonUrl) return;
    await window.api.addAddon(newAddonName, newAddonUrl);
    setNewAddonName('');
    setNewAddonUrl('');
    loadAddons();
  };

  const handleRemove = async (id) => {
    await window.api.removeAddon(id);
    loadAddons();
  };

  const handleToggle = async (id) => {
    await window.api.toggleAddon(id);
    loadAddons();
  };

  return (
    <div className="addon-manager">
      <h2>Manage Addons</h2>
      <form className="addon-form" onSubmit={handleAddAddon}>
        <input
          type="text"
          placeholder="Addon Name"
          value={newAddonName}
          onChange={(e) => setNewAddonName(e.target.value)}
        />
        <input
          type="url"
          placeholder="Addon URL"
          value={newAddonUrl}
          onChange={(e) => setNewAddonUrl(e.target.value)}
        />
        <button type="submit">Add Addon</button>
      </form>

      <div className="addons-list">
        {addons.length === 0 ? (
          <p>No addons added yet</p>
        ) : (
          addons.map((addon) => (
            <div key={addon.id} className="addon-item">
              <div>
                <h3>{addon.name}</h3>
                <p className="addon-url">{addon.url}</p>
              </div>
              <div className="addon-actions">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={addon.enabled}
                    onChange={() => handleToggle(addon.id)}
                  />
                  <span>{addon.enabled ? 'Enabled' : 'Disabled'}</span>
                </label>
                <button
                  className="delete-btn"
                  onClick={() => handleRemove(addon.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="addon-tips">
        <h3>Popular Addons:</h3>
        <ul>
          <li><strong>Torrentio:</strong> https://torrentio.strem.fun</li>
          <li><strong>OpenSubtitles:</strong> https://opensubtitles-stremio.vercel.app</li>
        </ul>
      </div>
    </div>
  );
}
