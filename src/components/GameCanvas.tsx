"use client";

import { useCallback, useState } from "react";
import PoseDetector from "@/components/PoseDetector";
import Game from "@/components/Game";

export default function GameCanvas() {
  const [isReady, setIsReady] = useState("idle");
  const [startGame, setStartGame] = useState(false);

  const onReady = (status) => {
    setIsReady(status);
  };
  console.log("isReady", isReady);
  return (
    <div className="relative w-screen h-screen">
      <PoseDetector onReady={onReady} />
      <Game isRunning={isReady && startGame} />

      {isReady === "idle" && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-80 flex items-center justify-center text-white text-2xl">
          Loading Pose Detection...
        </div>
      )}

      {isReady === "error" && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-80 flex items-center justify-center text-white text-2xl">
          Something went wrong. Please try again.
        </div>
      )}

      {isReady === "ready" && !startGame && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-60 flex items-center justify-center">
          <button
            className="px-6 py-3 text-xl bg-green-500 text-white rounded shadow"
            onClick={() => setStartGame(true)}
          >
            Play Game
          </button>
        </div>
      )}
    </div>
  );
}
