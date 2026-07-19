import React, { useState, useEffect, useCallback } from 'react';
import './MealPlanner.css';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function MealPlanner({ apiUrl }) {
  const { user } = useAuth(); // Get user from AuthContext
  const [mealPlans, setMealPlans] = useState({}); // Map of day -> plan
  const [editingDay, setEditingDay] = useState(null); // null, 'new', or a day name like 'Monday'
  const [formData, setFormData] = useState({
    day: '', // Will hold the day for the form
    breakfast: '',
    lunch: '',
    dinner: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const fetchMealPlans = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/mealplans?user_id=${user.id}`);

      if (response.status === 404) {
        setMealPlans({}); // No plans exist for the user, set to empty object
      } else if (response.ok) {
        const allPlans = await response.json();

        // Helper to sanitize meal items that might be a single string like "{item1,item2}"
        const cleanMealItems = (items) => {
          if (Array.isArray(items) && items.length === 1 && typeof items[0] === 'string' && items[0].startsWith('{') && items[0].endsWith('}')) {
            const innerString = items[0].slice(1, -1); // Remove curly braces
            return innerString.split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean);
          }
          return items || []; // Return the items if they are clean, or an empty array
        };

        // Sanitize data and convert the array of plans into a map for easy lookup by day
        const plansMap = allPlans.reduce((acc, plan) => {
          acc[plan.day] = {
            ...plan,
            breakfast: cleanMealItems(plan.breakfast),
            lunch: cleanMealItems(plan.lunch),
            dinner: cleanMealItems(plan.dinner),
          };
          return acc;
        }, {});
        setMealPlans(plansMap);

      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch meal plans');
      }
    } catch (err) {
      setError(`Error fetching meal plans: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMealPlans();
    }
  }, [user?.id, fetchMealPlans]);

  const handleSavePlan = async () => {
    // The day to save is now in formData
    if (!formData.day) return;

    setLoading(true);
    setError('');
    try {
      // Helper to convert comma-separated string to a clean string array.
      const toArray = (str) => str ? str.split(',').map(item => item.trim()).filter(Boolean) : [];

      const response = await fetch(`${apiUrl}/mealplans/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          day: formData.day, // Use day from form data
          breakfast: toArray(formData.breakfast),
          lunch: toArray(formData.lunch),
          dinner: toArray(formData.dinner),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save meal plan');
      }

      // Exit edit mode and refetch all plans to show the update
      setEditingDay(null);
      await fetchMealPlans();
    } catch (err) {
      setError(`Error saving meal plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const unplannedDays = DAYS_OF_WEEK.filter(day => !mealPlans[day]);

  const handleEdit = (day) => {
    const plan = mealPlans[day];
    if (!plan) return;

    setEditingDay(day);
    setFormData({
      day: plan.day,
      breakfast: (plan.breakfast || []).join(', '),
      lunch: (plan.lunch || []).join(', '),
      dinner: (plan.dinner || []).join(', '),
    });
  };

  const handleAdd = (day) => {
    setEditingDay('new');
    setFormData({
      day: unplannedDays.length > 0 ? unplannedDays[0] : '', // Default to first available day
      breakfast: '',
      lunch: '',
      dinner: '',
    });
  };

  const handleCancel = () => {
    setEditingDay(null);
    setError('');
  };

  return (
    <div className="meal-planner-container">
      <h2>Meal Planner</h2>
      <p className="subtitle">View your weekly plans or add a new one.</p>

      {error && <div className="error-message">{error}</div>}

      {editingDay !== null ? (
        // FORM VIEW (for adding or editing)
        <div className="meal-plan-form-card">
          <h3>{editingDay === 'new' ? 'Add New Meal Plan' : `Editing ${formData.day}`}</h3>
          <div className="form-group">
            <label htmlFor="day">Day of Week</label>
            {editingDay === 'new' ? (
              <select id="day" name="day" value={formData.day} onChange={handleInputChange} disabled={loading}>
                {unplannedDays.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            ) : (
              <input type="text" id="day" name="day" value={formData.day} readOnly className="read-only-input" />
            )}
          </div>
          <div className="form-group">
            <label htmlFor="breakfast">Breakfast</label>
            <textarea id="breakfast" name="breakfast" value={formData.breakfast} onChange={handleInputChange} placeholder="e.g., eggs, toast" rows="2" />
          </div>
          <div className="form-group">
            <label htmlFor="lunch">Lunch</label>
            <textarea id="lunch" name="lunch" value={formData.lunch} onChange={handleInputChange} placeholder="e.g., chicken salad" rows="2" />
          </div>
          <div className="form-group">
            <label htmlFor="dinner">Dinner</label>
            <textarea id="dinner" name="dinner" value={formData.dinner} onChange={handleInputChange} placeholder="e.g., salmon, rice" rows="2" />
          </div>
          <div className="button-group">
            <button className="action-btn primary" onClick={handleSavePlan} disabled={loading}>
              {loading ? 'Saving...' : 'Save Plan'}
            </button>
            <button className="action-btn secondary" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // DISPLAY VIEW (list of plans)
        <>
          <div className="button-group">
            {unplannedDays.length > 0 && (
              <button className="action-btn primary full-width" onClick={handleAdd} disabled={loading}>
                Add New Meal Plan
              </button>
            )}
          </div>

          {loading && !Object.keys(mealPlans).length && <p>Loading plans...</p>}

          {Object.keys(mealPlans).length > 0 ? (
            <div className="meal-plan-grid">
              {DAYS_OF_WEEK.map(day => {
                const plan = mealPlans[day];
                if (!plan) return null; // Only show cards for days with plans

                return (
                  <div key={day} className="meal-day-card-static">
                    <h3>{day}</h3>
                    <div className="meal-details">
                      <p><strong>Breakfast:</strong> {(plan.breakfast || []).join(', ') || 'N/A'}</p>
                      <p><strong>Lunch:</strong> {(plan.lunch || []).join(', ') || 'N/A'}</p>
                      <p><strong>Dinner:</strong> {(plan.dinner || []).join(', ') || 'N/A'}</p>
                    </div>
                    <button className="action-btn secondary" onClick={() => handleEdit(day)}>Edit</button>
                  </div>
                );
              })}
            </div>
          ) : (
            !loading && <div className="no-plans-message"><p>No meal plans set yet. Add one to get started!</p></div>
          )}
        </>
      )}
    </div>
  );
}

export default MealPlanner;
