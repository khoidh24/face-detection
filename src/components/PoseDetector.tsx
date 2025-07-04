"use client";

import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  // 1. Khởi tạo pose detector
  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const pose = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_full.task", // Nâng lên model full
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      setPoseLandmarker(pose);
    };

    init();
  }, []);

  // 2. Mở camera
  useEffect(() => {
    const openCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Trình duyệt không hỗ trợ camera.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, // camera trước
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        alert("Không thể mở camera: " + err);
      }
    };

    openCamera();
  }, []);

  // 3. Phân tích pose mỗi frame
  useEffect(() => {
    let animationId: number;
    const img = new Image();
    img.src = "/cat.png";

    img.onload = () => {
      const detect = () => {
        if (
          !videoRef.current ||
          !canvasRef.current ||
          !poseLandmarker ||
          videoRef.current.readyState < 2
        ) {
          animationId = requestAnimationFrame(detect);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const res = poseLandmarker.detectForVideo(video, performance.now());

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (res.landmarks.length > 0) {
          const landmarks = res.landmarks[0];
          const nose = landmarks[0];
          const leftEye = landmarks[2];
          const rightEye = landmarks[5];

          const eyeMid = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
          };

          const dx = nose.x - eyeMid.x;
          const dy = nose.y - eyeMid.y;

          const forehead = {
            x: eyeMid.x - dx,
            y: eyeMid.y - dy - 0.04,
          };

          const mirroredX = 1 - forehead.x; // 👈 mirror tọa độ X vì video bị lật
          const x = mirroredX * canvas.width;
          const y = forehead.y * canvas.height;

          const imgSize = 128;
          ctx.drawImage(
            img,
            x - imgSize / 2,
            y - imgSize / 2,
            imgSize,
            imgSize
          );

          // 🎯 DEBUG các điểm: mũi, mắt trái, mắt phải
          const drawDot = (pt: { x: number; y: number }, color: string) => {
            const mirroredX = 1 - pt.x; // mirror X lại
            ctx.beginPath();
            ctx.arc(
              mirroredX * canvas.width,
              pt.y * canvas.height,
              6,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = color;
            ctx.fill();
          };

          drawDot(nose, "red");
          drawDot(leftEye, "green");
          drawDot(rightEye, "blue");
        }

        animationId = requestAnimationFrame(detect);
      };

      detect();
    };

    return () => cancelAnimationFrame(animationId);
  }, [poseLandmarker]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-auto transform -scale-x-100"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-auto pointer-events-none"
      />
    </div>
  );
}
