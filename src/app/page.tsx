"use client";

import dynamic from "next/dynamic";

// Tắt SSR cho phần chứa Phaser
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
});

export default function PoseGame() {
  return <GameCanvas />;
}
