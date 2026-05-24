import React, { useState, useRef, useEffect } from 'react';
import './FoodIdentifier.css';
import { useAuth } from '../context/AuthContext';

function FoodIdentifier({ apiUrl }) {
  const [image, setImage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const  { user } = useAuth();

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

    try {
      const inferenceResponse = await fetch(`${apiUrl}/id_food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user ? user.id : null,
          image: image // Base64-encoded image data
        }),
      });

      if (!inferenceResponse.ok) {
        throw new Error('Failed to identify food');
      }

      const data = await inferenceResponse.json();

      // Poll the backend for the inference result
      let inferenceResult = null;
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds
        
        const statusResponse = await fetch(`${apiUrl}/inference_status?id=${data.id}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.status === 'COMPLETED') {
            inferenceResult = statusData.identified_food_name ? { identified_food_name: statusData.identified_food_name } : null;
            break;
          }
        }
        attempts++;
      }

      if (!inferenceResult) {
        throw new Error('Food identification timed out. Please try again.');
      }

      setResult(inferenceResult);
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
          <pre>{result.identified_food_name}</pre>
        </div>
      )}
    </div>
  );
}

export default FoodIdentifier;
