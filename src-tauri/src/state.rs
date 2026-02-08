use std::sync::{Mutex, Arc};
use nokhwa::Camera;
use rusqlite::Connection;

// 1. Import the AI Module
use crate::pose::PoseEngine;

// THE PRIVACY ENGINE STATE
#[derive(Clone)] // Now we can clone the state!
pub struct AppState {
    pub db: Arc<Mutex<Option<Connection>>>,
    pub camera: Arc<Mutex<Option<Camera>>>, 
    // 2. Add the Brain here
    pub pose_engine: Arc<PoseEngine>, 
}

// Initialize with everything OFF (Privacy by Default)
impl Default for AppState {
    fn default() -> Self {
        Self {
            db: Arc::new(Mutex::new(None)),
            camera: Arc::new(Mutex::new(None)),
            // 3. Initialize the Brain
            pose_engine: Arc::new(PoseEngine::new()), 
        }
    }
}