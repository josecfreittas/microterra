const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const blockSize = 32;
const playerSize = blockSize;
let playerPosition = { x: canvas.width / 2, y: canvas.height / 2 };
let blocks = [];

let playerVelocity = { x: 0, y: 0 };
const gravity = 0.5;
const groundLevel = canvas.height - blockSize;
const playerSpeed = 4;
const jumpForce = 10;

const keys = {
  a: false,
  d: false,
  space: false,
  jumpKeyJustPressed: false
};

window.addEventListener('keydown', (event) => {
  if (event.key === 'a' || event.key === 'A') {
    keys.a = true;
  } else if (event.key === 'd' || event.key === 'D') {
    keys.d = true;
  } else if (event.code === 'Space' && !keys.jumpKeyJustPressed) {
    keys.space = true;
    keys.jumpKeyJustPressed = true;
    handleJump();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'A') {
    keys.a = false;
  } else if (event.key === 'd' || event.key === 'D') {
    keys.d = false;
  } else if (event.code === 'Space') {
    keys.space = false;
    keys.jumpKeyJustPressed = false;
  }
});

function isPlayerOnGroundOrBlock() {
  if (playerPosition.y >= groundLevel) {
    console.log('player is on ground');
    return true;
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (
      playerPosition.x + playerSize > block.x &&
      playerPosition.x < block.x + blockSize &&
      Math.abs((playerPosition.y + playerSize) - block.y) < 1 // Check if there's a block right beneath the player
    ) {
      console.log('player is on block');
      return true;
    }
  }

  return false;
}

function isBlockAbovePlayer() {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (
      playerPosition.x + playerSize > block.x &&
      playerPosition.x < block.x + blockSize &&
      Math.abs(playerPosition.y - (block.y + blockSize)) < jumpForce
    ) {
      return true;
    }
  }
  return false;
}

function handleJump() {
  if (isPlayerOnGroundOrBlock() && !isBlockAbovePlayer()) {
    playerVelocity.y -= jumpForce;
  }
}

function handlePlayerMovement() {
  // Save the current player position for collision check
  const prevPosition = {
    x: playerPosition.x,
    y: playerPosition.y
  };

  if (keys.a) {
    playerPosition.x -= playerSpeed;
  }

  if (keys.d) {
    playerPosition.x += playerSpeed;
  }

  // Check for collision with blocks
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (
      playerPosition.x + playerSize > block.x &&
      playerPosition.x < block.x + blockSize &&
      playerPosition.y + playerSize > block.y &&
      playerPosition.y < block.y + blockSize
    ) {
      // Collision detected, revert to previous position
      playerPosition.x = prevPosition.x;
      break;
    }
  }
}

const blockTypes = {
  dirt: {
    color: '#8B4513',
    damageMultiplier: 1,
    hitSound: new Audio('lib/audio/grass.mp3')
  },
  dirtWithGrass: {
    color: '#8B4513',
    colorTop: '#22FF22',
    damageMultiplier: 1.1,
    hitSound: new Audio('lib/audio/grass.mp3')
  },
  stone: {
    color: '#A9A9A9',
    damageMultiplier: 0.75,
    hitSound: new Audio('lib/audio/stone.mp3')
  },
  bedrock: {
    color: '#333333',
    damageMultiplier: 0.25,
    hitSound: new Audio('lib/audio/stone.mp3')
  }
};


function generateWorld() {
  for (let y = canvas.height - blockSize * 5; y < canvas.height; y += blockSize) {
    for (let x = 0; x < canvas.width; x += blockSize) {
      const block = {
        x,
        y,
        type: 'dirt',
        life: 100
      };

      if (y === canvas.height - blockSize) {
        block.type = 'bedrock';
      } else if (y >= canvas.height - blockSize * 2) {
        block.type = 'stone';
      } else if (y >= canvas.height - blockSize * 4) {
        block.type = 'dirt';
      } else if (y === canvas.height - blockSize * 5) {
        block.type = 'dirtWithGrass';
      }

      blocks.push(block);
    }
  }
}


function deductBlockLife(block) {
  damagePerClick = 25 * blockTypes[block.type].damageMultiplier;
  block.life -= damagePerClick;
  if (block.life <= 0) {
    return true;
  }
  return false;
}

function playBlockHitSound(blockType) {
  if (blockType.hitSound) {
    // Create a clone of the audio element to allow multiple overlapping sounds
    const sound = blockType.hitSound.cloneNode();
    sound.play();
  }
}

generateWorld();
playerPosition.y = groundLevel - playerSize * 5;

function applyGravity() {
  const prevVelocityY = playerVelocity.y;

  playerVelocity.y += gravity;
  playerPosition.y += playerVelocity.y;

  // Detect collision with blocks
  let onBlock = false;
  let hitBlockAbove = false;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (
      playerPosition.x + playerSize > block.x &&
      playerPosition.x < block.x + blockSize &&
      playerPosition.y + playerSize > block.y &&
      playerPosition.y + playerSize <= block.y + blockSize
    ) {
      onBlock = true;
      playerPosition.y = block.y - playerSize;
      playerVelocity.y = 0;
      break;
    }

    if (
      playerPosition.x + playerSize > block.x &&
      playerPosition.x < block.x + blockSize &&
      playerPosition.y >= block.y + blockSize &&
      playerPosition.y <= block.y + blockSize + Math.abs(playerVelocity.y) &&
      prevVelocityY > 0
    ) {
      hitBlockAbove = true;
      playerPosition.y = block.y + blockSize - playerSize;
      playerVelocity.y = 0;
      console.log('hit block above');
      break;
    }
  }

  // If not on a block, check for collision with ground
  if (!onBlock && !hitBlockAbove) {
    if (playerPosition.y >= groundLevel) {
      playerPosition.y = groundLevel;
      playerVelocity.y = 0;
    }
  }
}

function drawLifePercentage(block) {
  const lifePercentage = Math.floor((block.life / 100) * 100);

  if (lifePercentage < 100) {
    ctx.font = '8px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${lifePercentage}%`, block.x + blockSize / 2, block.y + blockSize / 2);
  }
}



function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  applyGravity();
  handlePlayerMovement();

  // Draw blocks
  blocks.forEach(block => {
    const blockType = blockTypes[block.type];
    ctx.fillStyle = blockType.color;
    ctx.fillRect(block.x, block.y, blockSize, blockSize);
    if (blockType.colorTop) {
      ctx.fillStyle = blockType.colorTop;
      ctx.fillRect(block.x, block.y, blockSize, blockSize / 4);
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Set border color and opacity
    ctx.strokeRect(block.x + 0.5, block.y + 0.5, blockSize - 1, blockSize - 1);

    drawLifePercentage(block); // Draw life percentage text
  });

  // Draw player
  ctx.fillStyle = 'blue';
  ctx.fillRect(playerPosition.x, playerPosition.y, playerSize, playerSize);

  requestAnimationFrame(draw);
}

draw();

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const maxDistance = 3 * blockSize;
  const playerCenter = {
    x: playerPosition.x + playerSize / 2,
    y: playerPosition.y + playerSize / 2
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockCenter = {
      x: block.x + blockSize / 2,
      y: block.y + blockSize / 2
    };
    const distance = Math.sqrt(
      Math.pow(playerCenter.x - blockCenter.x, 2) +
      Math.pow(playerCenter.y - blockCenter.y, 2)
    );

    if (
      mouseX >= block.x && mouseX <= block.x + blockSize &&
      mouseY >= block.y && mouseY <= block.y + blockSize &&
      distance <= maxDistance
    ) {
      // Deduct life points from the block
      const blockType = blockTypes[block.type];
      block.life -= blockType.damageMultiplier * 25;

      playBlockHitSound(blockType);

      if (block.life <= 0) {
        // Remove the block from the blocks array
        blocks.splice(i, 1);
      }
      break;
    }
  }
});


