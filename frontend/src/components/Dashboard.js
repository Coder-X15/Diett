import React, { useState } from 'react';
import './Dashboard.css';
import FoodIdentifier from './FoodIdentifier';
import ChatPage from './ChatPage';

function Dashboard({ user, onSignout, apiUrl }) {
  const [activeTab, setActiveTab] = useState('identify');

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Diet Planner</h1>
          <div className="user-info">
            <span>Welcome, {user?.email || 'User'}</span>
            <button className="signout-btn" onClick={onSignout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'identify' ? 'active' : ''}`}
          onClick={() => setActiveTab('identify')}
        >
          Identify Food
        </button>
        <button
          className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          AI Dietician
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'identify' && (
          <FoodIdentifier apiUrl={apiUrl} />
        )}
        {activeTab === 'chat' && (
          <ChatPage />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
