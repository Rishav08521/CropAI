// ===== SmartAg Frontend JS =====

const tempEl = document.getElementById("temp");
const humEl = document.getElementById("hum");
const soilEl = document.getElementById("soil");
const predictForm = document.getElementById("predictForm");
const predictResult = document.getElementById("predictResult");
const fileInput = document.getElementById("leafFile");

// If your API runs elsewhere, change this:
// const API_BASE = "http://10.198.221.156:5000";
const API_BASE = ""; // same origin

let labels = [];
let temps = [];
let hums = [];
let soils = [];

const ctx = document.getElementById("sensorChart");
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      { label: "Temp (°C)", data: temps },
      { label: "Humidity (%)", data: hums },
      { label: "Soil", data: soils },
    ],
  },
  options: {
    responsive: true,
    animation: false,
    parsing: false,
    spanGaps: true,
    scales: {
      x: { display: true, ticks: { maxRotation: 0 } },
      y: { beginAtZero: true }
    },
    elements: { point: { radius: 2 } }
  }
});

async function fetchJSON(url, options = {}) {
  const r = await fetch(url, options);
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await r.json();
    if (!r.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${r.status}`;
      throw new Error(msg);
    }
    return data;
  } else {
    const text = await r.text();
    if (!r.ok) throw new Error(text || `HTTP ${r.status}`);
    // If server unexpectedly returned text, try to parse or throw
    try { return JSON.parse(text); }
    catch { throw new Error("Server did not return JSON"); }
  }
}

async function fetchSensor() {
  try {
    const data = await fetchJSON(`${API_BASE}/sensor-data`);
    const t = Number(data.temperature);
    const h = Number(data.humidity);
    const s = Number(data.soil_moisture);

    if (!Number.isNaN(t)) tempEl.textContent = `${t.toFixed(1)} °C`;
    if (!Number.isNaN(h)) humEl.textContent = `${h.toFixed(1)} %`;
    if (!Number.isNaN(s)) soilEl.textContent = s.toString();

    const ts = new Date().toLocaleTimeString();
    labels.push(ts);
    temps.push(Number.isNaN(t) ? null : t);
    hums.push(Number.isNaN(h) ? null : h);
    soils.push(Number.isNaN(s) ? null : s);

    // Keep last 20 points
    if (labels.length > 20) {
      labels.shift(); temps.shift(); hums.shift(); soils.shift();
    }
    chart.update();
  } catch (e) {
    // Silent; you can log if you want: console.warn(e);
  }
}

// poll every 5s
fetchSensor();
setInterval(fetchSensor, 5000);

// ---- Prediction form ----
predictForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = fileInput.files?.[0];
  if (!file) return showAlert("Please choose an image first.", "danger");

  // Basic client-side checks
  const okTypes = ["image/jpeg", "image/png"];
  if (!okTypes.includes(file.type)) {
    return showAlert("Only JPG or PNG images are allowed.", "danger");
  }
  if (file.size > 10 * 1024 * 1024) { // 10 MB
    return showAlert("File too large (max 10 MB).", "danger");
  }

  const fd = new FormData();
  fd.append("file", file); // key must be exactly "file"

  setBusy(true, "Uploading & predicting…");

  try {
    const r = await fetch(`${API_BASE}/predict-disease`, { method: "POST", body: fd });
    const ct = r.headers.get("content-type") || "";
    let data;

    if (ct.includes("application/json")) {
      data = await r.json();
    } else {
      const text = await r.text();
      throw new Error(text || `Server returned ${r.status}`);
    }

    if (data.status !== "success") {
      throw new Error(data.message || "Prediction failed.");
    }

    showAlert(
      `<strong>Prediction:</strong> ${escapeHtml(data.predicted_disease)}<br/>
       <strong>Confidence:</strong> ${Number(data.confidence).toFixed(2)}%<br/>
       <strong>Treatment:</strong> ${escapeHtml(data.treatment)}`,
      "success",
      true
    );
  } catch (err) {
    showAlert(`Upload failed: ${escapeHtml(err.message || "Network error.")}`, "danger");
  } finally {
    setBusy(false);
  }
});

// ---- Helpers ----
function showAlert(html, type = "info", isHTML = false) {
  predictResult.classList.remove("d-none", "alert-success", "alert-danger", "alert-info");
  predictResult.classList.add(`alert-${type}`);
  predictResult[isHTML ? "innerHTML" : "textContent"] = html;
}

function setBusy(busy, msg = "") {
  const btn = predictForm.querySelector("button[type=submit]");
  if (busy) {
    btn.disabled = true;
    btn.dataset._oldText = btn.textContent;
    btn.textContent = msg || "Working…";
  } else {
    btn.disabled = false;
    if (btn.dataset._oldText) btn.textContent = btn.dataset._oldText;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}  