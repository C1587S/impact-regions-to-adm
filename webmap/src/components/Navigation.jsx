// src/components/Navigation.jsx
import React from 'react';
import './Navigation.css';

const Navigation = ({ currentTab }) => {
  return (
    <nav className="nav">
      {['Map', 'Documentation', 'Exploration'].map(tab => (
        <button
          key={tab}
          className={`nav-btn ${currentTab === tab ? 'active' : ''}`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
