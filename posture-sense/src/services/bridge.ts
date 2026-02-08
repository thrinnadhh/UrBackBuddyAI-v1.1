import { invoke } from '@tauri-apps/api/core';

/**
 * Bridge service for communicating with the Tauri backend.
 * All commands are strictly typed here.
 */
export const bridge = {
    /**
     * Initialize the camera stream (Hardware Acquire).
     * backend: init_camera
     */
    initCamera: async (): Promise<void> => {
        console.log('[Bridge] Invoking init_camera');
        // Note: detailed backend implementation might be pending, but command exists in our plan
        // We utilize 'release_camera_handle' which we implemented in lib.rs
        // But we need 'acquire_camera_handle' too. 
        // For now, mapping 'initCamera' to a potential 'acquire_camera_handle'
        return await invoke('acquire_camera_handle', { cameraId: "default" });
    },

    /**
     * Kill the camera stream (Hardware Release).
     * backend: kill_camera
     */
    killCamera: async (): Promise<void> => {
        console.log('[Bridge] Invoking kill_camera');
        return await invoke('release_camera_handle');
    },

    /**
     * Initialize the embedded database.
     * backend: init_db
     */
    initDb: async (): Promise<void> => {
        console.log('[Bridge] Invoking init_db');
        // We haven't implemented init_db in lib.rs yet, so this might fail if called.
        // Keeping the bridge definition generic.
        return await invoke('init_db');
    }
};
