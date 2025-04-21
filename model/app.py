from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import torch
import os
from ultralytics import YOLO
import signal
import sys
import traceback

app = Flask(__name__)
# Enable CORS for all routes with specific settings
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001", "*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Add CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Get the current directory path
current_dir = os.path.dirname(os.path.abspath(__file__))

# Force CPU usage to avoid CUDA compatibility issues
device = "cpu"
print(f"Using device: {device}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA device count: {torch.cuda.device_count()}")
    print(f"CUDA device name: {torch.cuda.get_device_name(0)}")

# Use relative path for model
model_path = os.path.join(current_dir, "best.pt")
try:
    model = YOLO(model_path)
    # Explicitly set the model to use CPU
    model.to(device)
    print(f"Model loaded successfully from {model_path}")
except Exception as e:
    print(f"Error loading model: {e}")
    print(traceback.format_exc())
    sys.exit(1)

# Class names
class_names = ['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'Bags Theft', 'Undefined']

# Video capture setup
camera_index = 0  # Default webcam
cap = None

# Store latest detections
latest_detections = []

def initialize_camera():
    """Initialize the camera and return the capture object."""
    global cap
    try:
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            raise Exception(f"Failed to open camera at index {camera_index}")
        print(f"Camera initialized successfully at index {camera_index}")
        return True
    except Exception as e:
        print(f"Error initializing camera: {e}")
        return False

def cleanup_resources():
    """Release resources when the application is closing."""
    if cap is not None and cap.isOpened():
        cap.release()
        print("Camera released successfully")
    cv2.destroyAllWindows()
    print("Resources cleaned up")

def generate_frames():
    """Video frame generator for streaming with detection overlay."""
    global latest_detections, cap
    
    if cap is None or not cap.isOpened():
        if not initialize_camera():
            return

    # Get detection settings
    show_boxes = app.config.get('SHOW_BOXES', True)
    show_labels = app.config.get('SHOW_LABELS', True)
    confidence_threshold = app.config.get('CONFIDENCE_THRESHOLD', 0.3)
    
    while True:
        try:
            success, frame = cap.read()
            if not success:
                print("Failed to read frame from camera")
                # Try to reinitialize camera
                if initialize_camera():
                    continue
                else:
                    break

            # Run YOLO detection
            results = model(frame, conf=confidence_threshold)[0]

            detections = []  # Store detections for this frame

            for box in results.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = class_names[class_id]

                # Draw bounding box and label on frame if settings allow
                if show_boxes:
                    color = (0, 255, 0)  # Green
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                if show_labels:
                    label = f'{class_name}: {confidence:.2%}'  # Convert to percentage
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                detections.append({
                    "label": class_name,
                    "confidence": round(confidence * 100, 2)  # Convert to percentage
                })

            # Update latest detections
            latest_detections = detections

            # Encode frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
        except Exception as e:
            print(f"Error processing frame: {e}")
            # Wait a bit before trying again
            import time
            time.sleep(1)

@app.route('/video_feed')
def video_feed():
    """Stream video with detection overlay."""
    # Get parameters from query string for detection settings
    show_boxes = request.args.get('show_boxes', 'true').lower() == 'true'
    show_labels = request.args.get('show_labels', 'true').lower() == 'true'
    confidence_threshold = float(request.args.get('confidence', '30')) / 100.0  # Convert from % to decimal
    
    # Store settings in app config for use in generate_frames
    app.config['SHOW_BOXES'] = show_boxes
    app.config['SHOW_LABELS'] = show_labels
    app.config['CONFIDENCE_THRESHOLD'] = confidence_threshold
    
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detections')
def get_detections():
    """Return the latest detection results as JSON."""
    return jsonify({"detections": latest_detections})

@app.route('/')
def index():
    """Simple index page with links to the video feed and detections."""
    return """
    <html>
        <head>
            <title>Object Detection</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    text-align: center;
                }
                h1 {
                    color: #333;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    max-width: 800px;
                    margin: 0 auto;
                }
                img {
                    max-width: 100%;
                    margin-bottom: 20px;
                    border: 1px solid #ddd;
                }
                #detections {
                    width: 100%;
                    min-height: 100px;
                    border: 1px solid #ddd;
                    padding: 10px;
                    margin-bottom: 20px;
                    text-align: left;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Object Detection</h1>
                <img src="/video_feed" alt="Video Feed">
                <h2>Detections:</h2>
                <div id="detections">Loading...</div>
            </div>
            <script>
                // Update detections every second
                setInterval(function() {
                    fetch('/detections')
                        .then(response => response.json())
                        .then(data => {
                            const detections = document.getElementById('detections');
                            if (data.detections.length === 0) {
                                detections.innerHTML = 'No objects detected';
                            } else {
                                let html = '<ul>';
                                data.detections.forEach(detection => {
                                    html += `<li>${detection.label}: ${detection.confidence}%</li>`;
                                });
                                html += '</ul>';
                                detections.innerHTML = html;
                            }
                        })
                        .catch(err => {
                            console.error('Error fetching detections:', err);
                        });
                }, 1000);
            </script>
        </body>
    </html>
    """

# Handle signals for proper cleanup
def signal_handler(sig, frame):
    print('Shutting down...')
    cleanup_resources()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == '__main__':
    try:
        # Initialize camera before starting the app
        if initialize_camera():
            print("Starting Flask server...")
            app.run(host='0.0.0.0', port=5000, debug=False)
        else:
            print("Failed to initialize camera. Exiting.")
    finally:
        cleanup_resources()