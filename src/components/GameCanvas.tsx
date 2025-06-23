"use client";
import { useEffect, useRef } from "react";
import { createGame } from "./Game";

export default function GameCanvas() {
  useEffect(() => {
    createGame(document.getElementById("phaser-container") as HTMLDivElement);
  }, []);

  return (
    <div
      id="phaser-container"
      className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
      style={{
        transform: "scaleX(-1)",
      }}
    />
  );
}
