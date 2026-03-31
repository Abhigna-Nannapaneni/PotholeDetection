import React, { useState, useRef } from "react";
import axios from "axios";
import "./Upload.css";

function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/detect",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000
        }
      );

      if (res.data.success) {
        // Format detections for better display
        const formattedDetections = res.data.detections.map(d => ({
          ...d,
          confidencePercent: (d.confidence * 100).toFixed(1)
        }));
        
        setResult({
          result_url: res.data.result_url,
          total_detections: res.data.total_detections,
          detections: formattedDetections,
          best_confidence: res.data.total_detections > 0 
            ? Math.max(...res.data.detections.map(d => d.confidence * 100)).toFixed(1)
            : 0
        });
      } else {
        setError("Detection failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>📸 Pothole Detection</h2>
        <p className="subtitle">Upload an image to detect and mark potholes</p>

        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          {!preview ? (
            <div className="upload-placeholder">
              <div className="upload-icon">📷</div>
              <p>Click or drag image here</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Supports JPG, PNG</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
          ) : (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-image" />
              <button onClick={(e) => {
                e.stopPropagation();
                resetForm();
              }} className="remove-button">
                ✕
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {preview && !result && (
          <button 
            onClick={handleUpload} 
            className="upload-button"
            disabled={loading}
          >
            {loading ? (
              <div className="loader">
                <div className="loader-spinner"></div>
                Analyzing Image...
              </div>
            ) : (
              "🔍 Detect Potholes"
            )}
          </button>
        )}

        {result && (
          <div className="result-container">
            <h3>🎯 Detection Results</h3>
            <div className="result-stats">
              <div className="stat-card">
                <span className="stat-number">{result.total_detections}</span>
                <span className="stat-label">Potholes Found</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{result.best_confidence}%</span>
                <span className="stat-label">Highest Confidence</span>
              </div>
            </div>
            
            {result.detections.length > 0 && (
              <div className="detections-list">
                <h4>Detection Details:</h4>
                {result.detections.map((det, idx) => (
                  <div key={idx} className="detection-item">
                    <span className="detection-label">Pothole {idx + 1}</span>
                    <span className="detection-confidence">
                      Confidence: {det.confidencePercent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="image-comparison">
              <div className="image-item">
                <h4>📷 Original Image</h4>
                <img src={preview} alt="Original" className="comparison-image" />
              </div>
              <div className="image-item">
                <h4>🎯 Detected Potholes</h4>
                <img 
                  src={result.result_url} 
                  alt="Detection Result" 
                  className="comparison-image"
                  onLoad={() => console.log("Result image loaded")}
                  onError={(e) => {
                    console.error("Failed to load result image");
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23999' font-size='14'%3EUnable to load result%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
            
            <button onClick={resetForm} className="new-detection-button">
              Upload New Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;