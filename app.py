from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from werkzeug.utils import secure_filename
import numpy as np
import os
import json
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)

# ---------- Config ----------
UPLOAD_FOLDER = "uploads"
MODEL_CANDIDATES = ["crop_disease_model.keras", "crop_disease_model.h5"]
LABELS_PATH = "class_labels.txt"
SENSOR_DATA_FILE = "sensor_data.json"
ALLOWED_EXT = {".jpg", ".jpeg", ".png"}
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

# ---------- Ensure required folders/files ----------
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
if not os.path.exists(SENSOR_DATA_FILE):
    with open(SENSOR_DATA_FILE, "w") as f:
        json.dump({}, f, indent=4)

# ---------- Helpers ----------
def _load_any_model():
    for path in MODEL_CANDIDATES:
        if os.path.isfile(path) and os.path.getsize(path) > 100 * 1024:
            print(f"[Model] Loading: {path}")
            return load_model(path)
    raise FileNotFoundError(
        "No valid model found. Expected one of: crop_disease_model.keras / crop_disease_model.h5"
    )

def _load_labels():
    if not os.path.isfile(LABELS_PATH):
        raise FileNotFoundError("class_labels.txt not found.")
    with open(LABELS_PATH, "r") as f:
        labels = [ln.strip() for ln in f if ln.strip()]
    if not labels:
        raise ValueError("class_labels.txt is empty.")
    return labels

def _allowed(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXT

def recommend_treatment(disease: str) -> str:
    d = disease.lower()
    if "blight" in d:   return "Use Mancozeb or Chlorothalonil fungicide."
    if "mildew" in d:   return "Apply sulfur or potassium bicarbonate spray."
    if "rust" in d:     return "Use a fungicide with myclobutanil."
    if "spot" in d:     return "Copper-based fungicide is effective."
    if "healthy" in d:  return "No treatment needed."
    return "Consult a local expert for targeted management."

def _read_latest_sensor():
    try:
        with open(SENSOR_DATA_FILE, "r") as f:
            data = json.load(f) or {}
    except Exception:
        data = {}
    # safe defaults for UI
    return {
        "temperature": data.get("temperature"),
        "humidity": data.get("humidity"),
        "soil_moisture": data.get("soil_moisture"),
    }

def _save_sensor(data: dict):
    with open(SENSOR_DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

# ---------- Load model + labels at startup ----------
model = _load_any_model()
class_labels = _load_labels()

# ---------- Error handlers ----------
@app.errorhandler(413)
def too_large(_e):
    return jsonify({"status": "error", "message": "File too large (max 10 MB)"}), 413

@app.errorhandler(404)
def not_found(_e):
    return jsonify({"status": "error", "message": "Not found"}), 404

@app.errorhandler(500)
def server_err(e):
    return jsonify({"status": "error", "message": str(e)}), 500

# ---------- Optional UI routes ----------
@app.route("/")
def home():
    try:
        return render_template("index.html")
    except Exception:
        return jsonify({"status": "ok", "message": "Backend running"}), 200

@app.route("/favicon.ico")
def favicon():
    path = os.path.join(app.root_path, "static")
    ico = os.path.join(path, "favicon.ico")
    return send_from_directory(path, "favicon.ico", mimetype="image/x-icon") if os.path.exists(ico) else ("", 204)

# ---------- Health ----------
@app.get("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": True, "labels": len(class_labels)}), 200

# ---------- Sensor data (canonical) ----------
@app.post("/sensor-data")
def receive_sensor_data():
    try:
        data = request.get_json(force=True, silent=False)
        if not isinstance(data, dict):
            return jsonify({"status": "error", "message": "Invalid JSON"}), 400

        required = ("temperature", "humidity", "soil_moisture")
        if not all(k in data for k in required):
            return jsonify({"status": "error", "message": "Missing keys in data"}), 400

        # ensure numeric
        data = {
            "temperature": float(data["temperature"]),
            "humidity": float(data["humidity"]),
            "soil_moisture": float(data["soil_moisture"]),
        }

        _save_sensor(data)
        print(f"[Sensor] Temp: {data['temperature']}°C | Hum: {data['humidity']}% | Soil: {data['soil_moisture']}")
        return jsonify({"status": "success", "message": "Data received"}), 200

    except Exception as e:
        print("Error in /sensor-data:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.get("/sensor-data")
def get_sensor_data():
    return jsonify(_read_latest_sensor()), 200

# ---------- Sensor aliases (for your frontend) ----------
@app.get("/api/sensor/latest")
def api_sensor_latest():
    return jsonify(_read_latest_sensor()), 200

@app.post("/api/sensor/update")
def api_sensor_update():
    return receive_sensor_data()

# ---------- Disease prediction ----------
@app.post("/predict-disease")
def predict_disease():
    filepath = None
    try:
        file_storage = None

        # accept either 'file' or 'image'
        if "file" in request.files:
            file_storage = request.files["file"]
        elif "image" in request.files:
            file_storage = request.files["image"]

        # also accept base64 JSON { "image_base64": "data..." }
        if not file_storage and request.is_json:
            data = request.get_json(silent=True) or {}
            b64 = data.get("image_base64")
            if b64:
                # strip possible "data:image/png;base64,..." prefix
                if "," in b64:
                    b64 = b64.split(",", 1)[1]
                img_bytes = base64.b64decode(b64)
                img = Image.open(BytesIO(img_bytes)).convert("RGB")
                filepath = os.path.join(UPLOAD_FOLDER, "upload_b64.png")
                img.save(filepath)

        if not file_storage and not filepath:
            return jsonify({"status": "error", "message": "No image sent (use 'file' or 'image' form field, or 'image_base64' JSON)"}), 400

        if file_storage:
            filename = secure_filename(file_storage.filename or "upload.png")
            if not _allowed(filename):
                return jsonify({"status": "error", "message": "Only .jpg/.jpeg/.png allowed"}), 400
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file_storage.save(filepath)

        # Preprocess (match training size)
        img = image.load_img(filepath, target_size=(128, 128))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        preds = model.predict(img_array)
        idx = int(np.argmax(preds[0]))
        confidence = float(np.max(preds[0]))
        disease = class_labels[idx] if idx < len(class_labels) else f"Class_{idx}"
        treatment = recommend_treatment(disease)

        print(f"[Prediction] -> {disease} ({confidence:.2f}) | {treatment}")

        return jsonify({
            "status": "success",
            "predicted_disease": disease,
            "confidence": round(confidence * 100, 2),
            "treatment": treatment
        }), 200

    except Exception as e:
        print("Error in /predict-disease:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if filepath and os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
