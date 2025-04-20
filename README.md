# Sahaay: Women Safety Application 👩‍💼🛡️

Sahaay is a comprehensive women safety application developed as part of a college minor project. It is designed to assist women in critical situations by providing features such as safe route navigation, AI-powered assistance, crime heatmaps, and more. The project integrates real-time data, AI services, and mapping APIs to deliver a robust safety solution.

---

## 🔥 Features

### 1. Safe Route Navigation
A powerful Node.js API that calculates safer walking/driving routes by avoiding high-crime areas.  

#### How it works:
- **Crime Data Processing**: Reads CSV with lat/long of crimes, uses **kd-tree** for spatial indexing.
- **Route Generation**: Generates multiple routes using waypoints and skip connections.
- **Crime Avoidance**: Penalizes route segments near crime hotspots using **haversine-distance**.
- **Path Finding**: Implements **Dijkstra’s algorithm** to find the least-cost (safest) route.
- **Google Maps Integration**: Returns a ready-to-use Google Maps URL, with route stats and metrics.

#### Tech Stack:
- Node.js + Express
- `csv-parser`, `multer`, `kd-tree-javascript`, `haversine-distance`

---

### 2. Sahaaya AI 🤖
An intelligent AI assistant powered by **Google Gemini**, designed to help women in distress situations. It answers questions and provides suggestions based on predefined system instructions and use cases.

---

### 3. Crime Heat Map 🗺️
Visualizes crimes against women across Indian regions using a heatmap. The app parses a CSV containing crime coordinates and displays them interactively.

---

### 4. License Plate Checker 🚗
Verifies the authenticity of a vehicle’s license plate using **RapidAPI**, helping users confirm if a driver is genuine or suspicious.

---

### 5. Fake Phone Call 📱
Triggers a fake call to a registered emergency contact to alert them that the user is safe — a discreet way to notify someone in tense situations.

---

## 🧑‍💻 Tech Stack

### Frontend
- React.js  
- HTML, CSS

### Backend
- Node.js  
- Express.js

### Database
- MySQL

### Other Libraries & Tools
- `csv-parser`, `multer`, `kd-tree-javascript`, `haversine-distance`  
- Google Maps API  
- RapidAPI (Vehicle validation)  
- Gemini AI API

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Muppidi-Aditya/Sahaay_Women_Safety_Application
cd Sahaay_Women_Safety_Application
