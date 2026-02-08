# Architecture Design: PostureSense v1.1

## 1. System Overview
PostureSense is a local-first desktop application designed for privacy-centric posture correction. It relies on a split architecture where the Rust backend handles sensitive ML processing, and the React frontend displays only abstracted data (avatars/signals). v1.1 introduces strict hardware control ("Kill Switch") and adaptive resource usage.

## 2. The Black Box Rule (Architecture-Level Enforcement)
- **Constraint**: The OS Camera feed NEVER leaves the Rust process memory.
- **Enforcement**:
  - The frontend has NO access to `navigator.mediaDevices.getUserMedia` (blocked via CSP/Permissions).
  - The backend (Rust) creates the camera stream, sends frames *directly* to the ML inference engine.
  - The backend transmits ONLY `PostureState` or `LandmarkHash` to the frontend via Tauri Commands/Events.

## 3. Tauri Bridge & IPC

### Commands (Frontend -> Backend)
- **Camera Control**:
    - `acquire_camera_handle(camera_id: String) -> Result<()>`: Initializes the camera stream.
    - `release_camera_handle() -> Result<()>`: **HARDWARE KILL SWITCH**. Explicitly drops the camera struct, forcing the OS to cut power to the webcam LED.
- **Data Access**:
    - `get_privacy_hash_log(limit: u32) -> Vec<String>`: Retrives the rolling buffer of processed frame hashes.
    - `get_daily_metrics() -> DailySummary`: Retrieves aggregated stats from SQLite.
    - `update_preferences(prefs: UserPreferences)`: Saves settings to SQLite.

### Events (Backend -> Frontend)
- `posture-update`: Emitted on every *processed* frame (variable rate).
   ```json
   {
     "status": "Good" | "Bad" | "Unknown",
     "score": 0.95,
     "avatar_bones": { ... }, // Abstract coordinates
     "privacy_hash": "a1b2c3d4...", 
     "is_calibrated": boolean
   }
   ```
- `calibration-alert`: Emitted when ergonomic checks fail (e.g., "Monitor Too Low").

## 4. SQLite Schema (Local DB)

### Philosophy
Store *only* what is needed for habit tracking and gamification. NO RAW DATA.

**Table: `user_preferences`**
| Column | Type | Description |
|---|---|---|
| `key` | TEXT PRIMARY KEY | Config key (e.g., 'sensitivity', 'theme', 'camera_id') |
| `value` | TEXT | JSON stringified value or simple string |

**Table: `daily_sessions`**
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-inc |
| `date` | TEXT | ISO Date (YYYY-MM-DD) |
| `duration_seconds` | INTEGER | Time engaged in correction |
| `good_posture_seconds` | INTEGER | Time spent in "Good" state |
| `average_score` | REAL | 0.0 - 1.0 aggregate score |

## 5. ML Pipeline & Adaptive Polling

### Model Storage
- **Location**: `src-tauri/resources/models/`
- **Format**: `.onnx` (via `ort` crate) or `.tflite`.
- **Bundling**: Included in binary sidecar.

### Adaptive Polling Engine (Battery Saver)
The ML Loop does NOT run at a fixed framerate. It sleeps dynamically based on user stability.

| State | Frame Rate | Trigger Condition |
|---|---|---|
| **Calibration** | 30 FPS | Startup or user request. High precision needed for ergonomic checks. |
| **Active Correction** | 15 FPS | Standard operation. User is shifting or posture is "Bad". |
| **Maintenance** | 1 FPS | User has maintained "Good" posture for > 5 minutes. |
| **Weaning** | 0.1 FPS | User has graduated (Weeks 8+). Checks once every 10 seconds. |

### Inference Logic (Rust)
1. **Input**: Frame from Camera.
2. **Ergonomic Check**: 
   - Calculate `EyeLevel` vs `ScreenCenter`. 
   - If `EyeLevel < Threshold` (user looking down significantly), emit `calibration-alert`.
3. **Posture Check**:
   - Compare Key Vectors (Ear-Shoulder, Nose-Sternum) against calibrated baseline.
4. **Output**: `PostureState`.

## 6. Windowing Strategy (Multi-Window)

### Strategy
PostureSense uses two distinct Tauri windows to separate the "Dashboard" from the "Peripheral Glow".

### 1. Main Window (`main`)
- **Role**: Dashboard, Settings, Privacy Log, Calibration UI.
- **Behavior**: Standard OS window. Minimizable.
- **Content**: React App Router (`/dashboard`, `/settings`).

### 2. Overlay Window (`overlay`)
- **Role**: Peripheral Awareness ("Glow").
- **Specs**:
    - **Transparent**: Yes.
    - **Click-through**: Yes (Ignore Mouse Events).
    - **Always on Top**: Yes.
    - **Position**: Edges of the screen or full-screen border (1px).
- **Behavior**:
    - **Good Posture**: Faint Blue Glow or Invisible.
    - **Bad Posture**: Soft Orange Pulse.
    - **Flow State**: Completely Invisible.
- **Communication**: Backend emits `posture-update` to *both* windows, but `overlay` only renders the glow color.
