# CropAI
# 🌱 CropDoc AI – Smart Agriculture Assistant

*CropDoc AI* is an integrated platform that combines *AI-powered leaf disease detection, **IoT-based environmental monitoring, and a **cross-platform mobile app* to help farmers monitor crop health in real time and get actionable treatment advice.

---

## 📌 Features
- *AI Leaf Disease Detection* – Upload a leaf image and get the disease type, confidence %, and treatment recommendation.
- *IoT Sensor Integration* – ESP32 reads temperature, humidity, and soil moisture from sensors and sends data to the backend.
- *Real-time Charts* – View live sensor readings on the mobile app.
- *Cross-platform Mobile App* – Built with React Native Expo, works on Android, iOS, and Web.
- *Local Network Communication* – Mobile app and IoT device send data to backend over LAN.
- *Base64 Upload Support* – Enables web compatibility for image uploads.

---

## 🛠 Tech Stack
*AI/ML*
- TensorFlow / Keras
- MobileNetV2 Transfer Learning
- Python

*Backend*
- Python Flask
- Flask-CORS
- Pillow, NumPy, OpenCV
- REST APIs

*IoT*
- ESP32
- DHT11 sensor (temperature, humidity)
- Soil moisture sensor
- Arduino IDE

*Frontend*
- React Native (Expo)
- Expo Router
- Axios
- react-native-chart-kit
- expo-image-picker

---

## 📂 Project Structure
---

## 🚀 How It Works
1. *Train AI Model*
   - Train a MobileNetV2 model with transfer learning on a leaf disease dataset using TensorFlow/Keras.
   - Export the trained model as model.h5 and the class labels as labels.json.

2. *Backend (Flask)*
   - Loads the trained model and serves /predict-disease for image predictions.
   - Returns disease name, confidence %, and treatment recommendations.
   - Provides /sensor-data and /ingest-sensor endpoints for IoT devices.

3. *IoT Device (ESP32)*
   - Reads *temperature, **humidity, and **soil moisture* from sensors.
   - Sends readings to the backend every few seconds.

4. *Mobile App (React Native Expo)*
   - *Home Tab* – Displays API base and navigation shortcuts.
   - *Live Sensors Tab* – Fetches and displays real-time sensor data in charts.
   - *Leaf Scan Tab* – Lets the user upload a leaf image and get disease predictions with confidence % and treatment.

---

## ⚙ Setup Instructions

### ⿡ Model Training
```bash
cd backend
pip install -r requirements.txt
python train_leaf_model.py
# Output: backend/model/model.h5 and labels.json
