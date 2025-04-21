# 🕵️‍♂️ Automatic Hooded Person Detection 

> A computer-vision web application for detecting hooded individuals in images and live video streams.

---

## 📋 Description

This project implements an end‑to‑end system to automatically detect people wearing hoods (“personnes cagoulées”) using a state‑of‑the‑art YOLOv8 model. It exposes:

- A **Flask** microservice hosting the YOLOv8 inference API  
- An **Express.js** backend handling authentication, user sessions, and routing  
- A **React.js** frontend for uploading images, viewing real‑time camera feeds, and displaying detections

---

## 🚀 Features

- 🔍 **Real‑time detection** on webcam feed  
- 📸 **Image upload** & batch detection  
- 👤 **User authentication** (login/signup) via Express.js  
- 📊 **Dashboard** showing detection stats (number of detections, timestamps)  
- ⚙️ **Configurable** detection confidence threshold  

---

## 🛠️ Tech Stack

| Layer            | Technology      |
| ---------------- | --------------- |
| Object Detection | YOLOv8 (Ultralytics) |
| Model API        | Python • Flask  |
| Backend API      | Node.js • Express.js |
| Frontend UI      | React.js (Create React App) |


---



