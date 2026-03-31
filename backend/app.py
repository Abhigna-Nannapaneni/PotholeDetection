from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import os
import uuid
import cv2
import json
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"
HISTORY_FILE = "detection_history.json"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
CONFIDENCE_THRESHOLD = 0.25

# Create folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# Load or create history
if os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, 'r') as f:
        try:
            history = json.load(f)
        except:
            history = []
else:
    history = []

# Load model
try:
    model = YOLO("best.pt")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit(1)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_to_history(detection_data):
    """Save detection to history"""
    global history
    history.insert(0, detection_data)  # Add to beginning
    # Keep only last 50 detections
    history = history[:50]
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

@app.route("/detect", methods=["POST"])
def detect():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed"}), 400
        
        # Secure filename and save
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        print(f"📁 Image saved: {filepath}")
        
        # Run YOLO detection
        results = model.predict(
            source=filepath,
            conf=CONFIDENCE_THRESHOLD,
            save=False,
            verbose=True
        )
        
        # Get the result image with bounding boxes
        result_img = results[0].plot()
        
        # Save the result image
        result_filename = f"result_{uuid.uuid4().hex}.jpg"
        result_path = os.path.join(RESULT_FOLDER, result_filename)
        cv2.imwrite(result_path, result_img)
        
        print(f"✅ Detection complete. Result saved: {result_path}")
        
        # Get detection details
        detections = []
        if results[0].boxes is not None:
            for box in results[0].boxes:
                confidence = float(box.conf[0])
                detections.append({
                    'confidence': confidence,
                    'confidence_percent': f"{confidence * 100:.1f}%"
                })
        
        # Prepare response data
        response_data = {
            "success": True,
            "result_url": f"http://localhost:5000/results/{result_filename}",
            "result_image": result_filename,
            "total_detections": len(detections),
            "detections": detections,
            "timestamp": datetime.now().isoformat(),
            "original_image": unique_filename
        }
        
        # Save to history
        history_entry = {
            "id": uuid.uuid4().hex,
            "result_image": result_filename,
            "total_detections": len(detections),
            "detections": detections,
            "timestamp": datetime.now().isoformat(),
            "best_confidence": max([d['confidence'] for d in detections]) if detections else 0
        }
        save_to_history(history_entry)
        
        return jsonify(response_data)
    
    except Exception as e:
        print(f"❌ Error in detect: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def get_history():
    """Get detection history"""
    global history
    return jsonify(history)

@app.route("/results/<filename>")
def get_result(filename):
    return send_from_directory(RESULT_FOLDER, filename)

@app.route("/")
def home():
    return jsonify({
        "status": "running",
        "message": "Pothole Detection API",
        "history_count": len(history)
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)