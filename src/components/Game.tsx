"use client";

import { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { usePositionStore } from "@/hooks/usePositionStore";

export default function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const { setHeadPosition } = usePositionStore();
  const positionRef = useRef({ x: 0, y: 0 });

  // Init pose detection
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

  // Pose detection tracking
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
        positionRef.current = { x: nose.x, y: nose.y };
        setHeadPosition(nose.x, nose.y);

        // 🎯 debug dot
        ctx.beginPath();
        ctx.arc(
          (1 - nose.x) * canvas.width,
          nose.y * canvas.height,
          6,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = "red";
        ctx.fill();
      }
    }, 1000 / 60); // Run at 60 FPS

    setIsReady(true);
    return () => clearInterval(intervalId);
  }, [poseLandmarker]);

  // Game logic
  useEffect(() => {
    if (!isReady || !showStart || !gameContainer.current) return;

    const posRef = positionRef;

    class MainScene extends Phaser.Scene {
      cat!: Phaser.GameObjects.Image;
      score = 0;
      scoreText!: Phaser.GameObjects.Text;
      timeText!: Phaser.GameObjects.Text;
      timerEvent!: Phaser.Time.TimerEvent;
      greenGroup!: Phaser.Physics.Arcade.Group;
      redGroup!: Phaser.Physics.Arcade.Group;

      preload() {
        this.load.image("green", "/green.png");
        this.load.image("red", "/red.png");
        this.load.image("cat", "/cat.png");
      }

      create() {
        this.cat = this.physics.add
          .image(
            posRef.current.x * window.innerWidth,
            posRef.current.y * window.innerHeight,
            "cat"
          )
          .setDisplaySize(96, 96)
          .setImmovable(true);
        (this.cat.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        this.cat.setOrigin(0.5, 0);

        this.greenGroup = this.physics.add.group();
        this.redGroup = this.physics.add.group();

        this.scoreText = this.add.text(16, 16, "Score: 0", {
          fontSize: "24px",
          color: "#ffffff",
        });

        this.timeText = this.add.text(16, 48, "Time: 90", {
          fontSize: "24px",
          color: "#ffffff",
        });

        this.timerEvent = this.time.addEvent({
          delay: 90_000,
          callback: () => {
            this.scene.pause();
            setIsGameOver(true);
          },
        });

        this.time.addEvent({
          delay: 1000,
          loop: true,
          callback: () => {
            const remaining = Math.max(
              0,
              Math.ceil(this.timerEvent.getRemaining() / 1000)
            );
            this.timeText.setText("Time: " + remaining);
          },
        });

        this.time.addEvent({
          delay: 1000,
          loop: true,
          callback: () => this.spawnObjects(),
        });

        this.physics.add.overlap(this.cat, this.greenGroup, (_, g) => {
          g.destroy();
          this.score += 10;
          this.scoreText.setText("Score: " + this.score);
        });

        this.physics.add.overlap(this.cat, this.redGroup, (_, r) => {
          r.destroy();
          this.score = Math.max(0, this.score - 5);
          this.scoreText.setText("Score: " + this.score);
        });
      }

      update() {
        const { x, y } = posRef.current;
        this.cat.setPosition(
          (1 - x) * window.innerWidth,
          y * window.innerHeight
        );
      }

      spawnObjects() {
        const x1 = Phaser.Math.Between(0, window.innerWidth);
        const g = this.greenGroup.create(x1, 0, "green");
        g.setVelocityY(Phaser.Math.Between(150, 300)).setDisplaySize(48, 48);

        const x2 = Phaser.Math.Between(0, window.innerWidth);
        const r = this.redGroup.create(x2, 0, "red");
        r.setVelocityY(Phaser.Math.Between(150, 300)).setDisplaySize(48, 48);
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainer.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "transparent",
      transparent: true,
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: MainScene,
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, [isReady, showStart]);

  return (
    <div className="relative w-screen h-screen">
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

      {!isReady && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-80 flex items-center justify-center text-white text-2xl">
          Loading Pose Detection...
        </div>
      )}

      {isReady && !showStart && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-60 flex items-center justify-center">
          <button
            className="px-6 py-3 text-xl bg-green-500 text-white rounded shadow"
            onClick={() => {
              setShowStart(true);
              setIsGameOver(false);
            }}
          >
            Play Game
          </button>
        </div>
      )}

      <div
        ref={gameContainer}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {isGameOver && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-70 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-3xl text-white">Game Over</h1>
          <button
            className="px-6 py-3 bg-blue-500 text-white text-xl rounded shadow"
            onClick={() => {
              setShowStart(false);
              setIsGameOver(false);
              window.location.reload();
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}