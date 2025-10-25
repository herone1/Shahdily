import React from 'react';

export default function Results({ results, onSelectItem }) {
  return (
    <div className="results">
      {Object.entries(results).map(([addonName, items]) => (
        <div key={addonName} className="addon-results">
          <h3>{addonName}</h3>
          <div className="items-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className="result-item"
                onClick={() => onSelectItem(item, addonName)}
              >
                <img
                  src={item.poster || 'https://via.placeholder.com/150x225'}
                  alt={item.name}
                />
                <h4>{item.name}</h4>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
