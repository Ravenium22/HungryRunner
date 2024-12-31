// game.js

class RamenRunner {
  constructor() {
    console.log('[RamenRunner] Initializing game...');

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
    this.health = 4; // Reduced HP for increased difficulty

    // ===== Physics =====
    this.GRAVITY = 0.6 * this.scale;
    this.JUMP_FORCE = -16 * this.scale;

    // ===== Hitbox Configuration =====
    this.hitboxConfig = {
      player: {
        x: 0.2,
        y: 0.2,
        width: 0.6,
        height: 0.6
      },
      obstacle: {
        ground: {
          x: 0.05,
          y: 0.05,
          width: 0.9,
          height: 0.9
        },
        overhead: {
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.8
        },
        plane: {
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.8
        }
      }
    };

    // ===== Define Ground Level =====
    this.groundOffset = 100 * this.scale;
    this.groundY = this.canvas.height - this.groundOffset;

    // ===== Player =====
    this.player = {
      x: this.canvas.width * 0.2,
      y: this.groundY - (100 * this.scale), // Adjusted player height
      velocityY: 0,
      isJumping: false,
      canDoubleJump: false,
      game: this // Reference to the game instance
    };

    // ===== Player Animation Properties =====
    this.isWalking = false;
    this.currentWalkFrame = 0;
    this.walkFrameRate = 150; // ms between frames
    this.lastWalkFrameChange = Date.now();

    this.currentJumpFrame = 0;
    this.jumpFrameRate = 100; // ms between frames
    this.lastJumpFrameChange = Date.now();

    // ===== Obstacles and Power-ups =====
    this.obstacles = []; // Single Obstacles
    this.pairedObstacles = []; // Paired Obstacles
    this.planeObstacles = [];
    this.powerUps = [];

    // ===== Spawners =====
    this.obstacleSpawner = new ObstacleSpawner(this);
    this.planeSpawner = new PlaneSpawner(this);
    this.powerUpSpawner = new PowerUpSpawner(this);

    // ===== Clouds =====
    this.cloudsArray = [];
    const cloudCount = 5;
    for (let i = 0; i < cloudCount; i++) {
      this.cloudsArray.push({
        img: null, // Will be set after loading
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height * 0.3),
        speed: 0.5 * this.scale + Math.random() * 0.5
      });
    }

    // ===== Debug Mode =====
    this.debugMode = false;

    // ===== Audio and Mute =====
    this.isMusicMuted = false;
    this.bgMusicPlayedOnce = false;

    // ===== Load Assets =====
    this.loadAssets();

    // ===== Setup Event Listeners =====
    this.setupEventListeners();
    this.createMuteButton();

    // ===== Start Game Loop =====
    this.lastTimestamp = 0;
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // Method to load all game assets
  loadAssets() {
    console.log('[RamenRunner] Loading assets...');

    // ===== Background =====
    this.backgroundImage = new Image();
    this.backgroundImage.src = '/assets/sprites/background.png';
    this.backgroundImage.onload = () => {
      console.log('[loadAssets] Background image loaded.');
    };
    this.backgroundImage.onerror = () => {
      console.error('[loadAssets] Failed to load background image.');
    };

    // ===== Player Animation Frames =====
    // Walk Frames (6 frames)
    this.walkFrames = [];
    const walkFrameCount = 6;
    for (let i = 1; i <= walkFrameCount; i++) {
      const frame = new Image();
      frame.src = `/assets/sprites/newCharacter/walk${i}.png`;
      frame.onload = () => {
        console.log(`[loadAssets] Walk frame walk${i}.png loaded.`);
      };
      frame.onerror = () => {
        console.error(`[loadAssets] Failed to load walk frame walk${i}.png.`);
      };
      this.walkFrames.push(frame);
    }

    // Jump Frames (8 frames)
    this.jumpFrames = [];
    const jumpFrameCount = 8;
    for (let i = 1; i <= jumpFrameCount; i++) {
      const frame = new Image();
      frame.src = `/assets/sprites/newCharacter/jump${i}.png`;
      frame.onload = () => {
        console.log(`[loadAssets] Jump frame jump${i}.png loaded.`);
      };
      frame.onerror = () => {
        console.error(`[loadAssets] Failed to load jump frame jump${i}.png.`);
      };
      this.jumpFrames.push(frame);
    }

    // ===== Static Player Sprite for Idle State =====
    this.playerSprite = new Image();
    this.playerSprite.src = '/assets/sprites/newCharacter/idle.png';
    this.playerSprite.onload = () => {
      console.log('[loadAssets] Player sprite loaded.');
    };
    this.playerSprite.onerror = () => {
      console.error('[loadAssets] Failed to load player sprite.');
    };

    // ===== Obstacle Sprites =====
    this.obstacleSprites = [];
    const obstacleSpriteCount = 3;
    for (let i = 1; i <= obstacleSpriteCount; i++) {
      const sprite = new Image();
      sprite.src = `/assets/sprites/obstacles/obstacle${i}.png`;
      sprite.onload = () => {
        console.log(`[loadAssets] Obstacle sprite obstacle${i}.png loaded.`);
      };
      sprite.onerror = () => {
        console.error(`[loadAssets] Failed to load obstacle sprite obstacle${i}.png.`);
      };
      this.obstacleSprites.push(sprite);
    }

    // ===== Plane Obstacle (GIF) =====
    this.planeSprite = new Image();
    this.planeSprite.src = '/assets/sprites/plane.gif';
    this.planeSprite.onload = () => {
      console.log('[loadAssets] Plane sprite loaded.');
    };
    this.planeSprite.onerror = () => {
      console.error('[loadAssets] Failed to load plane sprite.');
    };

    // ===== Power-up =====
    this.powerUpSprite = new Image();
    this.powerUpSprite.src = '/assets/sprites/powerup.png';
    this.powerUpSprite.onload = () => {
      console.log('[loadAssets] Power-up sprite loaded.');
    };
    this.powerUpSprite.onerror = () => {
      console.error('[loadAssets] Failed to load power-up sprite.');
    };

    // ===== Heart Icon =====
    this.heartSprite = new Image();
    this.heartSprite.src = '/assets/sprites/heart.png';
    this.heartSprite.onload = () => {
      console.log('[loadAssets] Heart sprite loaded.');
    };
    this.heartSprite.onerror = () => {
      console.error('[loadAssets] Failed to load heart sprite.');
    };

    // ===== Environment Assets (Clouds, Ground, Rocks) =====
    this.clouds = [
      new Image(),
      new Image(),
      new Image()
    ];
    this.clouds[0].src = '/assets/sprites/environment/cloud1.png';
    this.clouds[1].src = '/assets/sprites/environment/cloud2.png';
    this.clouds[2].src = '/assets/sprites/environment/cloud3.png';
    this.clouds.forEach((cloud, index) => {
      cloud.onload = () => {
        console.log(`[loadAssets] Cloud${index + 1}.png loaded.`);
      };
      cloud.onerror = () => {
        console.error(`[loadAssets] Failed to load cloud${index + 1}.png.`);
      };
    });

    // ===== Ground and Rocks =====
    this.groundSprite = new Image();
    this.groundSprite.src = '/assets/sprites/environment/ground.png';
    this.groundSprite.onload = () => {
      console.log('[loadAssets] Ground sprite loaded.');
    };
    this.groundSprite.onerror = () => {
      console.error('[loadAssets] Failed to load ground sprite.');
    };

    this.rocksSprite = new Image();
    this.rocksSprite.src = '/assets/sprites/environment/rocks.png';
    this.rocksSprite.onload = () => {
      console.log('[loadAssets] Rocks sprite loaded.');
    };
    this.rocksSprite.onerror = () => {
      console.error('[loadAssets] Failed to load rocks sprite.');
    };

    // ===== Audio =====
    this.jumpSound = new Audio('/assets/audio/jump.mp3');
    this.jumpSound.onerror = () => {
      console.error('[loadAssets] Failed to load jump sound.');
    };

    this.bgMusic = new Audio('/assets/audio/music.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.onerror = () => {
      console.error('[loadAssets] Failed to load background music.');
    };

    // ===== Additional Audio =====
    this.collisionSound = new Audio('/assets/audio/collision.mp3');
    this.collisionSound.onerror = () => {
      console.error('[loadAssets] Failed to load collision sound.');
    };

    this.powerUpSound = new Audio('/assets/audio/powerup.mp3');
    this.powerUpSound.onerror = () => {
      console.error('[loadAssets] Failed to load power-up sound.');
    };

    // ===== Initialize Cloud Images =====
    this.cloudsArray.forEach((cloud, index) => {
      cloud.img = this.clouds[index % this.clouds.length];
    });
  }

  // Method to setup event listeners
  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (this.gameOver) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        this.jump();
      }

      // Toggle debug mode with 'D' key
      if (e.code === 'KeyD') {
        this.debugMode = !this.debugMode;
        console.log(`[RamenRunner] Debug Mode: ${this.debugMode ? 'ON' : 'OFF'}`);
      }

      // Toggle pause with 'P' key
      if (e.code === 'KeyP') {
        this.togglePause();
      }
    });

    this.canvas.addEventListener('touchstart', () => {
      if (!this.gameOver && !this.isPaused) {
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

  // Method to update sizes based on scale
  updateSizes() {
    // Update groundY based on new canvas size
    this.groundOffset = 100 * this.scale;
    this.groundY = this.canvas.height - this.groundOffset;

    // Update player position
    this.player.x = this.canvas.width * 0.2;
    this.player.y = this.groundY - (100 * this.scale);

    // Update cloud positions if necessary
    this.cloudsArray.forEach((cloud) => {
      if (cloud.x > this.canvas.width) {
        cloud.x = this.canvas.width - Math.random() * 100;
      }
    });

    // Update obstacles and planes positions if necessary
    this.obstacles.forEach((obs) => {
      // Adjust y positions if needed
      // For simplicity, assuming obstacles are ground-based or overhead
    });

    this.planeObstacles.forEach((plane) => {
      // Adjust y positions if needed
      // Planes have their own y positions
    });
  }

  // Method to handle player jumping
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
      // Second jump ~80% of first
      this.player.velocityY = this.JUMP_FORCE * 0.8;
      this.player.canDoubleJump = false;
      if (this.jumpSound) {
        this.jumpSound.currentTime = 0;
        this.jumpSound.play().catch(() => {});
      }
    }
  }

  // Method to activate invincibility
  activateInvincibility(duration) {
    this.isInvincible = true;
    setTimeout(() => {
      this.isInvincible = false;
    }, duration);
  }

  // Method to handle collision
  handleCollision() {
    if (this.isInvincible) return;
    this.health -= 1;
    console.log(`[RamenRunner] Collision detected. Health: ${this.health}`);
    if (this.health <= 0) {
      this.handleGameOver();
    } else {
      this.activateInvincibility(1000); // Short invincibility after hit
    }
  }

  // Method to handle game over
  handleGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.obstacleSpawner.stop();
    this.planeSpawner.stop();
    this.powerUpSpawner.stop();
    this.bgMusic.pause();

    // Save high score
    let highScores = [];
    try {
      highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    } catch (e) {
      console.error('Failed to access localStorage:', e);
    }
    highScores.push(Math.floor(this.score));
    highScores.sort((a, b) => b - a);
    try {
      localStorage.setItem('highScores', JSON.stringify(highScores.slice(0, 5)));
    } catch (e) {
      console.error('Failed to save high scores:', e);
    }

    console.log(`[RamenRunner] Game Over. Final Score: ${Math.floor(this.score)}`);
  }

  // Method to restart the game
  restart() {
    this.gameOver = false;
    this.score = 0;
    this.health = 2;
    this.isInvincible = false;

    this.player.y = this.groundY - (100 * this.scale);
    this.player.velocityY = 0;
    this.player.isJumping = false;
    this.player.canDoubleJump = false;

    this.isWalking = false;
    this.currentWalkFrame = 0;
    this.lastWalkFrameChange = Date.now();

    this.currentJumpFrame = 0;
    this.lastJumpFrameChange = Date.now();

    this.obstacles = [];
    this.pairedObstacles = [];
    this.planeObstacles = [];
    this.powerUps = [];

    // Reset cloud positions
    this.cloudsArray.forEach((cloud) => {
      cloud.x = Math.random() * this.canvas.width;
      cloud.y = Math.random() * (this.canvas.height * 0.3);
      cloud.speed = 0.5 * this.scale + Math.random() * 0.5;
    });

    // Restart spawners
    this.obstacleSpawner.start();
    this.planeSpawner.start();
    this.powerUpSpawner.start();

    // Restart background music if not muted
    if (!this.isMusicMuted && this.bgMusicPlayedOnce) {
      this.playBgMusic();
    }

    // Remove "Back to Home" button if exists
    if (this.homeButton) {
      document.body.removeChild(this.homeButton);
      this.homeButton = null;
    }

    console.log('[RamenRunner] Game restarted.');
  }

  // Method to toggle pause
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.bgMusic.pause();
      console.log('[RamenRunner] Game Paused.');
    } else {
      if (!this.isMusicMuted && this.bgMusicPlayedOnce) {
        this.playBgMusic();
      }
      console.log('[RamenRunner] Game Resumed.');
    }
  }

  // Method to play background music
  playBgMusic() {
    if (!this.bgMusic) return;
    if (!this.isMusicMuted) {
      this.bgMusic.currentTime = 0;
      this.bgMusic.play().catch((err) => {
        console.warn('Music playback failed:', err);
      });
    }
  }

  // Method to create mute button
  createMuteButton() {
    if (document.getElementById('mute-button')) return;

    const muteButton = document.createElement('button');
    muteButton.id = 'mute-button';
    muteButton.innerText = 'Mute';

    muteButton.style.position = 'absolute';
    muteButton.style.top = '10px';
    muteButton.style.right = '10px';
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

  // Method to toggle music mute
  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.bgMusic.pause();
    } else {
      this.playBgMusic();
    }
    console.log(`[RamenRunner] Music ${this.isMusicMuted ? 'Muted' : 'Unmuted'}.`);
  }

  // Method to handle the game loop
  gameLoop(timestamp) {
    if (this.isPaused) {
      this.draw(); // Still draw the current state
      requestAnimationFrame(this.gameLoop.bind(this));
      return;
    }

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // Method to update game state
  update(deltaTime) {
    if (this.gameOver) return;

    const factor = deltaTime / 16.67; // Normalize to 60fps

    // ===== Update Clouds =====
    this.cloudsArray.forEach((cloud) => {
      cloud.x -= cloud.speed * factor;
      if (cloud.x + (cloud.img ? cloud.img.width * this.scale : 80 * this.scale) < 0) {
        // Re-spawn cloud on the right
        cloud.x = this.canvas.width + Math.random() * 100;
        cloud.y = Math.random() * (this.canvas.height * 0.3);
        cloud.speed = 0.5 * this.scale + Math.random() * 0.5;
        console.log('[update] Cloud repositioned to x:', cloud.x, 'y:', cloud.y);
      }
    });

    // ===== Update Player =====
    this.player.velocityY += this.GRAVITY * factor;
    this.player.y += this.player.velocityY * factor;

    // Ensure player doesn't fall below the ground
    if (this.player.y > this.groundY - (100 * this.scale)) {
      this.player.y = this.groundY - (100 * this.scale);
      this.player.velocityY = 0;
      this.player.isJumping = false;
      this.player.canDoubleJump = false;
      this.isWalking = true;
    } else {
      this.isWalking = false;
      this.player.isJumping = true;
    }

    // ===== Handle Player Animation =====
    if (this.isWalking) {
      const walkNow = Date.now();
      if (walkNow - this.lastWalkFrameChange >= this.walkFrameRate) {
        this.currentWalkFrame = (this.currentWalkFrame + 1) % this.walkFrames.length;
        this.lastWalkFrameChange = walkNow;
      }
    }

    if (this.player.isJumping) {
      const jumpNow = Date.now();
      if (jumpNow - this.lastJumpFrameChange >= this.jumpFrameRate) {
        this.currentJumpFrame = (this.currentJumpFrame + 1) % this.jumpFrames.length;
        this.lastJumpFrameChange = jumpNow;
      }
    }

    // ===== Spawn Obstacles =====
    this.obstacleSpawner.update(deltaTime);
    this.planeSpawner.update(deltaTime);
    this.powerUpSpawner.update(deltaTime);

    // ===== Update Obstacles =====
    this.obstacles.forEach((obs, index) => {
      obs.update(deltaTime);
      // Check collision with player
      if (!this.isInvincible && obs.checkCollision(this.player)) {
        this.handleCollision();
      }
    });
    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obs => !obs.offScreen());

    // ===== Update Paired Obstacles =====
    this.pairedObstacles.forEach((pair, index) => {
      pair.update(deltaTime);
      // Check collision with player
      if (!this.isInvincible && pair.checkCollision(this.player)) {
        this.handleCollision();
      }
    });
    // Remove off-screen paired obstacles
    this.pairedObstacles = this.pairedObstacles.filter(pair => !pair.offScreen());

    // ===== Update Plane Obstacles =====
    this.planeObstacles.forEach((plane, index) => {
      plane.update(deltaTime);
      // Check collision with player
      if (!this.isInvincible && plane.checkCollision(this.player)) {
        this.handleCollision();
      }
    });
    // Remove off-screen planes
    this.planeObstacles = this.planeObstacles.filter(plane => !plane.offScreen());

    // ===== Update Power-ups =====
    this.powerUps.forEach((p, index) => {
      p.update(deltaTime);
      // Check collision with player
      if (p.checkCollision(this.player)) {
        this.collectPowerUp(index);
      }
    });
    // Remove collected or off-screen power-ups
    this.powerUps = this.powerUps.filter(p => !p.collected && !p.offScreen());

    // ===== Update Score =====
    this.score += 0.3 * factor; // Adjust score increment as needed
  }

  // Method to collect a power-up
  collectPowerUp(index) {
    if (this.powerUpSound) {
      this.powerUpSound.currentTime = 0;
      this.powerUpSound.play().catch(() => {});
    }
    this.activateInvincibility(3000); // 3 seconds of invincibility
    this.powerUps[index].collected = true;
    console.log('[RamenRunner] Power-up collected. Invincibility activated.');
  }

  // Draw all game elements
  draw() {
    // ===== Clear Canvas =====
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ===== Draw Background =====
    if (this.backgroundImage && this.backgroundImage.complete && this.backgroundImage.naturalWidth !== 0) {
      const bgWidth = this.backgroundImage.width * this.scale;
      const bgHeight = this.backgroundImage.height * this.scale;
      this.ctx.drawImage(this.backgroundImage, 0, 0, bgWidth, bgHeight);

      // Repeat background to create a scrolling effect if needed
      // For simplicity, not implementing scrolling in this example
    } else {
      // Fallback: Draw a sky-blue background
      this.ctx.fillStyle = '#87CEEB';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      console.warn('[draw] Background image not loaded. Using fallback color.');
    }

    // ===== Draw Clouds =====
    this.cloudsArray.forEach((cloud) => {
      if (cloud.img && cloud.img.complete && cloud.img.naturalWidth !== 0) {
        const cloudWidth = cloud.img.width * this.scale;
        const cloudHeight = cloud.img.height * this.scale;
        this.ctx.drawImage(cloud.img, cloud.x, cloud.y, cloudWidth, cloudHeight);
      } else {
        // Fallback: Draw a simple gray cloud
        this.ctx.fillStyle = 'gray';
        this.ctx.beginPath();
        this.ctx.arc(cloud.x, cloud.y, 30 * this.scale, Math.PI * 0.5, Math.PI * 1.5);
        this.ctx.arc(cloud.x + 40 * this.scale, cloud.y - 30 * this.scale, 30 * this.scale, Math.PI * 1, Math.PI * 1.85);
        this.ctx.arc(cloud.x + 80 * this.scale, cloud.y - 20 * this.scale, 25 * this.scale, Math.PI * 1.37, Math.PI * 1.91);
        this.ctx.arc(cloud.x + 100 * this.scale, cloud.y, 30 * this.scale, Math.PI * 1.5, Math.PI * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        console.warn('[draw] Cloud image not loaded. Using fallback shape.');
      }
    });

    // ===== Draw Ground =====
    if (this.groundSprite && this.groundSprite.complete && this.groundSprite.naturalWidth !== 0) {
      this.ctx.drawImage(
        this.groundSprite,
        0,
        this.groundY,
        this.canvas.width,
        this.groundOffset
      );
    } else {
      // Fallback: Draw a green ground
      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(0, this.groundY, this.canvas.width, this.groundOffset);
      console.warn('[draw] Ground image not loaded. Using fallback shape.');
    }

    // ===== Draw Rocks =====
    if (this.rocksSprite && this.rocksSprite.complete && this.rocksSprite.naturalWidth !== 0) {
      const rockWidth = this.rocksSprite.width * this.scale;
      const rockHeight = this.rocksSprite.height * this.scale;
      const rockSpacing = this.canvas.width / 4;
      for (let i = 1; i <= 3; i++) {
        this.ctx.drawImage(
          this.rocksSprite,
          rockSpacing * i - rockWidth / 2,
          this.groundY - rockHeight,
          rockWidth,
          rockHeight
        );
      }
    } else {
      // Fallback: Draw simple gray rocks
      this.ctx.fillStyle = 'darkgray';
      const rockWidth = 50 * this.scale;
      const rockHeight = 30 * this.scale;
      const rockSpacing = this.canvas.width / 4;
      for (let i = 1; i <= 3; i++) {
        this.ctx.fillRect(
          rockSpacing * i - rockWidth / 2,
          this.groundY - rockHeight,
          rockWidth,
          rockHeight
        );
      }
      console.warn('[draw] Rocks image not loaded. Using fallback shapes.');
    }

    // ===== Draw Obstacles =====
    this.obstacles.forEach((obs) => {
      obs.draw(this.ctx, this.scale);
    });

    // ===== Draw Paired Obstacles =====
    this.pairedObstacles.forEach((pair) => {
      pair.draw(this.ctx, this.scale);
    });

    // ===== Draw Plane Obstacles =====
    this.planeObstacles.forEach((plane) => {
      plane.draw(this.ctx, this.scale);
    });

    // ===== Draw Power-ups =====
    this.powerUps.forEach((p) => {
      p.draw(this.ctx, this.scale);
    });

    // ===== Draw Player =====
    this.ctx.globalAlpha = this.isInvincible ? 0.5 : 1;

    if (this.isWalking) {
      // Draw walk animation frame
      if (this.walkFrames[this.currentWalkFrame] && this.walkFrames[this.currentWalkFrame].complete && this.walkFrames[this.currentWalkFrame].naturalWidth !== 0) {
        this.ctx.drawImage(
          this.walkFrames[this.currentWalkFrame],
          this.player.x,
          this.player.y,
          100 * this.scale,
          100 * this.scale
        );
      } else {
        // Fallback to idle sprite
        if (this.playerSprite && this.playerSprite.complete && this.playerSprite.naturalWidth !== 0) {
          this.ctx.drawImage(
            this.playerSprite,
            this.player.x,
            this.player.y,
            100 * this.scale,
            100 * this.scale
          );
        } else {
          // Fallback: Draw a blue rectangle
          this.ctx.fillStyle = 'blue';
          this.ctx.fillRect(this.player.x, this.player.y, 100 * this.scale, 100 * this.scale);
          console.warn('[draw] Player image not loaded. Using fallback shape.');
        }
      }
    } else if (this.player.isJumping) {
      // Draw jump animation frame
      if (this.jumpFrames[this.currentJumpFrame] && this.jumpFrames[this.currentJumpFrame].complete && this.jumpFrames[this.currentJumpFrame].naturalWidth !== 0) {
        this.ctx.drawImage(
          this.jumpFrames[this.currentJumpFrame],
          this.player.x,
          this.player.y,
          100 * this.scale,
          100 * this.scale
        );
      } else {
        // Fallback to idle sprite
        if (this.playerSprite && this.playerSprite.complete && this.playerSprite.naturalWidth !== 0) {
          this.ctx.drawImage(
            this.playerSprite,
            this.player.x,
            this.player.y,
            100 * this.scale,
            100 * this.scale
          );
        } else {
          // Fallback: Draw a green rectangle
          this.ctx.fillStyle = 'green';
          this.ctx.fillRect(this.player.x, this.player.y, 100 * this.scale, 100 * this.scale);
          console.warn('[draw] Player image not loaded. Using fallback shape.');
        }
      }
    } else {
      // Idle state
      if (this.playerSprite && this.playerSprite.complete && this.playerSprite.naturalWidth !== 0) {
        this.ctx.drawImage(
          this.playerSprite,
          this.player.x,
          this.player.y,
          100 * this.scale,
          100 * this.scale
        );
      } else {
        // Fallback: Draw a red rectangle
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.player.x, this.player.y, 100 * this.scale, 100 * this.scale);
        console.warn('[draw] Player image not loaded. Using fallback shape.');
      }
    }

    this.ctx.globalAlpha = 1;

    // ===== Debug Mode: Draw Hitboxes =====
    if (this.debugMode) {
      // Draw Player Hitbox
      const playerHitbox = {
        x: this.player.x + this.hitboxConfig.player.x * 100 * this.scale,
        y: this.player.y + this.hitboxConfig.player.y * 100 * this.scale,
        width: 100 * this.scale * this.hitboxConfig.player.width,
        height: 100 * this.scale * this.hitboxConfig.player.height
      };
      this.ctx.strokeStyle = 'cyan';
      this.ctx.lineWidth = 4 * this.scale;
      this.ctx.strokeRect(playerHitbox.x, playerHitbox.y, playerHitbox.width, playerHitbox.height);

      // Draw Obstacles Hitboxes
      this.obstacles.forEach((obs) => {
        const obstacleHitbox = obs.getHitbox();
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 4 * this.scale;
        this.ctx.strokeRect(obstacleHitbox.x, obstacleHitbox.y, obstacleHitbox.width, obstacleHitbox.height);
      });

      // Draw Paired Obstacles Hitboxes
      this.pairedObstacles.forEach((pair) => {
        pair.obstacles.forEach((obs) => {
          const obstacleHitbox = obs.getHitbox();
          this.ctx.strokeStyle = 'magenta';
          this.ctx.lineWidth = 4 * this.scale;
          this.ctx.strokeRect(obstacleHitbox.x, obstacleHitbox.y, obstacleHitbox.width, obstacleHitbox.height);
        });
      });

      // Draw Plane Obstacles Hitboxes
      this.planeObstacles.forEach((plane) => {
        const planeHitbox = plane.getHitbox();
        this.ctx.strokeStyle = 'orange';
        this.ctx.lineWidth = 4 * this.scale;
        this.ctx.strokeRect(planeHitbox.x, planeHitbox.y, planeHitbox.width, planeHitbox.height);
      });

      // Draw Power-ups Hitboxes
      this.powerUps.forEach((p) => {
        const powerUpHitbox = p.getHitbox();
        this.ctx.strokeStyle = 'green';
        this.ctx.lineWidth = 4 * this.scale;
        this.ctx.strokeRect(powerUpHitbox.x, powerUpHitbox.y, powerUpHitbox.width, powerUpHitbox.height);
      });
    }

    // ===== Draw Score =====
    const scoreText = `Score: ${Math.floor(this.score)}`;
    this.ctx.font = `${24 * this.scale}px Arial`;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3 * this.scale;
    this.ctx.strokeText(scoreText, 20, 40 * this.scale);
    this.ctx.fillText(scoreText, 20, 40 * this.scale);

    // ===== Draw Health (Hearts) =====
    for (let i = 0; i < this.health; i++) {
      const heartX = 20 + i * 36;
      const heartY = 60 * this.scale;
      if (this.heartSprite && this.heartSprite.complete && this.heartSprite.naturalWidth !== 0) {
        this.ctx.drawImage(this.heartSprite, heartX, heartY, 32 * this.scale, 32 * this.scale);
      } else {
        // Fallback: Draw a simple red heart
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.moveTo(heartX + 16 * this.scale, heartY + 10 * this.scale);
        this.ctx.bezierCurveTo(heartX + 16 * this.scale, heartY + 10 * this.scale, heartX + 0 * this.scale, heartY + 0 * this.scale, heartX + 0 * this.scale, heartY + 16 * this.scale);
        this.ctx.bezierCurveTo(heartX + 0 * this.scale, heartY + 26 * this.scale, heartX + 16 * this.scale, heartY + 40 * this.scale, heartX + 16 * this.scale, heartY + 40 * this.scale);
        this.ctx.bezierCurveTo(heartX + 16 * this.scale, heartY + 40 * this.scale, heartX + 32 * this.scale, heartY + 26 * this.scale, heartX + 32 * this.scale, heartY + 16 * this.scale);
        this.ctx.bezierCurveTo(heartX + 32 * this.scale, heartY + 0 * this.scale, heartX + 16 * this.scale, heartY + 10 * this.scale, heartX + 16 * this.scale, heartY + 10 * this.scale);
        this.ctx.fill();
      }
    }

    // ===== Game Over Screen =====
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.font = `${48 * this.scale}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 4 * this.scale;

      this.ctx.strokeText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30 * this.scale);
      this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30 * this.scale);

      const finalScoreText = `Score: ${Math.floor(this.score)}`;
      this.ctx.strokeText(finalScoreText, this.canvas.width / 2, this.canvas.height / 2 + 30 * this.scale);
      this.ctx.fillText(finalScoreText, this.canvas.width / 2, this.canvas.height / 2 + 30 * this.scale);

      const restartText = 'Click to Restart';
      this.ctx.strokeText(restartText, this.canvas.width / 2, this.canvas.height / 2 + 90 * this.scale);
      this.ctx.fillText(restartText, this.canvas.width / 2, this.canvas.height / 2 + 90 * this.scale);

      // Create "Back to Home" button if not exists
      if (!this.homeButton) {
        this.createHomeButton();
      }
    } else {
      // Remove "Back to Home" button if game is not over
      if (this.homeButton) {
        document.body.removeChild(this.homeButton);
        this.homeButton = null;
      }
    }
  }

  // Method to create "Back to Home" button
  createHomeButton() {
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

    this.homeButton.addEventListener('click', () => {
      console.log('[Back to Home] Button clicked.');
      window.location.href = 'index.html'; // Adjust path if necessary
    });

    document.body.appendChild(this.homeButton);
  }

  // Method to toggle music mute
  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.bgMusic.pause();
    } else {
      this.playBgMusic();
    }
    console.log(`[RamenRunner] Music ${this.isMusicMuted ? 'Muted' : 'Unmuted'}.`);
  }

  // Method to handle the game loop
  gameLoop(timestamp) {
    if (this.isPaused) {
      this.draw(); // Still draw the current state
      requestAnimationFrame(this.gameLoop.bind(this));
      return;
    }

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // Method to update game state
  update(deltaTime) {
    if (this.gameOver) return;

    const factor = deltaTime / 16.67; // Normalize to 60fps

    // ===== Update Clouds =====
    this.cloudsArray.forEach((cloud) => {
      cloud.x -= cloud.speed * factor;
      if (cloud.x + (cloud.img ? cloud.img.width * this.scale : 80 * this.scale) < 0) {
        // Re-spawn cloud on the right
        cloud.x = this.canvas.width + Math.random() * 100;
        cloud.y = Math.random() * (this.canvas.height * 0.3);
        cloud.speed = 0.5 * this.scale + Math.random() * 0.5;
        console.log('[update] Cloud repositioned to x:', cloud.x, 'y:', cloud.y);
      }
    });

    // ===== Update Player =====
    this.player.velocityY += this.GRAVITY * factor;
    this.player.y += this.player.velocityY * factor;

    // Ensure player doesn't fall below the ground
    if (this.player.y > this.groundY - (100 * this.scale)) {
      this.player.y = this.groundY - (100 * this.scale);
      this.player.velocityY = 0;
      this.player.isJumping = false;
      this.player.canDoubleJump = false;
      this.isWalking = true;
    } else {
      this.isWalking = false;
      this.player.isJumping = true;
    }

    // ===== Handle Player Animation =====
    if (this.isWalking) {
      const walkNow = Date.now();
      if (walkNow - this.lastWalkFrameChange >= this.walkFrameRate) {
        this.currentWalkFrame = (this.currentWalkFrame + 1) % this.walkFrames.length;
        this.lastWalkFrameChange = walkNow;
      }
    }

    if (this.player.isJumping) {
      const jumpNow = Date.now();
      if (jumpNow - this.lastJumpFrameChange >= this.jumpFrameRate) {
        this.currentJumpFrame = (this.currentJumpFrame + 1) % this.jumpFrames.length;
        this.lastJumpFrameChange = jumpNow;
      }
    }

    // ===== Spawn Obstacles =====
    this.obstacleSpawner.update(deltaTime);
    this.planeSpawner.update(deltaTime);
    this.powerUpSpawner.update(deltaTime);

    // ===== Update Obstacles =====
    this.obstacles.forEach((obs, index) => {
      obs.update(deltaTime);
      // Check collision with player
      if (!this.isInvincible && obs.checkCollision(this.player)) {
        this.handleCollision();
      }
    });
    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obs => !obs.offScreen());

    // ===== Update Paired Obstacles =====
    this.pairedObstacles.forEach((pair, index) => {
      pair.update(deltaTime);
      // Check collision with player
      if (!this.isInvincible && pair.checkCollision(this.player)) {
        this.handleCollision();
      }
    });
    // Remove off-screen paired obstacles
    this.pairedObstacles = this.pairedObstacles.filter(pair => !pair.offScreen());

    // ===== Update Plane Obstacles =====
    this.planeObstacles.forEach((plane, index) => {
      plane.update(deltaTime);
      // Check collision with player
      if (!this.isInvincible && plane.checkCollision(this.player)) {
        this.handleCollision();
      }
    });
    // Remove off-screen planes
    this.planeObstacles = this.planeObstacles.filter(plane => !plane.offScreen());

    // ===== Update Power-ups =====
    this.powerUps.forEach((p, index) => {
      p.update(deltaTime);
      // Check collision with player
      if (p.checkCollision(this.player)) {
        this.collectPowerUp(index);
      }
    });
    // Remove collected or off-screen power-ups
    this.powerUps = this.powerUps.filter(p => !p.collected && !p.offScreen());

    // ===== Update Score =====
    this.score += 0.3 * factor; // Adjust score increment as needed
  }

  // Method to collect a power-up
  collectPowerUp(index) {
    if (this.powerUpSound) {
      this.powerUpSound.currentTime = 0;
      this.powerUpSound.play().catch(() => {});
    }
    this.activateInvincibility(3000); // 3 seconds of invincibility
    this.powerUps[index].collected = true;
    console.log('[RamenRunner] Power-up collected. Invincibility activated.');
  }

  // Draw all game elements
  draw() {
    // ===== Clear Canvas =====
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ===== Draw Background =====
    if (this.backgroundImage && this.backgroundImage.complete && this.backgroundImage.naturalWidth !== 0) {
      const bgWidth = this.backgroundImage.width * this.scale;
      const bgHeight = this.backgroundImage.height * this.scale;
      this.ctx.drawImage(this.backgroundImage, 0, 0, bgWidth, bgHeight);

      // Repeat background to create a scrolling effect if needed
      // For simplicity, not implementing scrolling in this example
    } else {
      // Fallback: Draw a sky-blue background
      this.ctx.fillStyle = '#87CEEB';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      console.warn('[draw] Background image not loaded. Using fallback color.');
    }

    // ===== Draw Clouds =====
    this.cloudsArray.forEach((cloud) => {
      if (cloud.img && cloud.img.complete && cloud.img.naturalWidth !== 0) {
        const cloudWidth = cloud.img.width * this.scale;
        const cloudHeight = cloud.img.height * this.scale;
        this.ctx.drawImage(cloud.img, cloud.x, cloud.y, cloudWidth, cloudHeight);
      } else {
        // Fallback: Draw a simple gray cloud
        this.ctx.fillStyle = 'gray';
        this.ctx.beginPath();
        this.ctx.arc(cloud.x, cloud.y, 30 * this.scale, Math.PI * 0.5, Math.PI * 1.5);
        this.ctx.arc(cloud.x + 40 * this.scale, cloud.y - 30 * this.scale, 30 * this.scale, Math.PI * 1, Math.PI * 1.85);
        this.ctx.arc(cloud.x + 80 * this.scale, cloud.y - 20 * this.scale, 25 * this.scale, Math.PI * 1.37, Math.PI * 1.91);
        this.ctx.arc(cloud.x + 100 * this.scale, cloud.y, 30 * this.scale, Math.PI * 1.5, Math.PI * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        console.warn('[draw] Cloud image not loaded. Using fallback shape.');
      }
    });

    // ===== Draw Ground =====
    if (this.groundSprite && this.groundSprite.complete && this.groundSprite.naturalWidth !== 0) {
      this.ctx.drawImage(
        this.groundSprite,
        0,
        this.groundY,
        this.canvas.width,
        this.groundOffset
      );
    } else {
      // Fallback: Draw a green ground
      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(0, this.groundY, this.canvas.width, this.groundOffset);
      console.warn('[draw] Ground image not loaded. Using fallback shape.');
    }

    // ===== Draw Rocks =====
    if (this.rocksSprite && this.rocksSprite.complete && this.rocksSprite.naturalWidth !== 0) {
      const rockWidth = this.rocksSprite.width * this.scale;
      const rockHeight = this.rocksSprite.height * this.scale;
      const rockSpacing = this.canvas.width / 4;
      for (let i = 1; i <= 3; i++) {
        this.ctx.drawImage(
          this.rocksSprite,
          rockSpacing * i - rockWidth / 2,
          this.groundY - rockHeight,
          rockWidth,
          rockHeight
        );
      }
    } else {
      // Fallback: Draw simple gray rocks
      this.ctx.fillStyle = 'darkgray';
      const rockWidth = 50 * this.scale;
      const rockHeight = 30 * this.scale;
      const rockSpacing = this.canvas.width / 4;
      for (let i = 1; i <= 3; i++) {
        this.ctx.fillRect(
          rockSpacing * i - rockWidth / 2,
          this.groundY - rockHeight,
          rockWidth,
          rockHeight
        );
      }
      console.warn('[draw] Rocks image not loaded. Using fallback shapes.');
    }

    // ===== Draw Obstacles =====
    this.obstacles.forEach((obs) => {
      obs.draw(this.ctx, this.scale);
    });

    // ===== Draw Paired Obstacles =====
    this.pairedObstacles.forEach((pair) => {
      pair.draw(this.ctx, this.scale);
    });

    // ===== Draw Plane Obstacles =====
    this.planeObstacles.forEach((plane) => {
      plane.draw(this.ctx, this.scale);
    });

    // ===== Draw Power-ups =====
    this.powerUps.forEach((p) => {
      p.draw(this.ctx, this.scale);
    });

    // ===== Draw Player =====
    this.ctx.globalAlpha = this.isInvincible ? 0.5 : 1;

    if (this.isWalking) {
      // Draw walk animation frame
      if (this.walkFrames[this.currentWalkFrame] && this.walkFrames[this.currentWalkFrame].complete && this.walkFrames[this.currentWalkFrame].naturalWidth !== 0) {
        this.ctx.drawImage(
          this.walkFrames[this.currentWalkFrame],
          this.player.x,
          this.player.y,
          100 * this.scale,
          100 * this.scale
        );
      } else {
        // Fallback to idle sprite
        if (this.playerSprite && this.playerSprite.complete && this.playerSprite.naturalWidth !== 0) {
          this.ctx.drawImage(
            this.playerSprite,
            this.player.x,
            this.player.y,
            100 * this.scale,
            100 * this.scale
          );
        } else {
          // Fallback: Draw a blue rectangle
          this.ctx.fillStyle = 'blue';
          this.ctx.fillRect(this.player.x, this.player.y, 100 * this.scale, 100 * this.scale);
          console.warn('[draw] Player image not loaded. Using fallback shape.');
        }
      }
    } else if (this.player.isJumping) {
      // Draw jump animation frame
      if (this.jumpFrames[this.currentJumpFrame] && this.jumpFrames[this.currentJumpFrame].complete && this.jumpFrames[this.currentJumpFrame].naturalWidth !== 0) {
        this.ctx.drawImage(
          this.jumpFrames[this.currentJumpFrame],
          this.player.x,
          this.player.y,
          100 * this.scale,
          100 * this.scale
        );
      } else {
        // Fallback to idle sprite
        if (this.playerSprite && this.playerSprite.complete && this.playerSprite.naturalWidth !== 0) {
          this.ctx.drawImage(
            this.playerSprite,
            this.player.x,
            this.player.y,
            100 * this.scale,
            100 * this.scale
          );
        } else {
          // Fallback: Draw a green rectangle
          this.ctx.fillStyle = 'green';
          this.ctx.fillRect(this.player.x, this.player.y, 100 * this.scale, 100 * this.scale);
          console.warn('[draw] Player image not loaded. Using fallback shape.');
        }
      }
    } else {
      // Idle state
      if (this.playerSprite && this.playerSprite.complete && this.playerSprite.naturalWidth !== 0) {
        this.ctx.drawImage(
          this.playerSprite,
          this.player.x,
          this.player.y,
          100 * this.scale,
          100 * this.scale
        );
      } else {
        // Fallback: Draw a red rectangle
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.player.x, this.player.y, 100 * this.scale, 100 * this.scale);
        console.warn('[draw] Player image not loaded. Using fallback shape.');
      }
    }

    this.ctx.globalAlpha = 1;

    // ===== Debug Mode: Draw Hitboxes =====
    if (this.debugMode) {
      // Draw Player Hitbox
      const playerHitbox = {
        x: this.player.x + this.hitboxConfig.player.x * 100 * this.scale,
        y: this.player.y + this.hitboxConfig.player.y * 100 * this.scale,
        width: 100 * this.scale * this.hitboxConfig.player.width,
        height: 100 * this.scale * this.hitboxConfig.player.height
      };
      this.ctx.strokeStyle = 'cyan';
      this.ctx.lineWidth = 4 * this.scale;
      this.ctx.strokeRect(playerHitbox.x, playerHitbox.y, playerHitbox.width, playerHitbox.height);

      // Draw Obstacles Hitboxes
      this.obstacles.forEach((obs) => {
        const obstacleHitbox = obs.getHitbox();
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 4 * this.scale;
        this.ctx.strokeRect(obstacleHitbox.x, obstacleHitbox.y, obstacleHitbox.width, obstacleHitbox.height);
      });

      // Draw Paired Obstacles Hitboxes
      this.pairedObstacles.forEach((pair) => {
        pair.obstacles.forEach((obs) => {
          const obstacleHitbox = obs.getHitbox();
          this.ctx.strokeStyle = 'magenta';
          this.ctx.lineWidth = 4 * this.scale;
          this.ctx.strokeRect(obstacleHitbox.x, obstacleHitbox.y, obstacleHitbox.width, obstacleHitbox.height);
        });
      });

      // Draw Plane Obstacles Hitboxes
      this.planeObstacles.forEach((plane) => {
        const planeHitbox = plane.getHitbox();
        this.ctx.strokeStyle = 'orange';
        this.ctx.lineWidth = 4 * this.scale;
        this.ctx.strokeRect(planeHitbox.x, planeHitbox.y, planeHitbox.width, planeHitbox.height);
      });

      // Draw Power-ups Hitboxes
      this.powerUps.forEach((p) => {
        const powerUpHitbox = p.getHitbox();
        this.ctx.strokeStyle = 'green';
        this.ctx.lineWidth = 4 * this.scale;
        this.ctx.strokeRect(powerUpHitbox.x, powerUpHitbox.y, powerUpHitbox.width, powerUpHitbox.height);
      });
    }

    // ===== Draw Score =====
    const scoreText = `Score: ${Math.floor(this.score)}`;
    this.ctx.font = `${24 * this.scale}px Arial`;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3 * this.scale;
    this.ctx.strokeText(scoreText, 20, 40 * this.scale);
    this.ctx.fillText(scoreText, 20, 40 * this.scale);

    // ===== Draw Health (Hearts) =====
    for (let i = 0; i < this.health; i++) {
      const heartX = 20 + i * 36;
      const heartY = 60 * this.scale;
      if (this.heartSprite && this.heartSprite.complete && this.heartSprite.naturalWidth !== 0) {
        this.ctx.drawImage(this.heartSprite, heartX, heartY, 32 * this.scale, 32 * this.scale);
      } else {
        // Fallback: Draw a simple red heart
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.moveTo(heartX + 16 * this.scale, heartY + 10 * this.scale);
        this.ctx.bezierCurveTo(heartX + 16 * this.scale, heartY + 10 * this.scale, heartX + 0 * this.scale, heartY + 0 * this.scale, heartX + 0 * this.scale, heartY + 16 * this.scale);
        this.ctx.bezierCurveTo(heartX + 0 * this.scale, heartY + 26 * this.scale, heartX + 16 * this.scale, heartY + 40 * this.scale, heartX + 16 * this.scale, heartY + 40 * this.scale);
        this.ctx.bezierCurveTo(heartX + 16 * this.scale, heartY + 40 * this.scale, heartX + 32 * this.scale, heartY + 26 * this.scale, heartX + 32 * this.scale, heartY + 16 * this.scale);
        this.ctx.bezierCurveTo(heartX + 32 * this.scale, heartY + 0 * this.scale, heartX + 16 * this.scale, heartY + 10 * this.scale, heartX + 16 * this.scale, heartY + 10 * this.scale);
        this.ctx.fill();
      }
    }

    // ===== Game Over Screen =====
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.font = `${48 * this.scale}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 4 * this.scale;

      this.ctx.strokeText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30 * this.scale);
      this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30 * this.scale);

      const finalScoreText = `Score: ${Math.floor(this.score)}`;
      this.ctx.strokeText(finalScoreText, this.canvas.width / 2, this.canvas.height / 2 + 30 * this.scale);
      this.ctx.fillText(finalScoreText, this.canvas.width / 2, this.canvas.height / 2 + 30 * this.scale);

      const restartText = 'Click to Restart';
      this.ctx.strokeText(restartText, this.canvas.width / 2, this.canvas.height / 2 + 90 * this.scale);
      this.ctx.fillText(restartText, this.canvas.width / 2, this.canvas.height / 2 + 90 * this.scale);

      // Create "Back to Home" button if not exists
      if (!this.homeButton) {
        this.createHomeButton();
      }
    } else {
      // Remove "Back to Home" button if game is not over
      if (this.homeButton) {
        document.body.removeChild(this.homeButton);
        this.homeButton = null;
      }
    }
  }

  // Method to create "Back to Home" button
  createHomeButton() {
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

    this.homeButton.addEventListener('click', () => {
      console.log('[Back to Home] Button clicked.');
      window.location.href = 'index.html'; // Adjust path if necessary
    });

    document.body.appendChild(this.homeButton);
  }
}

// ===== Obstacle Class =====
class Obstacle {
  constructor(x, y, width, height, sprite, type, game) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.sprite = sprite;
    this.type = type; // 'ground' or 'overhead'
    this.speed = 4; // Adjust based on game speed
    this.game = game; // Reference to the game instance
  }

  update(deltaTime) {
    this.x -= this.speed * (deltaTime / 16.67);
  }

  draw(ctx, scale) {
    // Draw obstacle sprite or fallback
    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth !== 0) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    } else {
      // Fallback: Draw a red rectangle
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      console.warn('[Obstacle] Sprite not loaded. Using fallback shape.');
    }
  }

  offScreen() {
    return this.x + this.width < 0;
  }

  // Method to get hitbox
  getHitbox() {
    return {
      x: this.x + this.game.hitboxConfig.obstacle[this.type].x * this.width,
      y: this.y + this.game.hitboxConfig.obstacle[this.type].y * this.height,
      width: this.game.hitboxConfig.obstacle[this.type].width * this.width,
      height: this.game.hitboxConfig.obstacle[this.type].height * this.height
    };
  }

  // Collision detection
  checkCollision(player) {
    const playerHitbox = {
      x: player.x + this.game.hitboxConfig.player.x * 100 * this.game.scale,
      y: player.y + this.game.hitboxConfig.player.y * 100 * this.game.scale,
      width: this.game.hitboxConfig.player.width * 100 * this.game.scale,
      height: this.game.hitboxConfig.player.height * 100 * this.game.scale
    };

    const obstacleHitbox = this.getHitbox();

    return !(
      playerHitbox.x + playerHitbox.width < obstacleHitbox.x ||
      playerHitbox.x > obstacleHitbox.x + obstacleHitbox.width ||
      playerHitbox.y + playerHitbox.height < obstacleHitbox.y ||
      playerHitbox.y > obstacleHitbox.y + obstacleHitbox.height
    );
  }
}

// ===== PairedObstacle Class =====
class PairedObstacle {
  constructor(x, y, width, height, sprite, type, pairedSprite, pairedType, game) {
    // Define vertical spacing based on scale and a base value
    const baseSpacing = 250; // Base spacing in pixels (adjust as needed)
    const verticalSpacing = baseSpacing * game.scale;

    this.obstacles = [
      new Obstacle(x, y, width, height, sprite, type, game),
      new Obstacle(x, y - height - verticalSpacing, width, height, pairedSprite, pairedType, game) // Increased vertical spacing
    ];
  }

  update(deltaTime) {
    this.obstacles.forEach(obs => obs.update(deltaTime));
  }

  draw(ctx, scale) {
    this.obstacles.forEach(obs => obs.draw(ctx, scale));
  }

  offScreen() {
    return this.obstacles[0].offScreen() && this.obstacles[1].offScreen();
  }

  getHitboxes() {
    return this.obstacles.map(obs => obs.getHitbox());
  }

  checkCollision(player) {
    return this.obstacles.some(obs => obs.checkCollision(player));
  }
}


// ===== PlaneObstacle Class =====
class PlaneObstacle {
  constructor(x, y, width, height, sprite, game) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.sprite = sprite;
    this.speed = 5; // Slightly faster than ground obstacles
    this.game = game; // Reference to the game instance
  }

  update(deltaTime) {
    this.x -= this.speed * (deltaTime / 16.67);
  }

  draw(ctx, scale) {
    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth !== 0) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    } else {
      // Fallback: Draw a purple rectangle
      ctx.fillStyle = 'purple';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      console.warn('[PlaneObstacle] Sprite not loaded. Using fallback shape.');
    }
  }

  offScreen() {
    return this.x + this.width < 0;
  }

  // Method to get hitbox
  getHitbox() {
    return {
      x: this.x + this.game.hitboxConfig.obstacle.plane.x * this.width,
      y: this.y + this.game.hitboxConfig.obstacle.plane.y * this.height,
      width: this.game.hitboxConfig.obstacle.plane.width * this.width,
      height: this.game.hitboxConfig.obstacle.plane.height * this.height
    };
  }

  // Collision detection
  checkCollision(player) {
    const playerHitbox = {
      x: player.x + this.game.hitboxConfig.player.x * 100 * this.game.scale,
      y: player.y + this.game.hitboxConfig.player.y * 100 * this.game.scale,
      width: this.game.hitboxConfig.player.width * 100 * this.game.scale,
      height: this.game.hitboxConfig.player.height * 100 * this.game.scale
    };

    const planeHitbox = this.getHitbox();

    return !(
      playerHitbox.x + playerHitbox.width < planeHitbox.x ||
      playerHitbox.x > planeHitbox.x + planeHitbox.width ||
      playerHitbox.y + playerHitbox.height < planeHitbox.y ||
      playerHitbox.y > planeHitbox.y + planeHitbox.height
    );
  }
}

// ===== PowerUp Class =====
class PowerUp {
  constructor(x, y, size, sprite, game) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.sprite = sprite;
    this.speed = 4; // Same as obstacles
    this.collected = false;
    this.game = game; // Reference to the game instance
  }

  update(deltaTime) {
    this.x -= this.speed * (deltaTime / 16.67);
  }

  draw(ctx, scale) {
    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth !== 0) {
      ctx.drawImage(this.sprite, this.x, this.y, this.size, this.size);
    } else {
      // Fallback: Draw a gold circle
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      console.warn('[PowerUp] Sprite not loaded. Using fallback shape.');
    }
  }

  offScreen() {
    return this.x + this.size < 0;
  }

  // Method to get hitbox
  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size
    };
  }

  // Collision detection
  checkCollision(player) {
    const playerHitbox = {
      x: player.x + this.game.hitboxConfig.player.x * 100 * this.game.scale,
      y: player.y + this.game.hitboxConfig.player.y * 100 * this.game.scale,
      width: this.game.hitboxConfig.player.width * 100 * this.game.scale,
      height: this.game.hitboxConfig.player.height * 100 * this.game.scale
    };

    const powerUpHitbox = this.getHitbox();

    return !(
      playerHitbox.x + playerHitbox.width < powerUpHitbox.x ||
      playerHitbox.x > powerUpHitbox.x + powerUpHitbox.width ||
      playerHitbox.y + playerHitbox.height < powerUpHitbox.y ||
      playerHitbox.y > powerUpHitbox.y + powerUpHitbox.height
    );
  }
}

// ===== ObstacleSpawner Class =====
class ObstacleSpawner {
  constructor(game) {
    this.game = game;
    this.spawnCooldown = 900; // Base cooldown in ms
    this.minExtraDelay = 200;
    this.maxExtraDelay = 1200;
    this.currentCooldown = this.spawnCooldown + this.getRandomSpawnDelay();
    this.lastSpawnTime = Date.now();
    this.active = true;
    this.speed = 4; // Base speed
  }

  getRandomSpawnDelay() {
    return Math.floor(Math.random() * (this.maxExtraDelay - this.minExtraDelay + 1)) + this.minExtraDelay;
  }

  update(deltaTime) {
    if (!this.active) return;
    const now = Date.now();
    if (now - this.lastSpawnTime >= this.currentCooldown) {
      // Decide whether to spawn single or paired obstacle
      if (Math.random() < 0.3) { // 30% chance for paired obstacle
        this.spawnPairedObstacle();
      } else {
        this.spawnSingleObstacle();
      }
      this.lastSpawnTime = now;
      this.currentCooldown = this.spawnCooldown + this.getRandomSpawnDelay();
    }
  }

  spawnSingleObstacle() {
    const width = 45 * this.game.scale;
    const minHeight = 55 * this.game.scale;
    const maxHeight = 85 * this.game.scale;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    const x = this.game.canvas.width + 100;
    const y = this.game.groundY - height;
    const spriteIndex = Math.floor(Math.random() * this.game.obstacleSprites.length);
    const sprite = this.game.obstacleSprites[spriteIndex];
    const obstacle = new Obstacle(x, y, width, height, sprite, 'ground', this.game);
    obstacle.speed = this.speed;
    this.game.obstacles.push(obstacle);
    console.log('[ObstacleSpawner] Single obstacle spawned.');
  }

  spawnPairedObstacle() {
    const width = 45 * this.game.scale;
    const minHeight = 55 * this.game.scale;
    const maxHeight = 85 * this.game.scale;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    const x = this.game.canvas.width + 100;
    const yGround = this.game.groundY - height;
    const yOverhead = yGround - (height + 150 * this.game.scale); // Adjust spacing as needed

    const spriteIndex1 = Math.floor(Math.random() * this.game.obstacleSprites.length);
    const sprite1 = this.game.obstacleSprites[spriteIndex1];

    const spriteIndex2 = Math.floor(Math.random() * this.game.obstacleSprites.length);
    const sprite2 = this.game.obstacleSprites[spriteIndex2];

    const paired = new PairedObstacle(x, yGround, width, height, sprite1, 'ground', sprite2, 'overhead', this.game);
    paired.obstacles[0].speed = this.speed;
    paired.obstacles[1].speed = this.speed;
    this.game.pairedObstacles.push(paired);

    console.log('[ObstacleSpawner] Paired obstacle spawned.');
  }

  getSpeed() {
    return this.speed;
  }

  stop() {
    this.active = false;
  }

  start() {
    this.active = true;
    this.lastSpawnTime = Date.now();
    this.currentCooldown = this.spawnCooldown + this.getRandomSpawnDelay();
  }
}

// ===== PlaneSpawner Class =====
class PlaneSpawner {
  constructor(game) {
    this.game = game;
    this.spawnCooldown = 5000; // 5 seconds
    this.currentCooldown = this.spawnCooldown;
    this.lastSpawnTime = Date.now();
    this.active = true;
  }

  update(deltaTime) {
    if (!this.active) return;
    const now = Date.now();
    if (now - this.lastSpawnTime >= this.currentCooldown) {
      this.spawnPlaneObstacle();
      this.lastSpawnTime = now;
      this.currentCooldown = this.spawnCooldown + this.getRandomSpawnDelay();
    }
  }

  getRandomSpawnDelay() {
    return Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds extra
  }

  spawnPlaneObstacle() {
    const width = 120 * this.game.scale;
    const height = 60 * this.game.scale;
    const x = this.game.canvas.width + 100;
    // Spawn planes between 30% and 60% of the canvas height
    const y = Math.random() * (this.game.canvas.height * 0.3) + (this.game.canvas.height * 0.3);
    const plane = new PlaneObstacle(x, y, width, height, this.game.planeSprite, this.game);
    plane.speed = this.game.obstacleSpawner.getSpeed() * 1.2;
    this.game.planeObstacles.push(plane);
    console.log('[PlaneSpawner] Plane obstacle spawned.');
  }

  stop() {
    this.active = false;
  }

  start() {
    this.active = true;
    this.lastSpawnTime = Date.now();
    this.currentCooldown = this.spawnCooldown + this.getRandomSpawnDelay();
  }
}

// ===== PowerUpSpawner Class =====
class PowerUpSpawner {
  constructor(game) {
    this.game = game;
    this.spawnCooldown = 7000; // 7 seconds
    this.currentCooldown = this.spawnCooldown;
    this.lastSpawnTime = Date.now();
    this.active = true;
  }

  update(deltaTime) {
    if (!this.active) return;
    const now = Date.now();
    if (now - this.lastSpawnTime >= this.currentCooldown) {
      this.spawnPowerUp();
      this.lastSpawnTime = now;
      this.currentCooldown = this.spawnCooldown + this.getRandomSpawnDelay();
    }
  }

  getRandomSpawnDelay() {
    return Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds extra
  }

  spawnPowerUp() {
    const size = 50 * this.game.scale;
    const x = this.game.canvas.width + 100;
    const y = Math.random() * (this.game.canvas.height * 0.5) + (this.game.canvas.height * 0.2);
    const powerUp = new PowerUp(x, y, size, this.game.powerUpSprite, this.game);
    powerUp.speed = this.game.obstacleSpawner.getSpeed();
    this.game.powerUps.push(powerUp);
    console.log('[PowerUpSpawner] Power-up spawned.');
  }

  stop() {
    this.active = false;
  }

  start() {
    this.active = true;
    this.lastSpawnTime = Date.now();
    this.currentCooldown = this.spawnCooldown + this.getRandomSpawnDelay();
  }
}

// ===== Export the game to be started from HTML =====
export function startGame() {
  console.log('[RamenRunner] Starting game...');
  new RamenRunner();
}
