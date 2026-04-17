import React, { useState } from 'react';
import './FoodIdentifier.css';

function FoodIdentifier({ apiUrl }) {
  const [image, setImage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentify = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/id_food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to identify food');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Error identifying food: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="food-identifier-card">
      <h2>Food Identifier</h2>
      <p className="subtitle">Upload a food image to identify it</p>

      <div className="image-upload">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          id="image-input"
          className="file-input"
        />
        <label htmlFor="image-input" className="file-label">
          Choose Image
        </label>
      </div>

      {image && (
        <div className="image-preview">
          <img src={image} alt="Selected food" />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <button
        className="identify-btn"
        onClick={handleIdentify}
        disabled={!image || loading}
      >
        {loading ? 'Identifying...' : 'Identify Food'}
      </button>

      {result && (
        <div className="result-card">
          <h3>Identified Food</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FoodIdentifier;
