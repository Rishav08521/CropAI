import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import axios from "axios";
import { LineChart } from "react-native-chart-kit";
import { API_BASE_URL } from "../../src/api";

type Sample = { t: number; h: number; m: number; time: string };

const W = Dimensions.get("window").width;

function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef<() => void>();
  useEffect(() => { saved.current = callback; }, [callback]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => saved.current && saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export default function Sensors() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchOnce = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/sensor-data`, { timeout: 5000 });
      const item: Sample = {
        t: Number(data.temperature),
        h: Number(data.humidity),
        m: Number(data.soil_moisture),
        time: new Date().toLocaleTimeString(),
      };
      setSamples((s) => [...s.slice(-49), item]);
      setErr("");
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOnce(); }, []);
  useInterval(fetchOnce, 5000);

  const chartData = useMemo(
    () => ({
      labels: samples.map((x) => x.time),
      datasets: [{ data: samples.map((x) => x.t) }, { data: samples.map((x) => x.h) }],
    }),
    [samples]
  );

  const last = samples.at(-1);

  return (
    <ScrollView style={s.wrap}>
      <Text style={s.title}>Live Sensors</Text>
      {loading && <ActivityIndicator size="large" style={{ marginTop: 16 }} />}
      {err ? <Text style={s.err}>{err}</Text> : null}

      {last && (
        <>
          <View style={s.row}>
            <Stat title="Temp (°C)" value={last.t.toFixed(1)} />
            <Stat title="Humidity (%)" value={last.h.toFixed(1)} />
            <Stat title="Soil" value={String(last.m)} />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Temp / Humidity Trend</Text>
            <LineChart
              data={chartData}
              width={W - 64}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#101b34",
                backgroundGradientTo: "#101b34",
                decimalPlaces: 1,
                color: (o = 1) => `rgba(255,255,255,${o})`,
                labelColor: (o = 1) => `rgba(220,230,255,${o})`,
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={{ color: "#9bb0ff" }}>{title}</Text>
      <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0b1220" },
  title: { color: "white", fontSize: 20, fontWeight: "700", margin: 16 },
  err: { color: "#ffb3b3", marginHorizontal: 16 },
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: "#101b34", borderRadius: 16, padding: 16 },
  card: { backgroundColor: "#101b34", marginHorizontal: 16, padding: 16, borderRadius: 16 },
  cardTitle: { color: "white", marginBottom: 8 },
});
