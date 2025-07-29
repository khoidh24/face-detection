"use client";

import { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { usePositionStore } from "@/hooks/usePositionStore";
import { memo } from "react";

const Game = ({ isRunning }: { isRunning: boolean }) => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const positionRef = useRef({ x: 0, y: 0 });

  const { x, y } = usePositionStore();

  useEffect(() => {
    positionRef.current = { x, y };
  }, [x, y]);

  useEffect(() => {
    if (!isRunning || !gameContainer.current) return;
    class MainScene extends Phaser.Scene {
      cat!: Phaser.GameObjects.Image;
      score = 0;
      scoreText!: Phaser.GameObjects.Text;
      fpsText!: Phaser.GameObjects.Text;
      positionTextX!: Phaser.GameObjects.Text;
      positionTextY!: Phaser.GameObjects.Text;
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
        this.fpsText = this.add.text(200, 16, "FPS: 0", {
          fontSize: "24px",
          color: "#000",
        });

        this.positionTextX = this.add.text(
          16,
          150,
          `${positionRef.current.x}`,
          {
            fontSize: "18px",
            color: "#000",
            fontStyle: "bold",
          }
        );
        this.positionTextY = this.add.text(
          16,
          170,
          `${positionRef.current.y}`,
          {
            fontSize: "18px",
            color: "#000",
            fontStyle: "bold",
          }
        );

        this.cat = this.physics.add
          .image(
            positionRef.current.x * window.innerWidth,
            positionRef.current.y * window.innerHeight,
            "cat"
          )
          .setDisplaySize(86, 86)
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
            setFinalScore(this.score);
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
        const { x, y } = positionRef.current;
        const posX = 1 - x * 1;
        const deltaX = (1 - x - 0.5) * 2;
        this.cat.setPosition(
          Number((posX + deltaX).toFixed(2)) * window.innerWidth,
          Number(y.toFixed(2)) * window.innerHeight - this.cat.displayHeight
        );
        this.fpsText.setText("FPS: " + this.game.loop.actualFps.toFixed(2));
        this.positionTextX.setText(`${positionRef.current.x.toFixed(5)}`);
        this.positionTextY.setText(`${positionRef.current.y.toFixed(5)}`);
        // Destroy green objects out of screen
        this.greenGroup
          .getChildren()
          .forEach((g: Phaser.GameObjects.GameObject) => {
            if ((g as Phaser.GameObjects.Sprite).y > window.innerHeight) {
              g.destroy();
            }
          });

        // Destroy red objects out of screen
        this.redGroup
          .getChildren()
          .forEach((r: Phaser.GameObjects.GameObject) => {
            if ((r as Phaser.GameObjects.Sprite).y > window.innerHeight) {
              r.destroy();
            }
          });
      }

      spawnObjects() {
        const x1 = Phaser.Math.Between(0, window.innerWidth);
        const g = this.greenGroup.create(x1, 0, "green");
        const rndSize = Phaser.Math.Between(30, 48);
        g.setVelocityY(Phaser.Math.Between(150, 300)).setDisplaySize(
          rndSize,
          rndSize
        );

        const x2 = Phaser.Math.Between(0, window.innerWidth);
        const r = this.redGroup.create(x2, 0, "red");
        const rndSizeRed = Phaser.Math.Between(30, 48);
        r.setVelocityY(Phaser.Math.Between(150, 300)).setDisplaySize(
          rndSizeRed,
          rndSizeRed
        );
      }
    }

    const game = new Phaser.Game({
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
    });

    return () => {
      game.destroy(true);
    };
  }, [isRunning]);

  return (
    <>
      <div
        ref={gameContainer}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {isGameOver && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-70 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-3xl text-white font-bold">Game Over</h1>
          <p className="text-xl text-white">Your Score: {finalScore}</p>
          <button
            className="px-6 py-3 bg-blue-500 text-white text-xl rounded shadow"
            onClick={() => window.location.reload()}
          >
            Play Again
          </button>
        </div>
      )}
    </>
  );
};

export default memo(Game);
