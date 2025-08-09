import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { API_BASE_URL } from "../../src/api";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={s.wrap}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.brandRow}>
          <View style={s.logoDot} />
          <Text style={s.h1}>SmartAgri</Text>
        </View>
        <Text style={s.sub}>IoT + AI Crop Assistant</Text>
      </View>

      {/* Quick actions */}
      <View style={s.actionsRow}>
        <Link href="/(tabs)/sensor" asChild>
          <TouchableOpacity style={s.actionCard} accessibilityLabel="Go to Live Sensors">
            <Text style={s.actionTitle}>Live Sensors</Text>
            <Text style={s.actionSub}>Temperature • Humidity • Soil</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/scan" asChild>
          <TouchableOpacity style={s.actionCard} accessibilityLabel="Go to Leaf Scan">
            <Text style={s.actionTitle}>Leaf Scan</Text>
            <Text style={s.actionSub}>AI disease prediction</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* System / API card */}
      <View style={s.card}>
        <Text style={s.cardLabel}>API Base</Text>
        <Text style={s.cardVal} numberOfLines={1}>{API_BASE_URL}</Text>
        <View style={s.statusRow}>
          <View style={s.badgeOk} />
          <Text style={s.statusText}>Ready</Text>
        </View>
        <Text style={s.hint}>
          Open tabs below: <Text style={s.hintBold}>Sensors</Text> / <Text style={s.hintBold}>Scan</Text>
        </Text>
      </View>

      {/* Feature highlights */}
      <View style={s.featuresRow}>
        <View style={s.feature}>
          <Text style={s.featureTitle}>Env Sensors</Text>
          <Text style={s.featureSub}>Real-time field data</Text>
        </View>
        <View style={s.feature}>
          <Text style={s.featureTitle}>AI Diagnosis</Text>
          <Text style={s.featureSub}>Leaf disease insights</Text>
        </View>
        <View style={s.feature}>
          <Text style={s.featureTitle}>Smart Tips</Text>
          <Text style={s.featureSub}>Actionable guidance</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0b1220", padding: 16 },

  // Header
  header: {
    backgroundColor: "#101b34",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#101b34",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#9bb0ff",
  },
  h1: { color: "white", fontSize: 26, fontWeight: "800" },
  sub: { color: "#9bb0ff", marginTop: 6 },

  // Actions
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionCard: {
    flex: 1,
    backgroundColor: "#101b34",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#101b34",
  },
  actionTitle: { color: "white", fontWeight: "700", fontSize: 16 },
  actionSub: { color: "#9bb0ff", marginTop: 4, fontSize: 12 },

  // Main card (API)
  card: {
    backgroundColor: "#101b34",
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#101b34",
  },
  cardLabel: { color: "white" },
  cardVal: { color: "#9bb0ff", marginTop: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  badgeOk: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#9bb0ff" },
  statusText: { color: "#cfe1ff", fontWeight: "600" },
  hint: { color: "#cfe1ff", marginTop: 12 },
  hintBold: { fontWeight: "700", color: "#cfe1ff" },

  // Features
  featuresRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  feature: {
    flex: 1,
    backgroundColor: "#101b34",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#101b34",
  },
  featureTitle: { color: "white", fontWeight: "700" },
  featureSub: { color: "#9bb0ff", fontSize: 12, marginTop: 4 },
});
