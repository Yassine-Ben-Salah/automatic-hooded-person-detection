import cv2
import numpy as np
from ultralytics import YOLO
import time

class SurveillanceSystem:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
        self.class_names = ['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'bags theft', 'undefined']
        self.cap = None
        self.frame_count = 0
        self.start_time = None
        self.conf_threshold = 0.3

    def initialize_camera(self):
        """Initialize the camera capture"""
        self.cap = cv2.VideoCapture(0)  # Use default camera (0)
        if not self.cap.isOpened():
            raise Exception("Could not open video capture")
        self.start_time = time.time()

    def process_frame(self, frame):
        """Process a single frame and return the annotated frame"""
        # Run detection with lower confidence
        results = self.model(frame, conf=self.conf_threshold)[0]
        
        # Create a black background for detection info
        info_bg = np.zeros((100, 200, 3), dtype=np.uint8)
        cv2.putText(info_bg, "Detections:", (10, 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Process each detection
        y_offset = 40
        for box in results.boxes:
            # Get box coordinates
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            
            # Get confidence and class
            confidence = float(box.conf[0].cpu().numpy())
            class_id = int(box.cls[0].cpu().numpy())
            
            # Draw box with different colors based on confidence
            color = (
                int(255 * (1 - confidence)),  # Blue
                int(255 * confidence),        # Green
                0                            # Red
            )
            
            # Draw box
            cv2.rectangle(frame, 
                        (int(x1), int(y1)), 
                        (int(x2), int(y2)), 
                        color, 2)
            
            # Add label
            label = f'{self.class_names[class_id]}: {confidence:.2f}'
            cv2.putText(frame, label, 
                      (int(x1), int(y1 - 10)), 
                      cv2.FONT_HERSHEY_SIMPLEX, 
                      0.5, color, 2)
            
            # Add to info background
            cv2.putText(info_bg, f"{self.class_names[class_id]}: {confidence:.2f}", 
                      (10, y_offset), 
                      cv2.FONT_HERSHEY_SIMPLEX, 
                      0.5, (255, 255, 255), 1)
            y_offset += 20
        
        # Add info background to top-right corner
        frame[10:110, frame.shape[1]-210:frame.shape[1]-10] = info_bg
        
        return frame

    def calculate_fps(self):
        """Calculate and return the FPS"""
        self.frame_count += 1
        elapsed_time = time.time() - self.start_time
        fps = self.frame_count / elapsed_time
        return fps

    def run_detection(self):
        """Run the main detection loop"""
        try:
            self.initialize_camera()
            
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break
                
                # Process frame
                processed_frame = self.process_frame(frame)
                
                # Calculate and display FPS
                fps = self.calculate_fps()
                cv2.putText(processed_frame, f'FPS: {fps:.2f}', 
                          (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                          1, (0, 255, 0), 2)
                
                # Display the frame
                cv2.imshow('Surveillance System', processed_frame)
                
                # Break if 'q' is pressed
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
        finally:
            if self.cap is not None:
                self.cap.release()
            cv2.destroyAllWindows()

if __name__ == "__main__":
    # Use raw string for Windows path
    model_path = r"D:\pfa\model\runs\detect\surveillance_model9\weights\best.pt"
    system = SurveillanceSystem(model_path)
    system.run_detection()
