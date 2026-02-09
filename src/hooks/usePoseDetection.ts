import { useRef, useEffect, useState, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

import { calculatePostureMetrics, PostureMetrics } from '../utils/postureMath';

export const usePoseDetection = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const rafId = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const lastUpdate = useRef<number>(0);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [postureState, setPostureState] = useState<PostureMetrics>({
        total: 100, neck: 100, shoulders: 100, spine: 100, isGood: true
    });

    const stopTracking = useCallback(() => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }

        // CRITICAL: Stop all hardware tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsAnalyzing(false);
    }, []);

    const detect = async () => {
        if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
            rafId.current = requestAnimationFrame(detect);
            return;
        }

        try {
            const poses = await detectorRef.current.estimatePoses(videoRef.current);
            if (poses && poses.length > 0) {
                const now = Date.now();
                // Throttle: 100ms
                if (now - lastUpdate.current > 100) {
                    const metrics = calculatePostureMetrics(poses[0].keypoints);
                    setPostureState(metrics);
                    lastUpdate.current = now;
                }
            }
        } catch (e) {
            console.error("Pose Detection Error:", e);
        }

        rafId.current = requestAnimationFrame(detect);
    };

    const startTracking = async () => {
        await stopTracking(); // Safety clear

        // Load Model if needed
        if (!detectorRef.current) {
            await tf.setBackend('webgl');
            await tf.ready();
            detectorRef.current = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
            );
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    videoRef.current?.play();
                    setIsAnalyzing(true);
                    detect();
                };
            }
        } catch (err) {
            console.error("Camera Init Error:", err);
            setIsAnalyzing(false);
        }
    };

    const toggleAnalysis = () => {
        if (isAnalyzing) stopTracking();
        else startTracking();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTracking();
        };
    }, [stopTracking]);

    return {
        videoRef,
        postureState,
        isAnalyzing,
        toggleAnalysis
    };
};
