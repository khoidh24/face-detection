"use client";

import PoseDetector from "@/components/PoseDetector";
import dynamic from "next/dynamic";
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
});

export default function GamePage() {
  return (
    <div className="relative">
      <PoseDetector />
      <GameCanvas />
    </div>
  );
}
