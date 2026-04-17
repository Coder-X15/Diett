import React, { useState, useRef, useEffect } from 'react';
import './FoodIdentifier.css';

function FoodIdentifier({ apiUrl }) {
  const [image, setImage] = useState('');
  const [result, setResult] = useState(null);
  const [nutritionResult, setNutritionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setError('');
    } catch (err) {
      setError('Error accessing camera: ' + err.message);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      stopCamera();
    }
  };

  const clearImage = () => {
    setImage('');
    setResult(null);
    setNutritionResult(null);
    setError('');
  };

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
      setError('Please select or capture an image');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setNutritionResult(null);

    try {
      const inferenceResponse = await fetch(`${apiUrl}/id_food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      });

      if (!inferenceResponse.ok) {
        throw new Error('Failed to identify food');
      }

      const data = await inferenceResponse.json();
      setResult(data);

      let foodClass = "Unknown";
      if (Array.isArray(data) && data.length > 0) {
        foodClass = data[0].food || data[0].class || data[0].name || "Unknown";
      } else if (typeof data === 'string') {
        foodClass = data;
      } else if (data.class) foodClass = data.class;
      else if (data.name) foodClass = data.name;
      else if (data.food) foodClass = data.food;
      else if (data.result) foodClass = data.result;
      else if (typeof data === 'object') {
        const firstVal = Object.values(data)[0];
        if (firstVal && typeof firstVal === 'string') foodClass = firstVal;
        else foodClass = JSON.stringify(firstVal);
      }

      if (foodClass && foodClass !== "Unknown") {
        const nutritionMenu = {
          day: "Today",
          breakfast: [foodClass],
          lunch: [],
          dinner: []
        };
        const nutritionResponse = await fetch(`${apiUrl}/nutrition`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nutritionMenu),
        });

        if (nutritionResponse.ok) {
          const nutritionData = await nutritionResponse.json();
          setNutritionResult(nutritionData);
        } else {
          console.error("Failed to query nutrition info");
        }
      }
    } catch (err) {
      setError('Error identifying food: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="food-identifier-card">
      <h2>Food Identifier</h2>
      <p className="subtitle">Upload or capture a food image to identify it</p>

      {!isCameraOpen && (
        <div className="camera-controls">
          <button className="camera-btn" onClick={startCamera}>Open Camera</button>
        </div>
      )}

      {isCameraOpen && (
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-feed"
          ></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          <div className="camera-actions">
            <button className="capture-btn" onClick={capturePhoto}>Capture Photo</button>
            <button className="cancel-btn" onClick={stopCamera}>Cancel</button>
          </div>
        </div>
      )}

      {!isCameraOpen && (
        <div className="image-upload">
            <span style={{color: '#888', margin: '0 10px'}}>OR</span>
          <br/>
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
      )}

      {image && !isCameraOpen && (
        <div className="image-preview">
          <img src={image} alt="Selected food" />
          <button className="remove-image-btn" onClick={clearImage}>Remove Image</button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <button
        className="identify-btn"
        onClick={handleIdentify}
        disabled={!image || loading || isCameraOpen}
      >
        {loading ? 'Analyzing...' : 'Identify Food'}
      </button>

      {result && (
        <div className="result-card">
          <h3>Identified Food</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          
          {nutritionResult && (
            <div className="nutrition-section">
                <h4>Nutritional Info</h4>
                <div className="nutrition-grid">
                    <div className="nutrition-item">
                        <span className="nutrition-value">{nutritionResult.calories || 0}</span>
                        <span className="nutrition-label">Calories</span>
                    </div>
                    <div className="nutrition-item">
                        <span className="nutrition-value">{nutritionResult.protein || 0}g</span>
                        <span className="nutrition-label">Protein</span>
                    </div>
                    <div className="nutrition-item">
                        <span className="nutrition-value">{nutritionResult.carbs || 0}g</span>
                        <span className="nutrition-label">Carbs</span>
                    </div>
                    <div className="nutrition-item">
                        <span className="nutrition-value">{nutritionResult.fat || 0}g</span>
                        <span className="nutrition-label">Fat</span>
                    </div>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FoodIdentifier;
