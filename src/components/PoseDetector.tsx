"use client";

import { memo, useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";
import { usePositionStore } from "@/hooks/usePositionStore";

let animationFrameId: number;
let lastCalledTime;
let fps = 0;
const points: any[] = [];
const PoseDetector = ({ onReady }: { onReady: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setHeadPosition } = usePositionStore();
  const [poseLandmarker, setPoseLandmarker] = useState<FaceDetector | null>(
    null
  );

  // Init model
  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        console.log("vision", vision);
        const pose = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            // modelAssetPath:
            //   window.location.href + "/blaze_face_short_range.tflite",
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            // "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_full.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.7,
          // numPoses: 1,
        });
        // const pose = await PoseLandmarker.createFromOptions(vision, {
        //   baseOptions: {
        //     modelAssetPath:
        //       "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_full.task",
        //     delegate: "GPU",
        //   },
        //   runningMode: "VIDEO",
        //   numPoses: 1,
        // });
        console.log("pose", pose);
        setPoseLandmarker(pose as unknown as FaceDetector);
      } catch (error) {
        alert(error);
      }
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
        console.log(
          "videoRef.current",
          videoRef.current,
          videoRef.current.readyState,
          canvasRef.current
        );
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then((_) => {
              // Automatic playback started!
              // Show playing UI.
              // We can now safely pause video...
              // videoRef.current.pause();
            })
            .catch((error) => {
              // Auto-play was prevented
              // Show paused UI.
            });
        }
      }
    };
    openCamera();
  }, []);

  // Detect loop
  useEffect(() => {
    function countFPS() {
      if (!lastCalledTime) {
        lastCalledTime = performance.now();
        fps = 0;
        return;
      }
      let delta = (performance.now() - lastCalledTime) / 1000;
      lastCalledTime = performance.now();
      fps = 1 / delta;
      return fps;
    }

    async function faceDetection() {
      if (!poseLandmarker) return;
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

      const res = await poseLandmarker.detectForVideo(
        videoRef.current,
        performance.now()
      );

      for (let child of points) {
        document.body.removeChild(child);
      }
      points.splice(0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (res?.detections?.[0]?.keypoints) {
        const { keypoints } = res.detections[0];
        for (const [index, keypoint] of keypoints.entries()) {
          const keypointEl = document.createElement("div");
          keypointEl.className = "key-point";
          keypointEl.style.top = `${
            keypoint.y * videoRef.current.offsetHeight - 3
          }px`;
          keypointEl.style.left = `${
            videoRef.current.offsetWidth -
            keypoint.x * videoRef.current.offsetWidth -
            3
          }px`;
          keypointEl.textContent = index.toString();
          document.body.appendChild(keypointEl);
          points.push(keypointEl);
        }
        // const x =
        //   (videoRef.current.offsetWidth -
        //     keypoints[0].x * videoRef.current.offsetWidth -
        //     3 +
        //     (videoRef.current.offsetWidth -
        //       keypoints[1].x * videoRef.current.offsetWidth -
        //       3)) /
        //   2;
        // const y = keypoints[0].y * videoRef.current.offsetHeight - 3;

        //display FPS
        // const _fps = countFPS();
        // const keypointEl = document.createElement("div");
        // keypointEl.className = "key-point";
        // keypointEl.style.top = `${10}px`;
        // keypointEl.style.left = `${200}px`;
        // keypointEl.style.width = `${200}px`;
        // keypointEl.style.height = `${100}px`;
        // keypointEl.style.backgroundColor = "transparent";
        // keypointEl.textContent = _fps?.toFixed(2);
        // document.body.appendChild(keypointEl);
        // points.push(keypointEl);

        setHeadPosition((keypoints[0].x + keypoints[1].x) / 2, keypoints[0].y);
      }
      onReady();
      // if (res.landmarks.length > 0) {
      //   const nose = res.landmarks[0][0];
      //   setHeadPosition(nose.x, nose.y);
      // }
      animationFrameId = requestAnimationFrame(faceDetection);
    }
    console.log("useEffect");
    faceDetection();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onReady, poseLandmarker, setHeadPosition]);

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
