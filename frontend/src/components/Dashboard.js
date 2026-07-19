import React, { useState } from 'react';
import './Dashboard.css';
import FoodIdentifier from './FoodIdentifier';
import ChatPage from './ChatPage';
import MealPlanner from './MealPlanner';

function Dashboard({ user, onSignout, apiUrl }) {
  const [activeTab, setActiveTab] = useState('mealPlanner');

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
        <button
          className={`nav-btn ${activeTab === 'mealPlanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('mealPlanner')}
        >
          Meal Planner
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'identify' && (
          <FoodIdentifier apiUrl={apiUrl} />
        )}
        {activeTab === 'chat' && (
          <ChatPage />
        )}
        {activeTab === 'mealPlanner' && (
          <MealPlanner apiUrl={apiUrl} />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
