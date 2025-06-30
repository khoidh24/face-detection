"use client";

import { memo, useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { usePositionStore } from "@/hooks/usePositionStore";

const PoseDetector = ({ onReady }: { onReady: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setHeadPosition } = usePositionStore();
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  // Init model
  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const pose = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_full.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      setPoseLandmarker(pose);
    };
    init();
  }, []);

  // Open camera
  useEffect(() => {
    const openCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    };
    openCamera();
  }, []);

  // Detect loop
  useEffect(() => {
    if (!poseLandmarker) return;

    const intervalId = setInterval(() => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.readyState < 2
      )
        return;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const res = poseLandmarker.detectForVideo(
        videoRef.current,
        performance.now()
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (res.landmarks.length > 0) {
        const nose = res.landmarks[0][0];
        setHeadPosition(nose.x, nose.y);
      }
    }, 1000 / 60);

    onReady();

    return () => clearInterval(intervalId);
  }, [poseLandmarker]);

  return (
    <>
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100"
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </>
  );
};

export default memo(PoseDetector);
