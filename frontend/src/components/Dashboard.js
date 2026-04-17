import React, { useState } from 'react';
import './Dashboard.css';
import FoodIdentifier from './FoodIdentifier';
import MealPlanner from './MealPlanner';
import NutritionInfo from './NutritionInfo';

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
          className={`nav-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          Plan Meal
        </button>
        <button
          className={`nav-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrition')}
        >
          Nutrition Info
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'identify' && (
          <FoodIdentifier apiUrl={apiUrl} />
        )}
        {activeTab === 'plan' && (
          <MealPlanner apiUrl={apiUrl} />
        )}
        {activeTab === 'nutrition' && (
          <NutritionInfo apiUrl={apiUrl} />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
