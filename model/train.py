import numpy
from ultralytics import YOLO
import os
import torch

def train_model():
    try:
        # Print system info
        print(f"Using NumPy version: {numpy.__version__}")
        print(f"CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"GPU Device: {torch.cuda.get_device_name(0)}")

        # Set working directory to the script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)

        # Load YOLOv8 model
        model = YOLO('yolov8n.pt')

        # Correct data.yaml path (absolute path to avoid confusion)
        data_yaml_path = "D:/pfa/model/dataset/data.yaml"
        print(f"Using data.yaml from: {data_yaml_path}")

        # Train the model
        results = model.train(
            data=data_yaml_path,  # Path to data.yaml
            epochs=5,  # Number of epochs
            imgsz=640,  # Image size
            batch=8,  # Batch size
            name='surveillance_model',  # Model name
            device=0 if torch.cuda.is_available() else 'cpu'  # Use GPU if available
        )

        print("Training completed successfully!")

    except Exception as e:
        print(f"An error occurred during training: {str(e)}")

if __name__ == '__main__':
    train_model()
