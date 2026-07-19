import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './FoodIdentifier.css';

const FoodIdentifier = ({ apiUrl }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    // Preview can be from a file (object URL) or camera (data URL)
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [identificationId, setIdentificationId] = useState(null);
    const [result, setResult] = useState(null);
    const [nutritionData, setNutritionData] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    // Cleanup function to stop camera stream
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraOpen(false);
        }
    }, [stream]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            stopCamera(); // Close camera if a file is selected
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            // Reset previous results
            setResult(null);
            setNutritionData(null);
            setIdentificationId(null);
            setError('');
        }
    };

    const openCamera = async () => {
        if (isCameraOpen) return;
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            setIsCameraOpen(true);
            // Reset file/preview state
            setFile(null);
            setPreview(null);
            setResult(null);
            setNutritionData(null);
            setError('');
        } catch (err) {
            setError('Could not access the camera. Please check permissions.');
            console.error("Camera error:", err);
        }
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setPreview(dataUrl);
            setFile(null); // It's not a file object
            stopCamera();
        }
    };

    const removeImage = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setNutritionData(null);
        setError('');
        // If the preview was an object URL, revoke it to prevent memory leaks
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
    };

    // Effect to handle video stream
    useEffect(() => {
        if (isCameraOpen && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
        // Cleanup stream on component unmount
        return () => stopCamera();
    }, [isCameraOpen, stream, stopCamera]);

    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const handleIdentify = async () => {
        if ((!file && !preview) || !user) {
            setError('Please select or capture an image and be logged in.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setNutritionData(null);
        setIdentificationId(null);

        try {
            let base64Image;
            if (file) {
                base64Image = await toBase64(file);
            } else { // It's a data URL from the camera
                base64Image = preview;
            }

            const response = await fetch(`${apiUrl}/id_food`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    image: base64Image,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to submit image for identification.');
            }

            const data = await response.json();
            if (data.status === 'SUBMITTED' && data.id) {
                setIdentificationId(data.id);
            } else {
                throw new Error('Invalid response from server after submission.');
            }

        } catch (err) {
            setError(`Identification error: ${err.message}`);
            setLoading(false);
        }
    };

    const fetchNutritionInfo = useCallback(async (foodName) => {
        const ninjasApiKey = process.env.REACT_APP_NINJAS_API_KEY;
        if (!ninjasApiKey) {
            setError('Nutrition API key is not configured.');
            return;
        }

        try {
            const response = await fetch(`https://api.api-ninjas.com/v1/nutrition?query=${foodName}`, {
                headers: { 'X-Api-Key': ninjasApiKey },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch nutrition data.');
            }

            const data = await response.json();
            setNutritionData(data);

        } catch (err) {
            setError(`Nutrition fetch error: ${err.message}`);
        }
    }, []);

    // Polling effect to check for identification status
    useEffect(() => {
        if (!identificationId) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${apiUrl}/inference_status?id=${identificationId}`);
                if (!response.ok) {
                    // Stop polling on error, but don't overwrite primary error
                    console.error('Polling failed');
                    clearInterval(interval);
                    return;
                }

                const data = await response.json();
                if (data.status === 'COMPLETED') {
                    setResult(data);
                    setLoading(false);
                    clearInterval(interval);
                    // Once we have the food name, fetch its nutritional info
                    if (data.identified_food_name) {
                        fetchNutritionInfo(data.identified_food_name);
                    }
                }
            } catch (err) {
                setError(`Polling error: ${err.message}`);
                setLoading(false);
                clearInterval(interval);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, [identificationId, apiUrl, fetchNutritionInfo]);

    return (
        <div className="food-identifier-card">
            <h2>Food Identifier</h2>
            <p className="subtitle">Upload an image to identify the food and see its nutritional facts.</p>

            {error && <div className="error-message">{error}</div>}

            {isCameraOpen ? (
                <div className="camera-view">
                    <video ref={videoRef} autoPlay playsInline className="video-feed" />
                    <div className="camera-controls">
                        <button onClick={handleCapture} className="capture-btn">Capture</button>
                        <button onClick={stopCamera} className="cancel-btn">Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    {!preview && (
                        <div className="image-upload">
                            <label htmlFor="file-upload" className="file-label">
                                Choose Image
                            </label>
                            <input type="file" accept="image/*" onChange={handleFileChange} id="file-upload" className="file-input" />
                            <button onClick={openCamera} className="camera-btn">Use Camera</button>
                        </div>
                    )}
                </>
            )}

            {preview && !isCameraOpen && (
                <div className="image-preview">
                    <img src={preview} alt="Preview" />
                    <button onClick={removeImage} className="remove-image-btn">Remove Image</button>
                </div>
            )}

            {preview && !loading && (
                <button onClick={handleIdentify} disabled={loading} className="identify-btn">
                    {loading ? 'Identifying...' : 'Identify Food'}
                </button>
            )}

            {loading && <p>Processing your image. This may take a moment...</p>}

            {result && (
                <div className="result-card">
                    <h3>Identification Complete</h3>
                    <p><strong>Identified Food:</strong> {result.identified_food_name || 'Could not identify'}</p>
                </div>
            )}

            {nutritionData && (
                <div className="nutrition-section">
                    <h4>Nutritional Information (per 100g)</h4>
                    {nutritionData.length > 0 ? (
                        <div className="nutrition-grid">
                            <div className="nutrition-item">
                                <span className="nutrition-value">{nutritionData[0].calories}</span>
                                <span className="nutrition-label">Calories</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{nutritionData[0].protein_g}g</span>
                                <span className="nutrition-label">Protein</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{nutritionData[0].carbohydrates_total_g}g</span>
                                <span className="nutrition-label">Carbs</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{nutritionData[0].fat_total_g}g</span>
                                <span className="nutrition-label">Fat</span>
                            </div>
                        </div>
                    ) : (
                        <p>No nutritional data found for the identified food.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FoodIdentifier;