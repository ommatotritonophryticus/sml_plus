// Canvas initialization
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight + 2;

// Percentage-based dimensions
function widthPercent(percent) {
    return canvas.width * percent / 100;
}

function heightPercent(percent) {
    return canvas.height * percent / 100;
}

// Random number generator
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Audio setup
const ambientAudio = new Audio();
ambientAudio.src = 'amb_0.mp3';
ambientAudio.onended = () => {
    ambientAudio.currentTime = 0;
    ambientAudio.play();
};

// Jump sounds
const jumpAudios = Array(4).fill().map(() => ({
    audios: Array(3).fill().map(() => {
        const audio = new Audio();
        audio.volume = 0.3;
        return audio;
    }),
    current: 0
}));

jumpAudios.forEach((group, i) => {
    group.audios.forEach(audio => {
        audio.src = `j${i}.mp3`;
    });
});

function playJumpSound(index) {
    const audioGroup = jumpAudios[index];
    audioGroup.audios[audioGroup.current].play();
    audioGroup.current = (audioGroup.current + 1) % audioGroup.audios.length;
}

// Background color cycling
let backgroundColor = 0;
let backgroundIncreasing = true;

// Player character
let player = {
    x: widthPercent(10),
    y: heightPercent(80),
    width: heightPercent(10),
    height: heightPercent(10),
    verticalSpeed: 0,
    jumpForce: 0,
    isJumping: false,
    inAir: false,
    score: 0
};

// Player skins
const skins = Array(4).fill().map((_, i) => {
    const img = new Image();
    img.src = `${i}.png`;
    return img;
});

// Column generator
function Column(width, x, y, height) {
    if (width === undefined) {
        this.width = widthPercent(random(10, 30));
        this.x = widthPercent(115) + this.width;
        this.y = heightPercent(10);
        this.height = canvas.height;
    } else {
        this.width = width;
        this.x = x;
        this.y = y;
        this.height = height;
    }
}

// Star generator
function Star(x, y, width, height, color, layer) {
    if (x === undefined) {
        this.layer = random(1, 3);
        const size = heightPercent(random(5, 10) / 10) * this.layer;
        this.width = size;
        this.height = size;
        
        if (random(0, 1)) {
            this.y = -this.height;
            this.x = widthPercent(random(0, 100));
        } else {
            this.x = canvas.width + this.height;
            this.y = heightPercent(random(0, 100));
        }
        this.color = `rgb(${random(100, 255)}, ${random(100, 255)}, ${random(100, 255)})`;
    } else {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.layer = layer;
    }
}

// Game objects
const stars = Array(100).fill().map(() => {
    const size = heightPercent(random(5, 10) / 10);
    return new Star(
        random(0, widthPercent(100)), 
        random(0, heightPercent(100)), 
        size,
        size,
        `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`,
        random(1, 50) / 10
    );
});

let columns = [
    new Column(heightPercent(14), widthPercent(10) - heightPercent(2), heightPercent(90), canvas.height),
    new Column(heightPercent(50), widthPercent(50), heightPercent(50), canvas.height)
];

// Game state
let gameState = 0; // 0 = menu, 1 = playing
let record = localStorage.getItem("record") || 0;

// Game initialization
function initGame() {
    player = {
        x: widthPercent(10),
        y: heightPercent(80),
        width: heightPercent(10),
        height: heightPercent(10),
        verticalSpeed: 0,
        jumpForce: 0,
        isJumping: false,
        inAir: false,
        score: 0
    };
    columns = [
        new Column(heightPercent(14), widthPercent(10) - heightPercent(2), heightPercent(90), canvas.height),
        new Column(heightPercent(50), widthPercent(50), heightPercent(50), canvas.height)
    ];
}

// Collision detection
function checkCollision(obj1, obj2) {
    if (!obj1 || !obj2) return false;
    
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Text utilities
const textMeasurementCanvas = document.createElement("canvas");
const textCtx = textMeasurementCanvas.getContext("2d");

function getTextWidth(text, font) {
    textCtx.font = font;
    return textCtx.measureText(text).width;
}

function drawCenteredText(text, startX, startY, endX, endY) {
    const x = widthPercent(startX) + (widthPercent(endX) / 2 - getTextWidth(text, ctx.font) / 2);
    const y = heightPercent(startY) + heightPercent(6);
    ctx.fillText(text, x, y);
}

// Main game loop
function gameLoop() {
    // Update canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight + 2;
    
    // Draw background
    ctx.fillStyle = `rgb(${backgroundColor / 2}, ${backgroundColor / 2}, ${backgroundColor})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw UI based on game state
    if (gameState === 1) {
        ctx.font = `${heightPercent(10)}px font`;
        ctx.fillStyle = "#ffffff";
        drawCenteredText(String(player.score), 0, 10, 25, 10);
    }
    
    if (gameState === 0) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${heightPercent(10)}px font`;
        drawCenteredText("TAP TO START", 0, 50, 100, 100);
        ctx.font = `${heightPercent(5)}px font`;
        drawCenteredText(`RECORD: ${record}`, 0, 85, 100, 100);
    }

    // Update and draw stars
    stars.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, star.width, star.height);
        
        // Star movement
        const speedFactor = player.isJumping ? 2 : 0.5;
        star.x -= widthPercent(0.01) * star.layer * speedFactor;
        star.y += heightPercent(0.005) * star.layer * speedFactor;
        
        // Star regeneration
        if (star.x + star.width < 0 || star.y > canvas.height) {
            const size = heightPercent(random(5, 10) / 10);
            const isLeftSide = random(0, 1) === 1;
            
            Object.assign(star, {
                x: isLeftSide ? canvas.width + size : widthPercent(random(0,100)),
                y: isLeftSide ? heightPercent(random(0, 100)) : -size,
                width: size,
                height: size,
                color: `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`,
                layer: random(1, 50) / 10
            });
        }
    });

    // Gameplay logic
    if (gameState === 1) {
        // Process columns
        for (let i = columns.length - 1; i >= 0; i--) {
            const col = columns[i];
            
            // Draw column
            ctx.fillStyle = "#969696";
            ctx.fillRect(col.x, col.y, col.width, col.height);
            ctx.fillStyle = `rgb(${backgroundColor / 5}, ${backgroundColor / 5}, ${backgroundColor / 5})`;
            ctx.fillRect(
                col.x + (heightPercent(0.5) * (col.x - player.x) / 500),
                col.y + (heightPercent(0.5) * (col.y - heightPercent(30)) / 100),
                col.width,
                col.height - heightPercent(0.5)
            );
            
            // Remove off-screen columns
            if (col.x + col.width < 0) {
                columns.splice(i, 1);
                continue;
            }
            
            // Move columns during jump
            if (player.isJumping) {
                col.x -= widthPercent(1);
                col.y += heightPercent(0.6);
            }
            
            // Collision detection with player
            if (checkCollision(col, {
                x: player.x,
                y: player.y + player.verticalSpeed,
                width: player.width,
                height: player.height
            })) {
                player.y = col.y - player.height * 0.9;
                player.isJumping = false;
            }
        }

        // Player movement and physics
        if (player.isJumping) {
            player.y += player.verticalSpeed - player.jumpForce;
            player.jumpForce -= heightPercent(0.07);
            
            // Draw jumping player
            const yOffset = player.y - 1 - (player.y - heightPercent(10)) / 200;
            ctx.drawImage(skins[3], player.x, yOffset, player.width, player.height);
            ctx.drawImage(skins[1], player.x, player.y, player.width, player.height);
        } else {
            // Draw standing player
            const yOffset = player.y - 1 - (player.y - heightPercent(10)) / 200;
            ctx.drawImage(skins[2], player.x, yOffset, player.width, player.height);
            ctx.drawImage(skins[0], player.x, player.y, player.width, player.height);
        }

        // Game over condition
        if (player.y > canvas.height) {
            if (record < player.score) {
                record = player.score;
                localStorage.setItem("record", record);
            }
            initGame();
            gameState = 0;
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Input handling
function handleKeyDown(key) {
    if (key !== 32) return; // Only spacebar
    
    // Start ambient audio
    if (ambientAudio.paused) {
        ambientAudio.play().catch(e => console.log("Audio play failed:", e));
    }

    if (gameState === 1) {
        // Jump logic
        if (!player.isJumping && !player.inAir) {
            player.jumpForce = heightPercent(1.8);
            player.isJumping = true;
            
            // Adjust falling speed based on number of columns
            const columnFactor = 1 + columns.length * 0.05;
            player.verticalSpeed = -heightPercent(0.5) * columnFactor;
            
            columns.push(new Column());
            player.inAir = true;
            player.score++;
            
            playJumpSound(random(0, 3));
            
            // Background color cycling
            backgroundColor += backgroundIncreasing ? 0.5 : -0.5;
            if (backgroundColor >= 255) backgroundIncreasing = false;
            if (backgroundColor <= 0) backgroundIncreasing = true;
        }
    } else {
        // Start game
        gameState = 1;
        player.inAir = true;
    }
}

function handleKeyUp(key) {
    if (key === 32 && gameState === 1) {
        player.inAir = false;
        
        // Adjust falling speed based on number of columns
        const columnFactor = 1 + columns.length * 0.05;
        player.verticalSpeed = heightPercent(0.1) * columnFactor;
    }
}

// Event listeners
document.addEventListener('touchstart', () => handleKeyDown(32));
document.addEventListener('touchend', () => handleKeyUp(32));
document.addEventListener('mousedown', () => handleKeyDown(32));
document.addEventListener('mouseup', () => handleKeyUp(32));
document.addEventListener('keydown', e => handleKeyDown(e.keyCode));
document.addEventListener('keyup', e => handleKeyUp(e.keyCode));

// Start the game
ambientAudio.onloadeddata = gameLoop;