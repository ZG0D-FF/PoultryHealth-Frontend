# 🐔 SmartEars (Monarch ORCA) — Frontend Dashboards

Welcome to the **public frontend repository** for the SmartEars / Monarch ORCA Poultry Health AI project. 

> **Note:** This repository contains *only* the frontend user interfaces and visualization dashboards. The core machine learning pipeline, edge inference scripts (Raspberry Pi), and private API integrations are hosted in a separate private backend repository.

## 🌟 Overview

This suite of frontend tools visualizes real-time bioacoustic telemetry from a distributed network of edge AI sensors. When the backend detects respiratory anomalies (sick vocalizations) in a poultry farm, these dashboards render the analytics in real-time.

## 🖥️ The Dashboards

This repository includes several distinct frontend experiences:

### 1. V12 TITAN HUD (`poultryhealth_v12_titan.html`)
The flagship dashboard for the V12 architecture. Features a deep ocean blue "Monarch ORCA" theme. 
- Real-time WebSocket connection to the edge Pi.
- Live rendering of Raw Acoustic Signals, 13 MFCC bars, and the AI Cascade (SVM → Queen Hive) probabilities.
- Cyberpunk lock screen security.

### 2. V11 Legacy HUD (`index.html`)
The classic cyberpunk-themed dashboard.
- Three.js DNA helix and floating shard particle background.
- Live waveform rendering and interactive "Orb" status display (Green = Nominal, Red = Anomaly).
- Offline mock-data generator for UI testing when the backend is disconnected.

### 3. Bioacoustic Tuning UI (`research.html`)
An analytical interface for researchers to tune the math constraints.
- Built with Tailwind CSS and Chart.js.
- Radar charts for 6 optimization targets (Spectral Bandwidth, ZCR, RMS Energy, etc.).
- Math constraints and biological justifications side-by-side.

### 4. Interactive Neural Architecture Map (`project_neural_map.html`)
A custom-built HTML5 Canvas graph engine that visualizes the entire system architecture.
- Smooth physics-based node rendering.
- Interactive side-panel and minimap.
- Maps out Data Flows, ML Models, Hardware devices, and API calls.

### 5. Knowledge Transfer Portal (`knowledge_transfer.html`)
The interactive documentation hub for the project, featuring a custom sidebar, reading progress tracking, and embedded mathematical formulas.

## 🚀 Usage & Setup

Because these are lightweight, client-side applications with no `node_modules` or build steps, running them is incredibly simple:

1. Clone this repository.
2. Double-click any `.html` file to open it in your browser.
3. **Optional (For Live Telemetry):** If you are running the private backend on a Raspberry Pi, ensure your browser is on the same local network. The dashboards automatically attempt to connect to the backend WebSocket server (`ws://<PI_IP>:5000` or `/ws`).

## 🛠️ Tech Stack
- **Structure:** Vanilla HTML5
- **Styling:** Vanilla CSS3 (Custom properties, glassmorphism) & Tailwind CSS (for Research UI)
- **Logic:** Vanilla ES6 JavaScript
- **Graphics/Charts:** Three.js, Chart.js, HTML5 Canvas API
- **Networking:** Native WebSockets

---
*© 2026 SmartEars Team. Frontend open-sourced for the community.*
