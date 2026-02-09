import { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
// Register WebGL backend
import '@tensorflow/tfjs-backend-webgl';

import { analyzePosture, PostureResult } from '../utils/postureMath';


/**
 * Hook for managing pose detection camera stream AND TensorFlow.js detection loop.
 * Now handles both camera lifecycle and AI inference.
 */
export const usePoseDetection = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const loopRef = useRef<number | null>(null);
    const [isDetectorReady, setIsDetectorReady] = useState(false);

    // Exposed State
    const [posture, setPosture] = useState<PostureResult | null>(null);
    const [landmarks, setLandmarks] = useState<any[]>([]); // Using any for TFJS keypoints

    useEffect(() => {
        const loadModel = async () => {
            try {
                console.log("⏳ Initializing TensorFlow.js Backend...");

                // FORCE WEBGL BACKEND
                await tf.setBackend('webgl');
                await tf.ready();

                console.log("✅ TensorFlow Ready. Backend:", tf.getBackend());

                console.log("⏳ Loading MoveNet Model...");
                // Race condition: Timeout after 10 seconds
                const modelPromise = poseDetection.createDetector(
                    poseDetection.SupportedModels.MoveNet,
                    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
                );

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Model Load Timeout (10s)")), 10000)
                );

                const detector = await Promise.race([modelPromise, timeoutPromise]) as poseDetection.PoseDetector;

                detectorRef.current = detector;
                setIsDetectorReady(true);
                console.log("🧠 MoveNet Model Loaded (Lightning)");
            } catch (err) {
                console.error("🚨 Model Loading Failed:", err);
                alert(`AI Model Error: ${err}`);
            }
        };
        loadModel();
    }, []);

    const startTracking = async () => {
        console.log("📸 Requesting Camera Access...");
        // 1. HARD RESET
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }

        try {
            // 2. CAMERA INIT
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false
            });
            console.log("✅ Camera Stream Acquired");

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                console.log("🔗 Attaching stream to video element...");

                await new Promise<void>((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => {
                            console.log("🎥 Video Metadata Loaded");
                            videoRef.current!.play().then(() => {
                                console.log("▶️ Video Playing");
                                resolve();
                            });
                        };
                    }
                });

                // 3. START DETECTION LOOP
                console.log("🔄 Starting Detection Loop");
                detectLoop();
                return true;
            } else {
                console.error("❌ Video Ref is null during startTracking");
            }
            return false;
        } catch (error) {
            console.error("🚨 CAMERA START ERROR:", error);
            let msg = "Unknown Camera Error";
            if (error instanceof DOMException) {
                if (error.name === "NotAllowedError") msg = "Camera Access Denied.";
                else if (error.name === "OverconstrainedError") msg = "Resolution Mismatch.";
                else msg = `Camera Error: ${error.name}`;
            }
            alert(msg);
            return false;
        }
    };

    const lastUpdate = useRef(0); // THROTTLE: Track last state update time

    const detectLoop = async () => {
        if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
            loopRef.current = requestAnimationFrame(detectLoop);
            return;
        }

        try {
            const poses = await detectorRef.current.estimatePoses(videoRef.current);

            if (poses.length > 0) {
                const pose = poses[0];

                // DYNAMIC RESOLUTION: Safe Check
                const vWidth = videoRef.current.videoWidth || 640;
                const vHeight = videoRef.current.videoHeight || 480;

                if (vWidth === 0 || vHeight === 0) {
                    console.warn("⚠️ Video dimensions 0, skipping frame");
                    loopRef.current = requestAnimationFrame(detectLoop);
                    return;
                }

                // Convert TFJS Keypoints to Bridge/App format if matched
                const mappedLandmarks = pose.keypoints.map(kp => ({
                    x: kp.x / vWidth,
                    y: kp.y / vHeight,
                    z: 0,
                    visibility: kp.score || 0
                }));

                const result = analyzePosture(mappedLandmarks, 5);

                // THROTTLE: Only update React State every 100ms (10fps for UI is plenty)
                const now = Date.now();
                if (now - lastUpdate.current > 100) {
                    // DEBUG LOG: Prove we are calculating new numbers
                    console.log(`📊 STATS UPDATE: Score ${result.score} | Neck ${result.metrics.neck} | Tilt Head to test!`);

                    setPosture({ ...result });
                    setLandmarks([...mappedLandmarks]);
                    lastUpdate.current = now;
                }
            } else {
                setPosture(null);
                setLandmarks([]);
            }

        } catch (error) {
            console.error("🔥 Detection Loop Crashed:", error);
        }

        loopRef.current = requestAnimationFrame(detectLoop);
    };

    const stopTracking = () => {
        if (loopRef.current) cancelAnimationFrame(loopRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        return () => stopTracking();
    }, []);

    return {
        videoRef,
        startTracking,
        stopTracking,
        posture, // Expose current posture result
        landmarks, // Expose raw landmarks for drawing
        isReady: isDetectorReady
    };
};
