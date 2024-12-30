#!/usr/bin/env bash

# 1. Create directories
mkdir -p assets/images assets/sounds public src styles

# 2. Create placeholder files
touch assets/images/.gitkeep
touch assets/sounds/.gitkeep
touch public/index.html
touch src/index.js
touch src/gameLogic.js
touch src/leaderboard.js
touch src/config.js
touch styles/main.css
touch vercel.json
touch README.md

# 3. Initialize package.json & install dependencies
npm init -y
npm install phaser --save

# 4. Provide a message to the user
echo "Project structure created and Phaser installed!"
echo "Next steps:"
echo "1. Update your 'index.html' in 'public/' with the basic HTML template."
echo "2. Implement your game logic in 'src/gameLogic.js'."
echo "3. Run 'npm start' to test your game (if you add a dev server script)."
