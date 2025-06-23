import * as Phaser from "phaser";
import { getPosition } from "@/hooks/usePositionStore";

export class MainScene extends Phaser.Scene {
  player!: Phaser.GameObjects.Rectangle;
  fruits!: Phaser.Physics.Arcade.Group;
  speedMultiplier = 1;
  score = 0;
  scoreText!: Phaser.GameObjects.Text;
  gameDuration = 90_000; // 1 phút 30 giây
  timerText!: Phaser.GameObjects.Text;
  gameOver = false;
  startTime = 0;

  preload() {
    this.load.image("green", "/green.png");
    this.load.image("red", "/red.webp");
  }

  create() {
    this.player = this.add.rectangle(0, 0, 80, 80, 0xffffff, 0).setOrigin(0.5);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.fruits = this.physics.add.group();

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.spawnFruit(),
    });

    this.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => {
        this.speedMultiplier += 0.02;
      },
    });

    this.physics.add.overlap(
      this.player,
      this.fruits,
      this.handleCollision,
      undefined,
      this
    );

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameOver) return;

        const remaining = Math.max(
          0,
          Math.floor((this.gameDuration - this.time.now) / 1000)
        );

        if (remaining <= 0) {
          this.endGame();
        }
      },
    });

    this.scoreText = this.add.text(0, 0, "Score: 0", {
      fontSize: "20px",
      color: "#fff",
      backgroundColor: "#222",
      padding: { x: 10, y: 5 },
    });
    this.scoreText.setOrigin(1, 0);
    this.scoreText.setScale(-1, 1);
    this.scoreText.setPosition(this.cameras.main.width - 180, 10);

    this.timerText = this.add.text(0, 0, "Time: 90", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#222",
      padding: { x: 10, y: 5 },
    });
    this.timerText.setOrigin(1, 0);
    this.timerText.setScale(-1, 1);
    this.timerText.setPosition(this.cameras.main.width - 128, 50);

    // ✅ Start timer sau một frame (đảm bảo mọi thứ đã load xong)
    this.time.delayedCall(500, () => {
      this.startGame();
    });
  }

  startGame() {
    this.startTime = this.time.now;

    // Bắt đầu spawn trái cây
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.spawnFruit(),
    });

    // Tăng tốc độ rơi mỗi 30s
    this.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => {
        this.speedMultiplier += 0.02;
      },
    });

    // ✅ Bắt đầu đếm thời gian
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameOver || this.startTime === 0) return;

        const elapsed = this.time.now - this.startTime;
        const remaining = Math.max(
          0,
          Math.floor((this.gameDuration - elapsed) / 1000)
        );
        this.timerText.setText(`Time: ${remaining}`);

        if (remaining <= 0) {
          this.endGame();
        }
      },
    });
  }

  spawnFruit() {
    if (this.gameOver) return;
    const x = Phaser.Math.Between(50, 750);
    const type = Math.random() < 0.7 ? "green" : "red";

    const fruit = this.fruits.create(x, 0, type) as Phaser.Physics.Arcade.Image;
    fruit.setVelocityY(200);
    fruit.setScale(0.2);
    fruit.setData("type", type);
  }

  handleCollision(player: any, fruit: any) {
    if (this.gameOver) return;

    // ✅ Tránh xử lý trái đã bị xử lý rồi
    if (!fruit.active || fruit.getData("hit")) return;

    // ✅ Gắn cờ tránh double-hit
    fruit.setData("hit", true);

    const type = fruit.getData("type");

    if (type === "green") {
      this.score += 10;
    } else {
      this.score -= 5;
    }

    // ✅ Giới hạn điểm >= 0
    this.score = Math.max(0, Math.round(this.score));

    // ✅ Luôn cập nhật UI ngay sau khi tính điểm
    this.scoreText.setText(`Score: ${this.score}`);

    // ✅ Vô hiệu hóa vật thể trước khi xoá (an toàn hơn)
    fruit.disableBody(true, true);
  }

  update() {
    const { headX, headY } = getPosition();
    const screenWidth = this.game.config.width as number;
    const screenHeight = this.game.config.height as number;

    this.player.x = headX * screenWidth;
    this.player.y = headY * screenHeight;
  }

  endGame() {
    this.gameOver = true;

    // Xóa trái cây còn lại
    this.fruits.clear(true, true);

    // Ẩn player nếu muốn
    this.player.setVisible(false);

    // Hiện thông báo điểm cuối cùng
    this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        `Game Over\nScore: ${this.score}`,
        {
          fontSize: "32px",
          color: "#ffffff",
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setScale(-1, 1); // 👈 nếu bạn lật game
  }
}
