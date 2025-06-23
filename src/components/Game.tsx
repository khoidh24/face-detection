import * as Phaser from "phaser";
import { MainScene } from "./Scene";

export const createGame = (container: HTMLDivElement) => {
  return new Phaser.Game({
    type: Phaser.AUTO,
    transparent: true,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: container,
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [MainScene],
  });
};
