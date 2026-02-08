use std::sync::Mutex;
use nokhwa::Camera;
use rusqlite::Connection;

// Import the new module
mod pose; 
use pose::PoseEngine;

// THE PRIVACY ENGINE STATE
pub struct AppState {
    pub db: Mutex<Option<Connection>>,
    pub camera: Mutex<Option<Camera>>, 
    pub pose_engine: PoseEngine, // <--- ADD THIS
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db: Mutex::new(None),
            camera: Mutex::new(None),
            pose_engine: PoseEngine::new(), // <--- ADD THIS
        }
    }
}