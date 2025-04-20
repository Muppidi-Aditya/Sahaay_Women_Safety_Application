![Untitled design](https://github.com/user-attachments/assets/ba538813-8ca5-415a-a047-088d3703c425)# Sahaay: Women Safety Application 👩‍💼🛡️

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

## 📸 Screenshots

### 🔐 Login Page && Register page

<img width="333" alt="Screenshot 2025-04-20 at 4 00 43 PM" src="https://github.com/user-attachments/assets/c33d0261-a83e-4918-a86c-e515f2856d17" />
<img width="334" alt="Screenshot 2025-04-20 at 4 05 46 PM" src="https://github.com/user-attachments/assets/9c400332-1918-435f-bb92-10f7e94b6db1" />

### 🗺️ Safe Route Navigation Result

<img width="336" alt="Screenshot 2025-04-20 at 4 11 20 PM" src="https://github.com/user-attachments/assets/6a4d57bb-bad3-4b6a-9a0c-5b72f9a32889" />
<img width="336" alt="Screenshot 2025-04-20 at 4 11 33 PM" src="https://github.com/user-attachments/assets/570b9564-da3d-452a-ab79-c34617cb2137" />
<img width="337" alt="Screenshot 2025-04-20 at 4 12 12 PM" src="https://github.com/user-attachments/assets/6ca8eec5-2484-4b0f-be22-54a5a8888c8f" />

### 🧠 Sahaaya AI Assistant

<img width="331" alt="Screenshot 2025-04-20 at 4 16 43 PM" src="https://github.com/user-attachments/assets/dbf79551-710b-43df-91e9-27be1f5b258a" />
<img width="332" alt="Screenshot 2025-04-20 at 4 16 51 PM" src="https://github.com/user-attachments/assets/9eb0cdb0-5bcd-4aa4-97b7-1241b75c5c01" />

### 🔥 Crime Heat Map

<img width="334" alt="Screenshot 2025-04-20 at 4 23 46 PM" src="https://github.com/user-attachments/assets/56a7cc96-b7d8-4a7c-9aa2-86f45b603de6" />

### 🚗 License Plate Checker 

<img width="333" alt="Screenshot 2025-04-20 at 4 26 22 PM" src="https://github.com/user-attachments/assets/504c5fcd-1ff9-4d4d-be17-f91f08363b0f" />

### 📱 Fake Phone Feature

![Untitled design](https://github.com/user-attachments/assets/32bc6853-3793-4bf4-9d55-e13ba9428b2e)
![WhatsApp Image 2025-04-20 at 16 30 01](https://github.com/user-attachments/assets/c21534be-1db0-4076-93c2-91f712407001)


