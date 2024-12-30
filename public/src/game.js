// game.js

class RamenRunner {
  constructor() {
    // ===== Canvas Setup =====
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    document.getElementById('phaser-game').appendChild(this.canvas);

    // Scale for different screen sizes
    this.scale = Math.min(this.canvas.width, this.canvas.height) / 800;

    // ===== Game Settings =====
    this.gameOver = false;
    this.score = 0;
    this.health = 3; // HP

    // Speeds
    this.baseSpeed = 3;
    this.obstacleSpeed = this.baseSpeed;
    this.bgOffset = 0;
    this.bgSpeed = this.obstacleSpeed * 0.5;

    // Invincibility
    this.isInvincible = false;

    // Spawn cooldown
    this.obstacleSpawnCooldown = 1000; 
    this.lastObstacleSpawnTime = 0;

    // Speed-ups
    this.speedUpInterval = 25000; 
    this.lastSpeedUpTime = Date.now();
    this.lastScoreCheckpoint = 0;

    // ===== Sizes =====
    this.GROUND_HEIGHT = 80 * this.scale;
    this.playerWidth = 100 * this.scale;
    this.playerHeight = 100 * this.scale;
    this.OBSTACLE_WIDTH = 50 * this.scale;
    this.MIN_OBSTACLE_HEIGHT = 60 * this.scale;
    this.MAX_OBSTACLE_HEIGHT = 100 * this.scale;
    this.POWERUP_SIZE = 50 * this.scale;

    // ===== Physics =====
    this.GRAVITY = 0.5 * this.scale;
    this.JUMP_FORCE = -15 * this.scale;

    // Player
    this.player = {
      x: this.canvas.width * 0.2,
      y: this.canvas.height - this.playerHeight - this.GROUND_HEIGHT,
      velocityY: 0,
      isJumping: false,
      canDoubleJump: false
    };

    this.obstacles = [];
    this.powerUps = [];

    // Audio + Mute
    this.isMusicMuted = false;
    this.bgMusicPlayedOnce = false;

    // For creating "Back to Home" button
    this.homeButton = null;

    // Compute max jump height
    const jumpForceAbs = Math.abs(this.JUMP_FORCE);
    this.maxJumpHeight = (jumpForceAbs * jumpForceAbs) / (2 * this.GRAVITY);

    // Load images/audio
    this.loadAssets();

    // Setup events + Mute button
    this.setupEventListeners();
    this.createMuteButton();

    // Track last timestamp
    this.lastTimestamp = 0;

    // Force a first obstacle spawn for debugging
    this.spawnObstacle();
    this.lastObstacleSpawnTime = Date.now();
    console.log('[RamenRunner] forced first obstacle spawn on constructor');

    // Start loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  loadAssets() {
    // Background
    this.backgroundImage = new Image();
    this.backgroundImage.src = '/sprites/background.png';

    // Character
    this.playerSprite = new Image();
    const selectedCharacter =
      localStorage.getItem('selectedCharacter') || 'runner.png';
    console.log('[loadAssets] selectedCharacter =', selectedCharacter);
    this.playerSprite.src = `/sprites/${selectedCharacter}`;

    // Obstacles
    this.obstacleSprites = ['obstacle1.png', 'obstacle2.png', 'obstacle3.png'].map(
      (src) => {
        const img = new Image();
        img.src = `/sprites/${src}`;
        return img;
      }
    );

    // Power-up
    this.powerUpSprite = new Image();
    this.powerUpSprite.src = '/sprites/powerup.png';

    // Heart icon
    this.heartSprite = new Image();
    this.heartSprite.src = '/sprites/heart.png';

    // Audio
    this.jumpSound = new Audio('/audio/jump.mp3');
    this.bgMusic = new Audio('/audio/music.mp3');
    this.bgMusic.loop = true;
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (this.gameOver) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        this.jump();
      }
    });

    this.canvas.addEventListener('touchstart', () => {
      if (!this.gameOver) {
        this.jump();
      }
    });

    this.canvas.addEventListener('click', () => {
      if (!this.bgMusicPlayedOnce && !this.isMusicMuted) {
        this.playBgMusic();
        this.bgMusicPlayedOnce = true;
      }

      if (this.gameOver) {
        this.restart();
      } else {
        this.jump();
      }
    });

    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.scale = Math.min(this.canvas.width, this.canvas.height) / 800;
      this.updateSizes();
    });
  }

  // Mute Button on top-right
  createMuteButton() {
    if (document.getElementById('mute-button')) return;

    const muteButton = document.createElement('button');
    muteButton.id = 'mute-button';
    muteButton.innerText = 'Mute';

    muteButton.style.position = 'absolute';
    muteButton.style.top = '10px';
    muteButton.style.right = '10px'; // top-right corner
    muteButton.style.zIndex = 9999;
    muteButton.style.background = '#222';
    muteButton.style.color = '#fff';
    muteButton.style.border = '2px solid #fff';
    muteButton.style.borderRadius = '4px';
    muteButton.style.padding = '8px 12px';
    muteButton.style.fontFamily = 'Arial, sans-serif';
    muteButton.style.fontSize = '14px';
    muteButton.style.cursor = 'pointer';
    muteButton.style.outline = 'none';

    muteButton.addEventListener('mouseenter', () => {
      muteButton.style.background = '#555';
    });
    muteButton.addEventListener('mouseleave', () => {
      muteButton.style.background = '#222';
    });

    muteButton.addEventListener('click', () => {
      this.toggleMusicMute();
      muteButton.innerText = this.isMusicMuted ? 'Unmute' : 'Mute';
    });

    document.body.appendChild(muteButton);
  }

  updateSizes() {
    this.GROUND_HEIGHT = 80 * this.scale;
    this.playerWidth = 100 * this.scale;
    this.playerHeight = 100 * this.scale;
    this.OBSTACLE_WIDTH = 50 * this.scale;
    this.MIN_OBSTACLE_HEIGHT = 60 * this.scale;
    this.MAX_OBSTACLE_HEIGHT = 100 * this.scale;
    this.POWERUP_SIZE = 50 * this.scale;

    this.GRAVITY = 0.5 * this.scale;
    this.JUMP_FORCE = -15 * this.scale;

    this.player.x = this.canvas.width * 0.2;
    this.player.y = this.canvas.height - this.playerHeight - this.GROUND_HEIGHT;

    const jumpForceAbs = Math.abs(this.JUMP_FORCE);
    this.maxJumpHeight = (jumpForceAbs * jumpForceAbs) / (2 * this.GRAVITY);
    console.log('[updateSizes] new scale=', this.scale, 'maxJumpHeight=', this.maxJumpHeight);
  }

  playBgMusic() {
    if (!this.bgMusic) return;
    if (!this.isMusicMuted) {
      this.bgMusic.currentTime = 0;
      this.bgMusic.play().catch((err) => {
        console.warn('Music playback failed:', err);
      });
    }
  }

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.bgMusic.pause();
    } else {
      this.playBgMusic();
    }
  }

  jump() {
    if (!this.player.isJumping) {
      this.player.velocityY = this.JUMP_FORCE;
      this.player.isJumping = true;
      this.player.canDoubleJump = true;
      if (this.jumpSound) {
        this.jumpSound.currentTime = 0;
        this.jumpSound.play().catch(() => {});
      }
    } else if (this.player.canDoubleJump) {
      // second jump ~80% of first
      this.player.velocityY = this.JUMP_FORCE * 0.8;
      this.player.canDoubleJump = false;
      if (this.jumpSound) {
        this.jumpSound.currentTime = 0;
        this.jumpSound.play().catch(() => {});
      }
    }
  }

  // short invincibility
  activateShortInvincibility(duration) {
    this.isInvincible = true;
    setTimeout(() => {
      this.isInvincible = false;
    }, duration);
  }

  // long invincibility
  activateInvincibility() {
    this.isInvincible = true;
    setTimeout(() => {
      this.isInvincible = false;
    }, 3000);
  }

  // vertical movement
  createVerticalObstacle(x, y, w, h) {
    return {
      x,
      y,
      width: w,
      height: h,
      spriteIndex: Math.floor(Math.random() * this.obstacleSprites.length),
      type: 'vertical',
      baseY: y,
      currentOffset: 0,
      verticalRange: 80 * this.scale, 
      verticalSpeed: 1.2 * this.scale,
      movingUp: true
    };
  }

  maybeMakeVerticalObstacle(obs, obstacleType = 'ground') {
    if (Math.random() < 0.3) {
      const vObs = this.createVerticalObstacle(obs.x, obs.y, obs.width, obs.height);
      console.log('[maybeMakeVerticalObstacle] converting to vertical =>', vObs);
      return vObs;
    }
    obs.spriteIndex = Math.floor(Math.random() * this.obstacleSprites.length);
    obs.type = obstacleType;
    return obs;
  }

  spawnObstaclePair() {
    // ground obstacle
    const groundHeight =
      Math.random() * (this.MAX_OBSTACLE_HEIGHT - this.MIN_OBSTACLE_HEIGHT) +
      this.MIN_OBSTACLE_HEIGHT;

    let groundObs = {
      x: this.canvas.width,
      y: this.canvas.height - this.GROUND_HEIGHT - groundHeight,
      width: this.OBSTACLE_WIDTH,
      height: groundHeight
    };

    groundObs = this.maybeMakeVerticalObstacle(groundObs, 'ground');
    this.obstacles.push(groundObs);

    // overhead with extra gap
    const requiredGap = this.maxJumpHeight * 1.2; 
    const topOfGround = groundObs.y;

    const overheadWidth = this.OBSTACLE_WIDTH * (0.5 + Math.random() * 0.4);
    const overheadHeight = overheadWidth;
    let overheadY = (topOfGround - requiredGap) - overheadHeight;
    overheadY = Math.max(overheadY, 10 * this.scale);

    let overheadObs = {
      x: this.canvas.width,
      y: overheadY,
      width: overheadWidth,
      height: overheadHeight
    };

    overheadObs = this.maybeMakeVerticalObstacle(overheadObs, 'overhead');
    this.obstacles.push(overheadObs);
  }

  spawnSingleObstacle() {
    const height =
      Math.random() * (this.MAX_OBSTACLE_HEIGHT - this.MIN_OBSTACLE_HEIGHT) +
      this.MIN_OBSTACLE_HEIGHT;

    let obstacle = {
      x: this.canvas.width,
      y: this.canvas.height - this.GROUND_HEIGHT - height,
      width: this.OBSTACLE_WIDTH,
      height
    };
    obstacle = this.maybeMakeVerticalObstacle(obstacle, 'ground');
    this.obstacles.push(obstacle);
  }

  spawnObstacle() {
    if (Math.random() < 0.1) {
      this.spawnObstaclePair();
    } else {
      this.spawnSingleObstacle();
    }
  }

  spawnPowerUp() {
    const minY = this.canvas.height * 0.3;
    const maxY = this.canvas.height * 0.7;
    const p = {
      x: this.canvas.width,
      y: Math.random() * (maxY - minY) + minY,
      width: this.POWERUP_SIZE,
      height: this.POWERUP_SIZE
    };
    this.powerUps.push(p);
  }

  checkCollision(player, obs) {
    const playerHitbox = {
      x: player.x + this.playerWidth * 0.3,
      y: player.y + this.playerHeight * 0.3,
      width: this.playerWidth * 0.4,
      height: this.playerHeight * 0.4
    };

    return !(
      playerHitbox.x + playerHitbox.width < obs.x ||
      playerHitbox.x > obs.x + obs.width ||
      playerHitbox.y + playerHitbox.height < obs.y ||
      playerHitbox.y > obs.y + obs.height
    );
  }

  update(deltaTime) {
    if (this.gameOver) return;

    const factor = deltaTime / 16.67;

    if (this.backgroundImage.width) {
      this.bgOffset = (this.bgOffset + this.bgSpeed * factor) % this.backgroundImage.width;
    }

    // Player physics
    this.player.velocityY += this.GRAVITY * factor;
    this.player.y += this.player.velocityY * factor;

    const groundLevel = this.canvas.height - this.playerHeight - this.GROUND_HEIGHT;
    if (this.player.y > groundLevel) {
      this.player.y = groundLevel;
      this.player.velocityY = 0;
      this.player.isJumping = false;
      this.player.canDoubleJump = false;
    }

    // spawn obstacle
    const now = Date.now();
    if (now - this.lastObstacleSpawnTime >= this.obstacleSpawnCooldown) {
      this.spawnObstacle();
      this.lastObstacleSpawnTime = now;
    }

    // chance for powerup
    if (Math.random() < 0.001) {
      this.spawnPowerUp();
    }

    // time-based speed up
    if (now - this.lastSpeedUpTime >= this.speedUpInterval) {
      this.obstacleSpeed += 0.5;
      this.lastSpeedUpTime = now;
      console.log('[update] time-based speed up -> obstacleSpeed=', this.obstacleSpeed);
    }

    // score-based speed up
    if (this.score >= this.lastScoreCheckpoint + 300) {
      this.obstacleSpeed *= 1.2;
      this.lastScoreCheckpoint += 300;
      console.log('[update] score-based speed up -> obstacleSpeed=', this.obstacleSpeed);
    }

    // Obstacles
    let collisionDetected = false;
    this.obstacles.forEach((obs) => {
      if (obs.type === 'vertical') {
        if (obs.movingUp) {
          obs.currentOffset -= obs.verticalSpeed * factor;
          if (obs.currentOffset <= -obs.verticalRange) {
            obs.movingUp = false;
          }
        } else {
          obs.currentOffset += obs.verticalSpeed * factor;
          if (obs.currentOffset >= obs.verticalRange) {
            obs.movingUp = true;
          }
        }
        obs.y = obs.baseY + obs.currentOffset;
      }

      obs.x -= this.obstacleSpeed * factor;

      if (!this.isInvincible && !collisionDetected) {
        if (this.checkCollision(this.player, obs)) {
          collisionDetected = true;
        }
      }
    });

    // remove off-screen
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > 0);

    // powerups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.x -= this.obstacleSpeed * factor;
      if (this.checkCollision(this.player, p)) {
        this.powerUps.splice(i, 1);
        this.activateInvincibility();
      }
      if (p.x + p.width < 0) {
        this.powerUps.splice(i, 1);
      }
    }

    if (collisionDetected) {
      this.health -= 1;
      if (this.health <= 0) {
        this.handleGameOver();
        return;
      } else {
        this.activateShortInvincibility(1000);
      }
    }

    // score
    this.score += 0.1 * factor;
    this.bgSpeed = this.obstacleSpeed * 0.5;
  }

  draw() {
    const bgHeight = this.canvas.height - this.GROUND_HEIGHT;
    const pattern = this.backgroundImage.width
      ? this.ctx.createPattern(this.backgroundImage, 'repeat-x')
      : null;

    if (pattern) {
      this.ctx.save();
      this.ctx.translate(-this.bgOffset, 0);
      this.ctx.fillStyle = pattern;
      this.ctx.fillRect(0, 0, this.canvas.width + this.backgroundImage.width, bgHeight);
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = '#87CEEB';
      this.ctx.fillRect(0, 0, this.canvas.width, bgHeight);
    }

    // Ground
    this.ctx.fillStyle = '#DB3828';
    this.ctx.fillRect(
      0,
      this.canvas.height - this.GROUND_HEIGHT,
      this.canvas.width,
      this.GROUND_HEIGHT
    );

    // Player
    this.ctx.globalAlpha = this.isInvincible ? 0.5 : 1;
    this.ctx.drawImage(
      this.playerSprite,
      this.player.x,
      this.player.y,
      this.playerWidth,
      this.playerHeight
    );
    this.ctx.globalAlpha = 1;

    // Obstacles
    this.obstacles.forEach((obs) => {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(obs.x - 2, obs.y - 2, obs.width + 4, obs.height + 4);

      this.ctx.drawImage(
        this.obstacleSprites[obs.spriteIndex],
        obs.x,
        obs.y,
        obs.width,
        obs.height
      );

      this.ctx.strokeStyle = '#FF0000';
      this.ctx.lineWidth = 4 * this.scale;
      this.ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Power-ups
    this.powerUps.forEach((p) => {
      this.ctx.drawImage(
        this.powerUpSprite,
        p.x,
        p.y,
        p.width,
        p.height
      );
    });

    // Score
    const scoreText = `Score: ${Math.floor(this.score)}`;
    this.ctx.font = `${24 * this.scale}px Arial`;
    this.ctx.lineWidth = 3 * this.scale;
    this.ctx.strokeStyle = '#000000';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeText(scoreText, 20, 40 * this.scale);
    this.ctx.fillText(scoreText, 20, 40 * this.scale);

    if (this.isInvincible) {
      const invText = 'INVINCIBLE!';
      this.ctx.strokeText(invText, 20, 70 * this.scale);
      this.ctx.fillText(invText, 20, 70 * this.scale);
    }

    // HP hearts
    for (let i = 0; i < this.health; i++) {
      const heartX = 20 + i * 36;
      const heartY = 90 * this.scale;
      if (this.heartSprite && this.heartSprite.width) {
        this.ctx.drawImage(this.heartSprite, heartX, heartY, 32, 32);
      } else {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(heartX, heartY, 32, 32);
      }
    }

    // Game Over
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.font = `${48 * this.scale}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.lineWidth = 4 * this.scale;
      this.ctx.strokeStyle = '#000000';
      this.ctx.fillStyle = '#FFFFFF';

      this.ctx.strokeText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);

      const finalScoreText = `Score: ${Math.floor(this.score)}`;
      this.ctx.strokeText(
        finalScoreText,
        this.canvas.width / 2,
        this.canvas.height / 2 + 60 * this.scale
      );
      this.ctx.fillText(
        finalScoreText,
        this.canvas.width / 2,
        this.canvas.height / 2 + 60 * this.scale
      );

      this.ctx.font = `${24 * this.scale}px Arial`;
      this.ctx.lineWidth = 2 * this.scale;
      this.ctx.strokeText(
        'Click to restart',
        this.canvas.width / 2,
        this.canvas.height / 2 + 120 * this.scale
      );
      this.ctx.fillText(
        'Click to restart',
        this.canvas.width / 2,
        this.canvas.height / 2 + 120 * this.scale
      );

      // If we haven't created a "Back to Home" button yet, do it now.
      if (!this.homeButton) {
        this.createHomeButton();
      }
    } else {
      // If the game is NOT over and the homeButton exists, remove it
      if (this.homeButton) {
        document.body.removeChild(this.homeButton);
        this.homeButton = null;
      }
    }
  }

  // REAL HTML "Back to Home" Button
  createHomeButton() {
    // If it already exists, do nothing
    if (this.homeButton) return;

    this.homeButton = document.createElement('button');
    this.homeButton.innerText = 'Back to Home';
    this.homeButton.style.position = 'absolute';
    this.homeButton.style.top = '60px';
    this.homeButton.style.right = '10px';
    this.homeButton.style.zIndex = 9999;
    this.homeButton.style.background = '#222';
    this.homeButton.style.color = '#fff';
    this.homeButton.style.border = '2px solid #fff';
    this.homeButton.style.borderRadius = '4px';
    this.homeButton.style.padding = '8px 12px';
    this.homeButton.style.fontFamily = 'Arial, sans-serif';
    this.homeButton.style.fontSize = '14px';
    this.homeButton.style.cursor = 'pointer';
    this.homeButton.style.outline = 'none';

    this.homeButton.addEventListener('mouseenter', () => {
      this.homeButton.style.background = '#555';
    });
    this.homeButton.addEventListener('mouseleave', () => {
      this.homeButton.style.background = '#222';
    });

    // If user clicks, go to index.html
    this.homeButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    document.body.appendChild(this.homeButton);
  }

  handleGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.obstacleSpeed = 0;
    this.player.velocityY = 0;

    let highScores;
    try {
      highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    } catch {
      highScores = [];
    }
    highScores.push(Math.floor(this.score));
    highScores.sort((a, b) => b - a);
    localStorage.setItem('highScores', JSON.stringify(highScores.slice(0, 5)));
    console.log('[handleGameOver] Game Over. Final Score=', Math.floor(this.score));
  }

  restart() {
    this.gameOver = false;
    this.score = 0;
    this.health = 3;
    this.obstacleSpeed = this.baseSpeed;
    this.bgSpeed = this.obstacleSpeed * 0.5;
    this.isInvincible = false;

    this.player.y = this.canvas.height - this.playerHeight - this.GROUND_HEIGHT;
    this.player.velocityY = 0;
    this.player.isJumping = false;
    this.player.canDoubleJump = false;

    this.obstacles = [];
    this.powerUps = [];
    this.bgOffset = 0;

    this.lastObstacleSpawnTime = Date.now();
    this.lastSpeedUpTime = Date.now();
    this.lastScoreCheckpoint = 0;

    // Force immediate obstacle again
    this.spawnObstacle();
    console.log('[restart] forced immediate obstacle spawn');

    if (!this.isMusicMuted && this.bgMusicPlayedOnce) {
      this.playBgMusic();
    }
  }

  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// Named export for your HTML import
export function startGame() {
  new RamenRunner();
}
