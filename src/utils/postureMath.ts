import { Landmark } from "../services/bridge";

// Configuration for Sensitivity
export const POSTURE_THRESHOLDS = {
    NECK_ANGLE_LIMIT: 15, // Degrees (Above this = Slouching)
    TORSO_ANGLE_LIMIT: 10, // Degrees (Leaning too far forward/back)
};

export interface PostureResult {
    isGood: boolean;
    neckAngle: number;
    torsoAngle: number;
    message: string;
}

/**
 * The Core Logic: Determines if the user is slouching.
 * * Strategy:
 * 1. Find the midpoint between shoulders (Upper Back).
 * 2. Compare Nose position relative to Shoulders (Neck Forward Tilt).
 * 3. Compare Shoulders relative to Hips (Torso Lean).
 */
export function analyzePosture(landmarks: Landmark[]): PostureResult {
    // 1. Extract Key Points (MediaPipe Indices)
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];

    // Safety Check: Ensure we have all points with good visibility
    if (!nose || !leftShoulder || !rightShoulder || !leftEar) {
        return { isGood: true, neckAngle: 0, torsoAngle: 0, message: "No User Detected" };
    }

    // 2. Calculate Midpoints
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    const earMidX = (leftEar.x + rightEar.x) / 2;
    const earMidY = (leftEar.y + rightEar.y) / 2;

    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;

    // 3. Calculate Neck Angle (Vertical vs. Ear-Shoulder Line)
    // A perfect neck is vertical (90 degrees relative to ground, or 0 deviation).
    // We calculate the deviation from the vertical axis.
    // Note: Y increases downwards in canvas/image coordinates.
    // dy is negative if ear is above shoulder. using abs(atan2) helps normalize.
    const dy = shoulderMidY - earMidY;
    const dx = shoulderMidX - earMidX;

    // Angle in degrees relative to horizontal (0 is right, 90 is down, -90 is up)
    let rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    // We expect the neck to be roughly vertical (around 90 degrees or -90 depending on orientation)
    // Here we want deviation from vertical (90 degrees).
    let neckAngle = Math.abs(Math.abs(rawAngle) - 90);

    // 4. Calculate Torso Angle (Lean)
    // Deviation of the Shoulder-Hip line from vertical
    const torsoDy = hipMidY - shoulderMidY;
    const torsoDx = hipMidX - shoulderMidX;
    let rawTorsoAngle = Math.atan2(torsoDy, torsoDx) * (180 / Math.PI);
    let torsoAngle = Math.abs(Math.abs(rawTorsoAngle) - 90);

    // 5. The Verdict
    let isGood = true;
    let message = "Perfect Posture";

    // Rule A: Tech Neck (Head is too far forward)
    if (neckAngle > POSTURE_THRESHOLDS.NECK_ANGLE_LIMIT) {
        isGood = false;
        message = "Lift Your Head!";
    }

    // Rule B: Slouching (Leaning back/forward too much)
    if (torsoAngle > POSTURE_THRESHOLDS.TORSO_ANGLE_LIMIT) {
        isGood = false;
        // Optimization: Distinguish forward vs backward lean could be done here if needed
        message = "Sit Up Straight!";
    }

    return {
        isGood,
        neckAngle: Math.round(neckAngle),
        torsoAngle: Math.round(torsoAngle),
        message
    };
}
