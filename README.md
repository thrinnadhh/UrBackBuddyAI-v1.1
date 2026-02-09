# 🤖 UrBackBuddyAI

### The Invisible Guardian for Developer Health

[![Tauri](https://img.shields.io/badge/Tauri-2.0-orange?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-Backend-black?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![TensorFlow.js](https://img.shields.io/badge/AI-TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow)](https://www.tensorflow.org/js)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

<div align="center">
  
  <p>
    <b>Privacy-First Posture Correction | 3D Gamification | Granular Health Analytics</b>
  </p>
  
  <a href="#-getting-started"><strong>Explore the docs »</strong></a>
  <br />
  <br />
  <a href="https://youtu.be/your-demo-link">View Demo</a>
  ·
  <a href="https://github.com/yourusername/UrBackBuddyAI/issues">Report Bug</a>
  ·
  <a href="https://github.com/yourusername/UrBackBuddyAI/releases">Download App</a>
</div>

---

## 💡 Inspiration
As developers, we spend 8+ hours a day glued to our screens, slowly destroying our spines. Existing solutions are either annoying (popups) or invasive (always-on cameras). 

**UrBackBuddyAI** is the answer: A **"Ghost in the Machine"** that lives silently in your toolbar, analyzes your posture locally, and visualizes your health as a **reactive 3D robot companion**. If you slouch, the robot gets sad. If you sit up, it thrives.

## ✨ Key Features

* **🔒 Privacy-First Architecture:** All AI processing happens locally on your GPU. No video data ever leaves your device.
* **👻 Stealth Mode:** The app runs in the background with **Zero UI Intrusion**. The camera feed is hidden by default.
* **🤖 3D Emotional Proxy:** Instead of boring charts, interact with a high-fidelity 3D Robot that reacts emotionally to your physical state.
* **wf Granular Vector Scoring:**
    * **Neck Score:** Tracks "Text Neck" (Ear-Shoulder Alignment).
    * **Shoulder Score:** Tracks Leaning (Vertical Symmetry).
    * **Spine Score:** Tracks Slouching (Nose-Hip Alignment).
* **⚡ High Performance:** Built on **Tauri (Rust)**, consuming 90% less RAM than Electron alternatives.

## 🛠️ Tech Stack

This project was built using a cutting-edge hybrid stack:

| Component | Technology | Why we chose it |
| :--- | :--- | :--- |
| **Core Framework** | [Tauri](https://tauri.app/) | Native OS performance with tiny bundle size. |
| **Frontend** | [React](https://react.dev/) + [Vite](https://vitejs.dev/) | Lightning-fast UI updates. |
| **AI Engine** | [TensorFlow.js](https://www.tensorflow.org/js) | MoveNet Lightning model running via WebGL backend. |
| **Visualization** | [Three.js](https://threejs.org/) | Procedural 3D geometry and animations. |
| **Database** | [SQLite](https://www.sqlite.org/) | Local, secure data persistence for long-term reports. |
| **IDE** | [Google Antigravity](https://idx.google.com/) | Cloud-native development environment. |
| **AI Architect** | [Gemini 3 Pro](https://deepmind.google/technologies/gemini/) | Powered the complex vector math and Rust logic. |

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* Node.js (v18+)
* Rust (latest stable)
* Build Tools (Xcode for Mac, VS Studio Build Tools for Windows)

### Installation

1.  **Clone the repo**
    ```sh
    git clone [https://github.com/yourusername/UrBackBuddyAI.git](https://github.com/yourusername/UrBackBuddyAI.git)
    cd UrBackBuddyAI
    ```

2.  **Install Frontend Dependencies**
    ```sh
    npm install
    ```

3.  **Run the Development App**
    ```sh
    npm run tauri dev
    ```

## 📊 How it Works (The Math)

We don't just guess your posture. We calculate a weighted vector score:

> **Health Index** = $0.5(Neck) + 0.3(Spine) + 0.2(Shoulders)$

<details>
<summary>Click to view the Algorithm Logic</summary>
<br>

* **Neck:** Calculated by measuring the pixel delta between the Ear keypoint and Shoulder keypoint on the X-axis.
* **Spine:** Uses the Nose-to-Hip vertical alignment.
* **Loop:** The detection loop runs at 60Hz, but the UI state is throttled to 10Hz to prevent React rendering lag.

</details>

## 🔮 Roadmap

- [ ] **Enterprise Tier:** Launch ₹100/mo plan for teams with SQL-based historical analytics.
- [ ] **Smart Home Integration:** Connect to Philips Hue API (Lights turn red when slouching).
- [ ] **Medical Validation:** Calibrate algorithms with orthopedic surgeons.
- [ ] **Audio Interventions:** Auto-pause Spotify when bad posture is detected.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

* **Google Gemini 3 Pro** for acting as the lead architect.
* **Spline Design** for 3D inspiration.
* **TensorFlow Team** for the MoveNet model.

---

<div align="center">
  Made with ❤️ and 🦀 Rust by [Your Name]
</div>
