import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { API_BASE_URL } from "../../src/api";

type PredictResponse = {
  prediction?: string;
  confidence?: number | string;
  recommendation?: string;
  [k: string]: any;
};

type Picked = ImagePicker.ImagePickerAsset & {
  // make TS happy when we read optional fields
  fileName?: string;
  mimeType?: string;
  base64?: string;
};

export default function Scan() {
  const [img, setImg] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<PredictResponse | null>(null);
  const [err, setErr] = useState("");

  const pick = async () => {
    // Native permission (not needed on web)
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow gallery access.");
        return;
      }
    }

    const sel = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: Platform.OS === "web", // only fetch base64 for web uploads
    });

    if (!sel.canceled) {
      const a = sel.assets[0] as Picked;
      setImg(a);
      setRes(null);
      setErr("");
    }
  };

  const upload = async () => {
    if (!img) return;
    setBusy(true);
    setErr("");
    setRes(null);

    try {
      // WEB: send base64 JSON as the backend hint suggested ("image_base64")
      if (Platform.OS === "web") {
        if (!img.base64) {
          throw new Error("No base64 data from picker. Try reselecting the image.");
        }
        const r = await axios.post(`${API_BASE_URL}/predict-disease`, {
          image_base64: img.base64, // send ONLY the string; no "data:image/jpeg;base64," prefix
        });
        setRes(r.data);
        return;
      }

      // NATIVE (Android/iOS): use multipart FormData (let axios set boundary)
      const form = new FormData();
      form.append("file", {
        uri: img.uri,
        name: img.fileName ?? "leaf.jpg",
        type: img.mimeType ?? "image/jpeg",
      } as any);

      // do NOT set "Content-Type": axios will add the correct boundary
      const r = await axios.post(`${API_BASE_URL}/predict-disease`, form, { timeout: 20000 });
      setRes(r.data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.message ||
        "Upload failed";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const conf = Number(res?.confidence);
  const confPct = Number.isFinite(conf) ? `${(conf * 100).toFixed(1)}%` : undefined;

  return (
    <ScrollView style={s.wrap}>
      <Text style={s.title}>Leaf Disease Scan</Text>
      <View style={s.card}>
        <TouchableOpacity onPress={pick} style={s.btn}>
          <Text style={s.btnText}>{img ? "Choose another image" : "Pick an image"}</Text>
        </TouchableOpacity>

        {img?.uri ? (
          <Image source={{ uri: img.uri }} style={s.preview} resizeMode="cover" />
        ) : null}

        <TouchableOpacity
          onPress={upload}
          disabled={!img || busy}
          style={[s.btnPrimary, (!img || busy) && { opacity: 0.6 }]}
        >
          <Text style={s.btnText}>{busy ? "Predicting..." : "Upload & Predict"}</Text>
        </TouchableOpacity>

        {err ? <Text style={s.err}>{err}</Text> : null}

        {res && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.pred}>{res.prediction || "Prediction"}</Text>
            {confPct ? <Text style={s.meta}>Confidence: {confPct}</Text> : null}
            {res.recommendation ? <Text style={s.meta}>{res.recommendation}</Text> : null}
          </View>
        )}

        <Text style={s.hint}>
          Tip: On phone, set API_BASE_URL to your PC’s LAN IP (e.g., http://192.168.x.x:5000).
          On web, we send base64 JSON to the backend.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0b1220" },
  title: { color: "white", fontSize: 20, fontWeight: "700", margin: 16 },
  card: { backgroundColor: "#101b34", margin: 16, padding: 16, borderRadius: 16 },
  btn: { padding: 12, backgroundColor: "#1d2a4a", borderRadius: 12 },
  btnPrimary: { marginTop: 12, padding: 12, backgroundColor: "#2e52a2", borderRadius: 12 },
  btnText: { color: "white", textAlign: "center" },
  preview: { width: "100%", height: 240, borderRadius: 12, marginTop: 12 },
  err: { color: "#ffb3b3", marginTop: 12 },
  pred: { color: "white", fontSize: 16, fontWeight: "700" },
  meta: { color: "#cfe1ff", marginTop: 4 },
  hint: { color: "#9bb0ff", marginTop: 16, fontSize: 12 },
});
