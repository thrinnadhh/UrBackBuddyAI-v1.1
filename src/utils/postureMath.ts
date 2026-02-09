/**
 * postureMath.ts
 * The Brain: Calculates posture metrics from TensorFlow/MoveNet keypoints.
 */

export interface PostureMetrics {
    total: number;
    neck: number;
    shoulders: number;
    spine: number;
    isGood: boolean;
}

export function calculatePostureMetrics(keypoints: any[]): PostureMetrics {
    // Safety Fallback
    const fallback = { total: 0, neck: 0, shoulders: 0, spine: 0, isGood: false };
    if (!keypoints || keypoints.length === 0) return fallback;

    const findKp = (name: string) => keypoints.find((kp: any) => kp.name === name);

    const nose = findKp('nose');
    const leftEar = findKp('left_ear');
    const rightEar = findKp('right_ear');
    const leftShoulder = findKp('left_shoulder');
    const rightShoulder = findKp('right_shoulder');
    const leftHip = findKp('left_hip');
    const rightHip = findKp('right_hip');

    // Missing crucial points? Return bad score to allow UI to prompt user
    if (!nose || !leftEar || !rightEar || !leftShoulder || !rightShoulder) {
        return fallback;
    }

    // --- FORMULAS ---

    // 1. Neck: Vertical alignment of ears vs shoulders (simplified pixel delta)
    // Formula: 100 - abs(ear.x - shoulder.x) * 2
    const earX = (leftEar.x + rightEar.x) / 2;
    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    let neck = 100 - Math.abs(earX - shoulderX) * 2;

    // 2. Shoulders: Levelness check
    // Formula: 100 - abs(leftShoulder.y - rightShoulder.y) * 4
    let shoulders = 100 - Math.abs(leftShoulder.y - rightShoulder.y) * 4;

    // 3. Spine: Forward lean (Nose vs Hips)
    // Formula: 100 - abs(nose.x - hip.x) * 2
    let spine = 100;
    if (leftHip && rightHip) {
        const hipsX = (leftHip.x + rightHip.x) / 2;
        spine = 100 - Math.abs(nose.x - hipsX) * 2;
    } else {
        // Fallback to shoulders if hips are off-screen (webcam close-up)
        spine = shoulders;
    }

    // --- CLAMPING ---
    const clamp = (v: number) => Math.min(Math.max(v, 0), 100);
    neck = clamp(neck);
    shoulders = clamp(shoulders);
    spine = clamp(spine);

    // --- TOTAL WEIGHTED ---
    // Neck is most important for "text neck"
    const total = (neck * 0.4) + (spine * 0.4) + (shoulders * 0.2);

    return {
        total: Math.round(total),
        neck: Math.round(neck),
        shoulders: Math.round(shoulders),
        spine: Math.round(spine),
        isGood: total > 80 // Strict threshold
    };
}
