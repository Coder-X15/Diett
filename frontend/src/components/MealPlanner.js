import React, { useState } from 'react';
import './MealPlanner.css';

function MealPlanner({ apiUrl }) {
  const [formData, setFormData] = useState({
    day: 'Monday',
    breakfast: '',
    lunch: '',
    dinner: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePlanMeal = async () => {
    if (!formData.breakfast || !formData.lunch || !formData.dinner) {
      setError('Please fill in all meal fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day: formData.day,
          breakfast: formData.breakfast.split(',').map((m) => m.trim()),
          lunch: formData.lunch.split(',').map((m) => m.trim()),
          dinner: formData.dinner.split(',').map((m) => m.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to plan meal');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Error planning meal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateMeal = async () => {
    if (!formData.breakfast || !formData.lunch || !formData.dinner) {
      setError('Please fill in all meal fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day: formData.day,
          breakfast: formData.breakfast.split(',').map((m) => m.trim()),
          lunch: formData.lunch.split(',').map((m) => m.trim()),
          dinner: formData.dinner.split(',').map((m) => m.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate meal');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Error evaluating meal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meal-planner-card">
      <h2>Meal Planner</h2>
      <p className="subtitle">Plan and evaluate your meals (comma-separated)</p>

      <div className="form-group">
        <label htmlFor="day">Day of Week</label>
        <select
          id="day"
          name="day"
          value={formData.day}
          onChange={handleInputChange}
        >
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
          <option>Saturday</option>
          <option>Sunday</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="breakfast">Breakfast Items</label>
        <textarea
          id="breakfast"
          name="breakfast"
          value={formData.breakfast}
          onChange={handleInputChange}
          placeholder="e.g., eggs, toast, orange juice"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="lunch">Lunch Items</label>
        <textarea
          id="lunch"
          name="lunch"
          value={formData.lunch}
          onChange={handleInputChange}
          placeholder="e.g., chicken, rice, vegetables"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="dinner">Dinner Items</label>
        <textarea
          id="dinner"
          name="dinner"
          value={formData.dinner}
          onChange={handleInputChange}
          placeholder="e.g., salmon, sweet potato, salad"
          rows="3"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="button-group">
        <button
          className="action-btn primary"
          onClick={handlePlanMeal}
          disabled={loading}
        >
          {loading ? 'Planning...' : 'Plan Meal'}
        </button>
        <button
          className="action-btn secondary"
          onClick={handleEvaluateMeal}
          disabled={loading}
        >
          {loading ? 'Evaluating...' : 'Evaluate Meal'}
        </button>
      </div>

      {result && (
        <div className="result-card">
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default MealPlanner;
