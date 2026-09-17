# 🧠 Memory Mesh

<div align="center">

![Memory Mesh Logo](./assets/logo-full.svg)

<br/>

[![Android APK Release](https://img.shields.io/badge/Android-APK%20Release-brightgreen?logo=android&style=for-the-badge)](https://github.com/004Ongoro/memory-mesh/releases/latest)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&style=for-the-badge)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&style=for-the-badge)](https://reactnative.dev)
[![TypeScript 6.0](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**An offline-first, synaptic knowledge graph and spaced-repetition mobile application built with React Native & Expo.**

[Download APK](https://github.com/004Ongoro/memory-mesh/releases/latest) • [Features](#-core-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started)

</div>

---

## 🌟 Overview

**Memory Mesh** bridges the gap between atomic personal knowledge management (PKM) and long-term retention. Rather than isolating your thoughts into siloed folders, Memory Mesh interconnects your concepts, code snippets, book notes, and reflections through an interactive force-directed graph. 

Automated synaptic linkages discover associations across your notes offline, while an integrated **SuperMemo-2 (SM-2)** spaced repetition algorithm converts critical insights into active recall flashcards.

---

## 🚀 Core Features

- 🕸️ **Interactive Force-Directed Knowledge Graph**:
  - Live 2D physics simulation with kinetic panning and pinch-to-zoom.
  - Interactive touch-to-focus nodes with synaptic connection highlights.
  - Distinct color codings for each note modality (Concepts, Code, Articles, Books, Ideas, Reflections, Screenshots).

- 🔄 **Synaptic Spaced Repetition (SM-2 Engine)**:
  - Scientific active-recall flashcard review system.
  - Calculates dynamic review intervals ($I_n = I_{n-1} \times \text{EF}$) and ease factors based on user ratings (*Again*, *Hard*, *Good*, *Easy*).
  - Tracks retention rate, mastered flashcards, streak history, and review queues.

- 📴 **100% Offline-First & Private**:
  - Zero external cloud dependencies or third-party telemetry.
  - Fast local storage utilizing `@react-native-async-storage/async-storage`.
  - Your personal notes and thoughts stay strictly on your device.

- 📝 **Rich Markdown & Syntax Highlighted Code**:
  - In-app markdown renderer supporting headings, blockquotes, lists, wikilinks (`[[Note Title]]`), and emphasis.
  - Integrated custom multi-language syntax highlighter with line numbering and one-tap copy.

- 🔍 **Offline Multi-Token Search Engine**:
  - Multi-term ranking across titles, note content, code snippets, authors, and hashtags.
  - Quick filter chips for starred notes, due flashcards, and note types.

- 📊 **Mesh & Learning Analytics**:
  - Network graph degree distribution and most connected hub concepts.
  - Visual breakdown of knowledge categories and card mastery statistics.

---

## 📱 Download APK

You can download the ready-to-install Android APK directly from our **[GitHub Releases](https://github.com/004Ongoro/memory-mesh/releases/latest)**:

1. Download **`MemoryMesh-v1.0.0.apk`** to your Android phone.
2. Tap the downloaded file to install.
3. If prompted, allow **"Install unknown apps"** for your browser or file manager.
4. Launch Memory Mesh and start weaving your personal knowledge graph!

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technology |
|---|---|
| **Framework** | [React Native 0.86.3](https://reactnative.dev/) via [Expo SDK ~57.0.23](https://docs.expo.dev/versions/v57.0.0/) |
| **Language** | [TypeScript ~6.0.3](https://www.typescriptlang.org/) (Strict Mode) |
| **Graphics & Visualization** | [react-native-svg 15.15.4](https://github.com/software-mansion/react-native-svg) |
| **Storage** | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| **UI & Icons** | [@expo/vector-icons](https://icons.expo.fyi/), [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) |
| **Device APIs** | [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/), [expo-clipboard](https://docs.expo.dev/versions/latest/sdk/clipboard/), [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) |
| **CI/CD** | GitHub Actions Automated Android APK Release Workflow |

---

## 💻 Development & Testing

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
git clone https://github.com/004Ongoro/memory-mesh.git
cd memory-mesh
npm install
```

### Running the App
```bash
# Start Expo development server
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator
npm run ios

# Run web preview
npm run web
```

### Typechecking & Testing
```bash
# Verify TypeScript strict types (0 errors)
npm run typecheck

# Run offline engine test suite (SM-2, Knowledge Graph, Search Engine)
npm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
