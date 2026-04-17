import React, { useState } from 'react';
import './NutritionInfo.css';

function NutritionInfo({ apiUrl }) {
  const [meal, setMeal] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetNutrition = async () => {
    if (!meal.trim()) {
      setError('Please enter a meal');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meal: meal.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get nutrition info');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Error getting nutrition info: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nutrition-info-card">
      <h2>Nutritional Information</h2>
      <p className="subtitle">Get nutritional details for any meal</p>

      <div className="form-group">
        <label htmlFor="meal">Meal or Food Item</label>
        <input
          type="text"
          id="meal"
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          placeholder="e.g., grilled chicken breast with broccoli"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleGetNutrition();
            }
          }}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="nutrition-btn"
        onClick={handleGetNutrition}
        disabled={!meal.trim() || loading}
      >
        {loading ? 'Loading...' : 'Get Nutrition Info'}
      </button>

      {result && (
        <div className="nutrition-result">
          <h3>Nutritional Information</h3>
          <div className="nutrition-grid">
            {result.calories !== undefined && (
              <div className="nutrition-item">
                <div className="nutrition-label">Calories</div>
                <div className="nutrition-value">{result.calories}</div>
              </div>
            )}
            {result.protein !== undefined && (
              <div className="nutrition-item">
                <div className="nutrition-label">Protein</div>
                <div className="nutrition-value">{result.protein}g</div>
              </div>
            )}
            {result.carbs !== undefined && (
              <div className="nutrition-item">
                <div className="nutrition-label">Carbs</div>
                <div className="nutrition-value">{result.carbs}g</div>
              </div>
            )}
            {result.fat !== undefined && (
              <div className="nutrition-item">
                <div className="nutrition-label">Fat</div>
                <div className="nutrition-value">{result.fat}g</div>
              </div>
            )}
          </div>
          <div className="full-result">
            <p>Full Response:</p>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default NutritionInfo;
