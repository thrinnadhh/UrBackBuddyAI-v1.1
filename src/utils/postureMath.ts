import { Landmark } from "../services/bridge";

// Configuration for Sensitivity
export const POSTURE_THRESHOLDS = {
    NECK_ANGLE_LIMIT: 15, // Degrees (Above this = Slouching)
    TORSO_ANGLE_LIMIT: 10, // Degrees (Leaning too far forward/back)
};

export interface PostureMetrics {
    neck: number;      // 0-100
    shoulders: number; // 0-100
    spine: number;     // 0-100
}

export interface PostureResult {
    isGood: boolean;
    score: number; // Global weighted score (0-100)
    metrics: PostureMetrics;
    message: string;
    reason: string | null;  // New field for specific feedback
}

/**
 * The Core Logic: Determines if the user is slouching.
 * Now returns granular metrics for Neck, Shoulders, and Spine.
 */
export function analyzePosture(landmarks: Landmark[], sensitivity: number = 5): PostureResult {
    // 1. Extract Key Points (MediaPipe Indices)
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    // Default Fallback
    const fallbackResult: PostureResult = {
        isGood: true,
        score: 100,
        metrics: { neck: 100, shoulders: 100, spine: 100 },
        message: "No User Detected",
        reason: "ignore"
    };

    // Safety Check
    if (!nose || !leftShoulder || !rightShoulder || !leftEar || !rightEar) {
        return fallbackResult;
    }

    // --- 1. ROBUSTNESS CHECKS (Ignore Cases) ---

    // Check A: Visibility
    if (leftShoulder.visibility < 0.2 || rightShoulder.visibility < 0.2) {
        return { ...fallbackResult, message: "Adjust Camera" };
    }

    // Check B: Hand-Face Interaction
    if ((leftWrist && leftWrist.visibility > 0.2 && leftWrist.y < nose.y) ||
        (rightWrist && rightWrist.visibility > 0.2 && rightWrist.y < nose.y)) {
        return { ...fallbackResult, message: "Hand Near Face" };
    }

    // Check C: Head Turn
    const minEarX = Math.min(leftEar.x, rightEar.x);
    const maxEarX = Math.max(leftEar.x, rightEar.x);
    if (nose.x < minEarX || nose.x > maxEarX) {
        return { ...fallbackResult, message: "Looking Away" };
    }

    // --- 2. METRIC CALCULATIONS ---

    // ASPECT RATIO CORRECTION (Assuming 4:3 default if normalized)
    // We must scale X to match Y's scale to get true angles.
    // Normalized X covers more "distance" per unit than Normalized Y in a 4:3 landscape.
    // To make 1 unit of X equal 1 unit of Y visually, we multiply X by (Width/Height).
    const aspectRatio = 1.333; // 640/480

    // A. NECK SCORE (Forward Head Posture / Tilt)
    // We compare Ear vs Shoulder center logic
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const earMidX = (leftEar.x + rightEar.x) / 2;
    const earMidY = (leftEar.y + rightEar.y) / 2;

    const dy = shoulderMidY - earMidY;
    const dx = (shoulderMidX - earMidX) * aspectRatio; // Corrected X

    // Angle relative to vertical (90 degrees)
    const rawNeckAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const neckDeviation = Math.abs(Math.abs(rawNeckAngle) - 90);

    // Formula: Score drops faster for neck (vital)
    let neckScore = 100 - (neckDeviation * 3.0);

    // B. SHOULDERS SCORE (Levelness)
    // Compare Y levels directly (X distance doesn't matter for levelness, just Y delta)
    // Scale up specific visibility for metric
    const shoulderYDiff = Math.abs(leftShoulder.y - rightShoulder.y) * 1000;

    // Formula: 100 - (pixels * coefficient)
    let shoulderScore = 100 - (shoulderYDiff * 0.8);

    // C. SPINE SCORE (Torso Lean)
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;

    const torsoDy = hipMidY - shoulderMidY;
    const torsoDx = (hipMidX - shoulderMidX) * aspectRatio; // Corrected X

    const rawTorsoAngle = Math.atan2(torsoDy, torsoDx) * (180 / Math.PI);
    const torsoDeviation = Math.abs(Math.abs(rawTorsoAngle) - 90);

    // Formula: Torso is sturdier, punish less
    let spineScore = 100 - (torsoDeviation * 2.0);

    // --- 3. CLAMP SCORING (50 - 100) ---
    const clamp = (val: number) => Math.min(Math.max(val, 20), 100); // Allow lower scores for dramatically bad posture

    neckScore = clamp(neckScore);
    shoulderScore = clamp(shoulderScore);
    spineScore = clamp(spineScore);

    // --- 4. GLOBAL SCORE & VERDICT ---
    const globalScore = (neckScore * 0.45) + (spineScore * 0.35) + (shoulderScore * 0.2);

    let isGood = true;
    let message = "Perfect Posture";

    // Sensitivity Adjustment
    /* 
       Sensitivity 1 (Low) -> Threshold 50
       Sensitivity 5 (Med) -> Threshold 75
       Sensitivity 10 (High) -> Threshold 90
    */
    const threshold = 50 + (sensitivity * 4);

    if (globalScore < threshold) {
        isGood = false;
        // Identify the weakest link for feedback
        if (neckScore <= shoulderScore && neckScore <= spineScore) message = "Lift Your Head!";
        else if (spineScore <= neckScore && spineScore <= shoulderScore) message = "Sit Up Straight!";
        else message = "Fix Shoulders!";
    }

    // Force integer rounding
    return {
        isGood,
        score: Math.round(globalScore),
        metrics: {
            neck: Math.round(neckScore),
            shoulders: Math.round(shoulderScore),
            spine: Math.round(spineScore)
        },
        message,
        reason: isGood ? null : "bad_posture"
    };
}
