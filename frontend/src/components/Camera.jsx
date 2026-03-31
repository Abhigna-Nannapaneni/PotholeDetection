import React, { useRef, useState } from 'react';
import './Camera.css';

function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera");
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    
    // Send to backend for detection
    sendForDetection(imageData);
  };

  const sendForDetection = async (imageData) => {
    // Implement API call to /detect-base64 endpoint
    // Similar to upload but with base64
  };

  return (
    <div className="camera-container">
      <video ref={videoRef} autoPlay playsInline className="camera-preview" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!streaming && (
        <button onClick={startCamera} className="camera-button">
          📷 Start Camera
        </button>
      )}
      {streaming && (
        <button onClick={captureImage} className="capture-button">
          Capture & Detect
        </button>
      )}
      {capturedImage && (
        <img src={capturedImage} alt="Captured" className="captured-image" />
      )}
    </div>
  );
}

export default Camera;