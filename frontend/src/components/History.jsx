import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './History.css';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/history');
      setHistory(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load detection history. Make sure the backend server is running on port 5000');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loader-spinner"></div>
        <p>Loading detection history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchHistory} className="retry-button">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <div className="empty-icon">📭</div>
        <h3>No detection history yet</h3>
        <p>Upload some images to see detection results here</p>
        <button onClick={fetchHistory} className="refresh-button">
          🔄 Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Detection History</h2>
        <button onClick={fetchHistory} className="refresh-button">
          🔄 Refresh
        </button>
      </div>
      <div className="history-grid">
        {history.map((item, index) => (
          <div key={item.id || index} className="history-card">
            <div className="history-card-header">
              <div className="detection-badge">
                <span className="detection-count">{item.total_detections}</span>
                <span className="detection-label">Pothole{item.total_detections !== 1 ? 's' : ''}</span>
              </div>
              <div className="timestamp-badge">
                {formatDate(item.timestamp)}
              </div>
            </div>
            
            <div className="image-container">
              <img 
                src={`http://localhost:5000/results/${item.result_image}`}
                alt="Detection result"
                className="history-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                }}
              />
              {item.detections && item.detections.length > 0 && (
                <div className="confidence-overlay">
                  Best: {item.best_confidence ? (item.best_confidence * 100).toFixed(1) : 
                    Math.max(...item.detections.map(d => d.confidence * 100)).toFixed(1)}%
                </div>
              )}
            </div>
            
            <div className="history-card-footer">
              <div className="detection-details">
                {item.detections && item.detections.slice(0, 3).map((det, idx) => (
                  <span key={idx} className="confidence-tag">
                    {det.confidence_percent || `${(det.confidence * 100).toFixed(1)}%`}
                  </span>
                ))}
                {item.detections && item.detections.length > 3 && (
                  <span className="more-tag">+{item.detections.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;