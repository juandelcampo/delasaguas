// --- GAME.JS: Motor Arcade Juegoclip (Épico, Narrativo, Despiadado y High Score) ---

let gameWidget = null;
let gameAnim;
let drops = [], lasers = [], enemyLasers = [], particles = [], stars = [], powerups = [], asteroids = [];
let bosses = [], allies = [];
let blackHole = null;

let score = 0, isGameRunning = false, frameCount = 0;
let enemiesKilled = 0, bossesKilled = 0; 
let bombs = 3; 
let bombActive = 0; 
let massiveFleetSpawned = false;

// --- SISTEMA DE HIGH SCORE (localStorage) ---
let highScore = localStorage.getItem('dematinale_highscore') || 0;

let paddle = { x: 0, y: 0 }; 
let playerShieldHp = 0; 
let playerScale = 1.0; 
let shakeTime = 0; 
let weaponLevel = 1, shieldTimer = 0; 
let currentAudioSecs = 0;
let gamePhase = -1; 
let overlayMsg = ""; let overlayTimer = 0;

let startPlanetY = 0;
let endPlanetY = -800;

const scale = 6; 
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// --- TECLADO ---
document.addEventListener('keydown', (e) => {
    if(!isGameRunning) return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault(); 
        keys[e.code] = true;
        if(typeof idleTime !== 'undefined') idleTime = 0;
    }
    // BOMBA DE PERÍMETRO
    if(e.code === 'Space' && bombs > 0 && bombActive === 0 && playerScale === 1.0) {
        e.preventDefault();
        
        // Bloqueo de bomba en el Leviatán
        let isLeviatanAlive = bosses.some(b => b.type === 1);
        if (isLeviatanAlive) {
            showMessage("¡¡¡ERROR CRITICO: SISTEMA DE BOMBAS ATASCADO!!!");
            triggerShake(10);
            return;
        }

        bombs--;
        bombActive = 30; // Duración de la onda expansiva
        triggerShake(30);
        updateScore();
        spawnExplosion(paddle.x, paddle.y, '#fff', 60); // Fogonazo central
    }
});
document.addEventListener('keyup', (e) => {
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) keys[e.code] = false;
});

document.addEventListener('DOMContentLoaded', () => {
    const iframeGame = document.getElementById('sc-game-widget');
    if(typeof SC !== 'undefined' && iframeGame) {
        gameWidget = SC.Widget(iframeGame);
        gameWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
            if(isGameRunning) {
                currentAudioSecs = Math.floor(data.currentPosition / 1000);
                const m = Math.floor(currentAudioSecs / 60); 
                const s = currentAudioSecs % 60;
                document.getElementById('game-time').innerText = `TIME: ${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            }
        });
    }

    const instructions = document.querySelector('.game-instructions');
    if(instructions) {
        instructions.innerHTML = `> FLECHAS: MOVER<br><br>> ESPACIO: BOMBA PERIMETRO<br><br>> DISPARO AUTOMATICO`;
    }

    stars = [];
    for(let i=0; i<60; i++) stars.push({ x: Math.random() * 800, y: Math.random() * 800, s: Math.random() * 0.8 + 0.4 });
    
    // Mostrar High Score en pantalla antes de jugar
    updateScore(); 
});

// --- SPRITES VOLUMÉTRICOS ---
const playerSprite = [ [0,0,3,0,0], [0,1,1,1,0], [1,1,3,1,1], [2,1,0,1,2], [2,0,0,0,2] ];
const allySprite   = [ [0,0,3,0,0], [0,3,1,2,0], [3,1,1,1,2], [3,0,1,0,2], [0,0,2,0,0] ];

const enemyBasic   = [ [2,0,1,0,3], [0,2,1,3,0], [0,2,0,3,0], [2,0,1,0,3] ]; 
const enemyTank    = [ [0,0,2,3,0,0], [0,2,1,1,3,0], [2,1,0,0,1,3], [2,1,1,1,1,3], [0,2,0,0,3,0] ]; 
const enemyShooter = [ [2,1,1,1,3], [2,0,1,0,3], [0,2,0,3,0], [0,0,1,0,0] ]; 
const enemyKamikaze= [ [0,3,0], [1,1,1], [2,0,2], [2,3,2] ]; 
const enemySwarm   = [ [3,1,2] ]; 
const enemyAngel   = [ [0,0,0,3,0,0,0], [0,0,3,1,2,0,0], [0,3,1,1,1,2,0], [3,1,1,3,1,1,2], [0,2,1,1,1,2,0], [0,0,2,1,2,0,0], [0,0,0,2,0,0,0] ]; 

const asteroidShapes = [
    [ [0,2,1,1,1,0], [2,1,1,3,1,3], [2,1,1,3,3,3], [0,2,1,1,3,0] ], 
    [ [0,0,2,1,0], [2,1,1,3,3], [2,1,1,3,3], [0,2,2,1,0] ], 
    [ [0,2,1,3,0], [2,1,1,3,3], [2,1,3,3,0], [0,2,3,0,0] ] 
];
const powerupSprite = [ [0,3,3,0], [3,1,1,3], [3,1,1,3], [0,2,2,0] ];

const bossLeviatan = [ [2,0,0,0,0,0,0,3], [3,2,0,0,0,0,2,3], [1,3,2,0,0,2,3,1], [1,1,3,2,2,3,1,1], [0,1,1,1,1,1,1,0], [0,2,1,3,3,1,2,0], [2,0,1,0,0,1,0,3] ];
const bossBehemoth = [ [0,2,2,2,2,2,0], [2,1,1,1,1,1,3], [2,1,0,1,0,1,3], [2,1,1,1,1,1,3], [0,2,1,1,1,3,0], [0,2,0,2,0,3,0] ];
const bossAbaddon = [ [0,0,2,3,2,0,0], [0,2,1,1,1,3,0], [2,1,0,1,0,1,3], [3,1,1,1,1,1,3], [2,1,0,1,0,1,3], [0,2,1,3,1,3,0], [0,0,2,1,3,0,0], [0,0,0,2,0,0,0] ];
const bossSprites = [bossLeviatan, bossBehemoth, bossAbaddon];
const bossNames = ["LEVIATAN", "BEHEMOTH", "ABADDON"];

const palPlayer = ['#0cf', '#008', '#fff'];
const palAlly   = ['#0f8', '#050', '#aff']; 
const palAst    = ['#888', '#555', '#ccc']; 

function getEnemyPal(type) {
    if(type===1) return ['#f0f', '#808', '#f8f']; 
    if(type===2) return ['#f80', '#a40', '#fd0']; 
    if(type===3) return ['#f00', '#800', '#f88']; 
    if(type===4) return ['#0f0', '#080', '#8f8']; 
    if(type===5) return ['#8cf', '#06a', '#fff']; 
    if(type===6) return ['#a0f', '#50a', '#d8f']; 
    return ['#fff', '#888', '#fff'];
}

function drawSprite(ctx, matrix, x, y, palette, angle = 0, customScale = scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const wOff = (matrix[0].length * customScale) / 2;
    const hOff = (matrix.length * customScale) / 2;
    for(let r=0; r<matrix.length; r++) {
        for(let c=0; c<matrix[r].length; c++) {
            let val = matrix[r][c];
            if(val > 0) {
                ctx.fillStyle = Array.isArray(palette) ? palette[val-1] : palette; 
                ctx.fillRect(-wOff + (c * customScale), -hOff + (r * customScale), customScale, customScale);
            }
        }
    }
    ctx.restore();
}

function drawPixelCircle(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    for (let i = -radius; i <= radius; i += scale) {
        for (let j = -radius; j <= radius; j += scale) {
            if (i * i + j * j <= radius * radius) ctx.fillRect(x + i, y + j, scale, scale);
        }
    }
}

function drawHollowPixelCircle(ctx, x, y, radius, color, thick = scale) {
    ctx.fillStyle = color;
    let r2 = radius * radius;
    let rInner = (radius - thick) * (radius - thick);
    for (let i = -radius; i <= radius; i += scale) {
        for (let j = -radius; j <= radius; j += scale) {
            let d = i*i + j*j;
            if (d <= r2 && d >= rInner) ctx.fillRect(x + i, y + j, scale, scale);
        }
    }
}

function drawPlanet(ctx, x, y, radius, pal) {
    drawPixelCircle(ctx, x, y, radius, pal[1]); 
    drawPixelCircle(ctx, x - radius*0.1, y - radius*0.1, radius*0.9, pal[0]); 
    drawPixelCircle(ctx, x - radius*0.3, y - radius*0.3, radius*0.6, pal[2]); 
}

function spawnExplosion(x, y, palette, size = 15) {
    if(particles.length > 300) return; 
    let baseC = Array.isArray(palette) ? palette[0] : palette;
    let colors = [baseC, '#fff', '#ff0', '#f80']; 
    for(let i=0; i<size; i++) {
        particles.push({ 
            x: x, y: y, 
            vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, 
            life: Math.floor(15 + Math.random()*20), 
            color: colors[Math.floor(Math.random() * colors.length)] 
        });
    }
}

function spawnGlow(x, y, color) {
    for(let i=0; i<20; i++) particles.push({ x: x, y: y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 15, color: color });
}

function showMessage(msg) { overlayMsg = msg; overlayTimer = 180; }

function spawnBoss(type, canvas) {
    if(!canvas) return;
    let newHp = type === 1 ? 100 : (type === 2 ? 150 : 250);
    bosses.push({
        type: type, name: bossNames[type-1], x: canvas.width/2, y: -200, startX: canvas.width/2,
        hp: newHp, maxHp: newHp,
        state: 'entering', hitFlash: 0, sprite: bossSprites[type-1], fightFrame: 0,
        palette: getEnemyPal(type===1?3 : (type===2?5:2))
    });
}

function spawnAllies(canvas, count = 4, yOffset = 150) {
    for(let i=0; i<count; i++) {
        allies.push({ 
            x: (canvas.width / (count+1)) * (i + 1), 
            y: canvas.height + 50 + (Math.random()*150), 
            targetY: canvas.height/2 + (Math.random()*200), 
            speed: -6, state: 'entering', shield: 250 
        });
    }
}

function updateScore() { 
    const el = document.getElementById('game-score');
    if(el) {
        el.innerText = `HI: ${String(highScore).padStart(7, '0')} | SCORE: ${String(score).padStart(7, '0')} | BOMBAS: ${bombs}`; 
    }
}

function takeHit(penalty) {
    if(shieldTimer > 0) return; 
    if(playerShieldHp > 0) {
        playerShieldHp--; shieldTimer = 40; 
        spawnExplosion(paddle.x, paddle.y, '#0ff', 15); 
        triggerShake(10); return; 
    }
    score = Math.max(0, score - penalty);
    weaponLevel = 1; shieldTimer = 90; 
    updateScore(); triggerShake(20);
    spawnExplosion(paddle.x, paddle.y, '#f00', 30);
}

function triggerShake(intensity = 15) { shakeTime = intensity; }

window.startSpaceGame = function() {
    if(window.scPause) window.scPause(); 
    document.getElementById('game-overlay').style.display = 'none';
    const canvas = document.getElementById('game-canvas');
    if(!canvas) return;
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight - document.getElementById('game-header').offsetHeight;
    
    paddle.x = canvas.width / 2; paddle.y = canvas.height - 80; 
    playerShieldHp = 0; bombs = 3; bombActive = 0; playerScale = 1.0;
    
    score = 0; frameCount = 0; currentAudioSecs = 0; gamePhase = -1;
    enemiesKilled = 0; bossesKilled = 0; massiveFleetSpawned = false; weaponLevel = 1;
    bosses = []; allies = []; blackHole = null; asteroids = []; drops = []; 
    lasers = []; enemyLasers = []; particles = []; powerups = [];
    startPlanetY = canvas.height - 100; endPlanetY = -600;
    
    isGameRunning = true; updateScore();
    if(gameWidget) { gameWidget.seekTo(0); gameWidget.play(); }
    gameLoop();
};

function showGameOver(msg) {
    isGameRunning = false; cancelAnimationFrame(gameAnim); if(gameWidget) gameWidget.pause();
    
    // GUARDADO DE HIGH SCORE
    let isNewRecord = false;
    if(score > highScore) {
        highScore = score;
        localStorage.setItem('dematinale_highscore', highScore);
        isNewRecord = true;
    }

    let recordMsg = isNewRecord 
        ? `<span style="color:#0ff; font-size:18px; font-weight:bold;">¡NUEVO RECORD MUNDIAL!</span>` 
        : `<span style="font-size:14px; color:#aaa;">RECORD ACTUAL: ${highScore}</span>`;

    document.getElementById('game-msg').innerHTML = `
        <span style="color:#0f0; font-size:16px;">${msg}</span><br><br>
        ${recordMsg}<br><br>
        <span style="font-size:32px; color:#ff0; text-shadow: 2px 2px #f00;">SCORE: ${score}</span><br><br>
        <span style="font-size:12px; color:#fff;">ENEMIGOS DESTRUIDOS: ${enemiesKilled}</span><br>
        <span style="font-size:12px; color:#fff;">JEFES ABATIDOS: ${bossesKilled}</span>
    `;
    document.getElementById('game-btn-start').innerText = "[ JUGAR DE NUEVO ]";
    document.getElementById('game-overlay').style.display = 'flex';
}

window.closeGameWindow = function(e) {
    if(e) e.stopPropagation();
    isGameRunning = false; cancelAnimationFrame(gameAnim); 
    if(gameWidget) gameWidget.pause();
    document.getElementById('game-overlay').style.display = 'flex';
    const canvas = document.getElementById('game-canvas');
    if(canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    window.closeWindow('game-window', e);
};

function gameLoop() {
    if(!isGameRunning) return;
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    if(!canvas || !ctx) return;

    frameCount++;
    ctx.save();
    if(shakeTime > 0) { ctx.translate((Math.random()-0.5)*shakeTime, (Math.random()-0.5)*shakeTime); shakeTime--; }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ESTRELLAS TENUES
    for(let i=0; i<stars.length; i++) {
        let s = stars[i];
        s.y += (s.s * (gamePhase >= 13 ? 18 : 6)); 
        if(s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; } 
        let sz = s.s > 0.7 ? scale : scale/2;
        ctx.fillStyle = s.s > 0.7 ? '#666' : '#333'; 
        ctx.fillRect(s.x, s.y, sz, sz); 
    }

    // --- TIMELINE NARRATIVO Y OLEADAS ---
    let sec = currentAudioSecs;
    if (sec >= 0 && sec < 2 && gamePhase < 0) { gamePhase = 0; showMessage("¡PREPARENSE PARA LO PEOR!"); }
    else if (sec >= 2 && sec < 16 && gamePhase < 1) { gamePhase = 1; showMessage("¡CINTURON DE ASTEROIDES! ¡CUIDADO!"); }
    else if (sec >= 16 && sec < 30 && gamePhase < 2) { gamePhase = 2; showMessage("¡CONTACTO! MÚLTIPLES SEÑALES HOSTILES."); }
    else if (sec >= 30 && sec < 45 && gamePhase < 3) { gamePhase = 3; showMessage("¡ACORAZADOS! ¡EVITEN EL CONTACTO DIRECTO!"); }
    else if (sec >= 45 && sec < 56 && gamePhase < 4) { gamePhase = 4; showMessage("¡ARTILLERIA PESADA! ¡NOS HACEN PEDAZOS!"); }
    else if (sec >= 56 && sec < 89 && gamePhase < 5) { gamePhase = 5; if(bosses.length === 0) spawnBoss(1, canvas); showMessage("¡¡¡EL LEVIATAN!!! ¡QUE ALGUIEN LO DETENGA!"); }
    else if (sec >= 89 && sec < 105 && gamePhase < 6) { 
        gamePhase = 6; 
        bosses.forEach(b => { if(b.state !== 'escaping') { b.state='escaping'; showMessage("¡EL LEVIATAN ESCAPA! ¡NO LO SIGAN!"); } });
        showMessage("¡¡¡LLUVIA MASIVA EN TRAYECTORIA CRUZADA!!!"); 
    }
    else if (sec >= 105 && sec < 120 && gamePhase < 7) { 
        gamePhase = 7; 
        blackHole = { x: canvas.width/2, y: 100, vx: 3.5, vy: 2.5, radius: 0, rot: 0 }; 
        showMessage("¡¡¡ANOMALIA GRAVITATORIA! ESTA CHUPANDO TODO!!!"); 
    }
    else if (sec >= 120 && sec < 148 && gamePhase < 8) { 
        gamePhase = 8; 
        if(blackHole) blackHole = null; // Desaparece
        if(bosses.length === 0) spawnBoss(2, canvas); 
        showMessage("¡¡¡BEHEMOTH!!! ¡TODAS LAS UNIDADES, FUEGO LIBRE!"); 
    }
    else if (sec >= 148 && sec < 152 && gamePhase < 9) { 
        gamePhase = 9; 
        bosses.forEach(b => { if(b.state !== 'escaping') { b.state='escaping'; showMessage("¡BEHEMOTH SE RETIRA! ¡MANTENGAN POSICIONES!"); } }); 
        showMessage("¡LECTURAS DE ENERGIA CRITICAS!"); 
    }
    else if (sec >= 152 && sec < 172 && gamePhase < 10) { gamePhase = 10; if(bosses.length === 0) spawnBoss(3, canvas); showMessage("¡¡¡ABADDON!!! ¡¡¡NO VAMOS A SOBREVIVIR A ESTO!!!"); }
    else if (sec >= 172 && sec < 185 && gamePhase < 11) { gamePhase = 11; showMessage("¡¡¡AQUI VANGUARDIA!!! ¡¡¡AGUANTEN, LLEGAMOS!!!"); if(allies.length === 0) spawnAllies(canvas, 4, 150); }
    else if (sec >= 185 && sec < 198 && gamePhase < 12) { 
        gamePhase = 12; 
        if(!massiveFleetSpawned) { spawnAllies(canvas, 10, 300); massiveFleetSpawned = true; }
        showMessage("¡¡¡FLOTA MASIVA AL RESCATE!!! ¡¡¡HAGANLOS ARDER!!!"); 
    }
    else if (sec >= 198 && sec < 202 && gamePhase < 13) { 
        gamePhase = 13; showMessage("¡¡¡EL ENEMIGO HUYE!!! ¡HEMOS VENCIDO!"); 
        asteroids = []; 
        bosses.forEach(b => { if(b.state !== 'escaping') { b.state='escaping'; } }); 
    }
    else if (sec >= 202 && gamePhase < 14) { gamePhase = 14; showMessage("INICIANDO SECUENCIA DE ATERRIZAJE AUTOMATICO."); }

    // PLANETAS
    if(gamePhase <= 1) { startPlanetY += 1.5; drawPlanet(ctx, canvas.width/2, startPlanetY + 400, 380, ['#003366', '#001133', '#005599']); }
    if(gamePhase >= 12) { endPlanetY += 1.5; drawPlanet(ctx, canvas.width/2, endPlanetY - 400, 380, ['#552200', '#331100', '#884400']); }

    // AGUJERO NEGRO
    if(blackHole) {
        blackHole.radius = Math.min(80, blackHole.radius + 1.0); 
        blackHole.rot += 0.4;
        blackHole.x += blackHole.vx; blackHole.y += blackHole.vy;
        if(blackHole.x < 100 || blackHole.x > canvas.width - 100) blackHole.vx *= -1;
        if(blackHole.y < 100 || blackHole.y > canvas.height/2 + 100) blackHole.vy *= -1;

        ctx.save(); ctx.translate(blackHole.x, blackHole.y); ctx.rotate(blackHole.rot);
        for(let i=0; i<4; i++) {
            ctx.strokeStyle = i % 2 === 0 ? '#fff' : '#a0f'; ctx.lineWidth = scale;
            ctx.strokeRect(-blackHole.radius - i*16, -blackHole.radius - i*16, (blackHole.radius + i*16)*2, (blackHole.radius + i*16)*2);
        }
        ctx.restore();
        drawPixelCircle(ctx, blackHole.x, blackHole.y, blackHole.radius, '#000');
        
        let dx = blackHole.x - paddle.x; let dy = blackHole.y - paddle.y;
        let dist = Math.hypot(dx, dy);
        if(dist > 10 && dist < 900) {
            let force = 120 / dist; 
            paddle.x += (dx / dist) * force; 
            paddle.y += (dy / dist) * force;
        }
        if(dist < blackHole.radius + 15) { score = Math.max(0, score - 30); updateScore(); triggerShake(5); }
    }

    // JUGADOR MOVEMENT Y ATERRIZAJE CÁMARA LENTA
    if(gamePhase < 14) {
        let speed = 9;
        if(keys.ArrowLeft) paddle.x -= speed; if(keys.ArrowRight) paddle.x += speed;
        if(keys.ArrowUp) paddle.y -= speed; if(keys.ArrowDown) paddle.y += speed;
        paddle.x = Math.max(30, Math.min(canvas.width - 30, paddle.x));
        paddle.y = Math.max(30, Math.min(canvas.height - 30, paddle.y));
    } else {
        let targetX = canvas.width / 2; let targetY = endPlanetY - 400; 
        paddle.x += (targetX - paddle.x) * 0.03; paddle.y += (targetY - paddle.y) * 0.03; 
        if(Math.hypot(targetX - paddle.x, targetY - paddle.y) < 200) {
            playerScale = Math.max(0, playerScale - 0.005); 
            if(playerScale === 0) showGameOver("¡MISION CUMPLIDA. SOBREVIVISTE AL CAOS TOTAL!");
        }
    }

    // DIBUJAR JUGADOR Y ESCUDO 
    if(!(shieldTimer > 0 && shieldTimer % 10 < 5) && playerScale > 0) {
        let playerPal = shieldTimer > 0 ? ['#ff0', '#a80', '#fff'] : palPlayer;
        drawSprite(ctx, playerSprite, paddle.x, paddle.y, playerPal, 0, scale * playerScale);
        
        if(playerShieldHp > 0 && playerScale === 1.0) {
            drawHollowPixelCircle(ctx, paddle.x, paddle.y, 45, '#0ff', scale);
            if(playerShieldHp > 1) drawHollowPixelCircle(ctx, paddle.x, paddle.y, 50, '#fff', scale);
        }
        if(frameCount % 4 < 2 && playerScale === 1.0) { 
            ctx.fillStyle='#ff0'; ctx.fillRect(paddle.x-scale, paddle.y+scale*2, scale*2, scale); 
            ctx.fillStyle='#f00'; ctx.fillRect(paddle.x-scale, paddle.y+scale*3, scale*2, scale); 
        }
    }
    if(shieldTimer > 0) shieldTimer--;

    // ONDA EXPANSIVA BOMBA (Nerfeo contra jefes)
    if(bombActive > 0) {
        let r = (30 - bombActive) * 40; 
        drawHollowPixelCircle(ctx, paddle.x, paddle.y, r, '#fff', scale*3);
        drawHollowPixelCircle(ctx, paddle.x, paddle.y, r-15, '#0ff', scale*2);
        
        drops.forEach((d, i) => { 
            if(Math.hypot(d.x-paddle.x, d.y-paddle.y) < r) { 
                d.hp -= 20; d.hitFlash = 5; 
                if(d.hp <= 0) { score += d.type*100; enemiesKilled++; spawnExplosion(d.x, d.y, getEnemyPal(d.type)); drops.splice(i, 1); }
            } 
        });
        
        bosses.forEach(b => { 
            if(Math.hypot(b.x-paddle.x, b.y-paddle.y) < r) { 
                b.hp -= (b.type === 2 ? 0.5 : 2); 
                b.hitFlash = 2; 
            } 
        });
        enemyLasers = enemyLasers.filter(el => Math.hypot(el.x-paddle.x, el.y-paddle.y) > r); 
        bombActive--;
    }

    // ALIADOS
    for(let i=allies.length-1; i>=0; i--){
        let a = allies[i];
        if(a.state === 'entering') {
            a.y -= 10; if(a.y < a.targetY) a.state = 'fighting';
        } else if (gamePhase >= 14) { 
            let targetX = canvas.width / 2; let targetY = endPlanetY - 400;
            a.x += (targetX - a.x) * 0.015; a.y += (targetY - a.y) * 0.015;
        } else { a.y += Math.sin(frameCount*0.05 + i) * 1.5; }
        
        if(playerScale > 0) drawSprite(ctx, allySprite, a.x, a.y, palAlly, 0, scale * playerScale);
        
        if(a.shield > 0 && playerScale === 1.0) drawHollowPixelCircle(ctx, a.x, a.y, 40, '#0fa', scale/2);
        if(frameCount % 4 < 2 && playerScale === 1.0) { ctx.fillStyle='#ff0'; ctx.fillRect(a.x-scale, a.y+scale*2, scale*2, scale); }
        if(frameCount % 30 === 0 && a.state === 'fighting' && gamePhase < 13) lasers.push({ x: a.x, y: a.y - 20, vx: 0, vy: -20, fromAlly: true });
        
        if(gamePhase < 13 && Math.random() < 0.02) a.shield -= 5;
        if(a.shield <= 0 && Math.random() < 0.01) { spawnExplosion(a.x, a.y, palAlly, 40); shakeTime=8; allies.splice(i,1); }
    }

    // DISPARO JUGADOR
    let isRetreating = (gamePhase >= 13);
    if(currentAudioSecs >= 2 && !isRetreating && playerScale === 1.0 && frameCount % (weaponLevel === 3 ? 6 : 10) === 0) {
        if(weaponLevel === 1) lasers.push({ x: paddle.x, y: paddle.y - 20, vx: 0, vy: -20 });
        else if (weaponLevel === 2) { lasers.push({ x: paddle.x-15, y: paddle.y-15, vx:0, vy:-20 }, { x: paddle.x+15, y: paddle.y-15, vx:0, vy:-20 }); }
        else { lasers.push({ x: paddle.x, y: paddle.y-20, vx:0, vy:-20 }, { x: paddle.x-15, y: paddle.y-15, vx:-4, vy:-18 }, { x: paddle.x+15, y: paddle.y-15, vx:4, vy:-18 }); }
    }
    
    ctx.fillStyle = '#fff';
    for(let i=lasers.length-1; i>=0; i--) {
        lasers[i].x += lasers[i].vx; lasers[i].y += lasers[i].vy;
        ctx.fillStyle = lasers[i].fromAlly ? '#0f8' : '#fff'; 
        ctx.fillRect(lasers[i].x-scale/2, lasers[i].y-scale, scale, scale*3); 
        if(lasers[i].y < -20 || lasers[i].y > canvas.height + 20 || lasers[i].x < -20 || lasers[i].x > canvas.width + 20) lasers.splice(i,1);
    }

    // ASTEROIDES DIAGONALES 
    if((gamePhase === 1 || gamePhase === 6) && Math.random() < (gamePhase === 6 ? 0.25 : 0.08)) {
        let spawnSide = Math.random(); let ax, ay, avx, avy;
        if(gamePhase === 6) { 
            if(spawnSide < 0.33) { ax = -50; ay = Math.random()*(canvas.height/2); avx = 4 + Math.random()*3; avy = 3+Math.random()*4; } 
            else if(spawnSide < 0.66) { ax = canvas.width+50; ay = Math.random()*(canvas.height/2); avx = -4 - Math.random()*3; avy = 3+Math.random()*4; } 
            else { ax = Math.random()*canvas.width; ay = -50; avx = (Math.random()-0.5)*5; avy = 5+Math.random()*5; } 
        } else {
            ax = Math.random()*canvas.width; ay = -50; avx = 0; avy = 4+Math.random()*6;
        }
        asteroids.push({ 
            x: ax, y: ay, vx: avx, vy: avy, rot: 0, rotS: (Math.random()-0.5)*0.3, size: 6+Math.random()*4, shape: asteroidShapes[Math.floor(Math.random()*asteroidShapes.length)], hp: 8 
        });
    }

    for(let i=asteroids.length-1; i>=0; i--) {
        let a = asteroids[i]; a.y += a.vy; a.x += a.vx; a.rot += a.rotS;
        let aPal = a.hitFlash > 0 ? ['#fff','#fff','#fff'] : palAst; if(a.hitFlash>0) a.hitFlash--;
        drawSprite(ctx, a.shape, a.x, a.y, aPal, a.rot, a.size);
        
        if(gamePhase === 6) { 
            for(let di=drops.length-1; di>=0; di--){
                if(Math.hypot(a.x-drops[di].x, a.y-drops[di].y) < a.size*scale) { score+=50; spawnExplosion(drops[di].x, drops[di].y, getEnemyPal(drops[di].type)); drops.splice(di, 1); enemiesKilled++; }
            }
        }
        for(let j=lasers.length-1; j>=0; j--) {
            if(Math.hypot(lasers[j].x-a.x, lasers[j].y-a.y) < a.size*scale*0.8) { 
                a.hp--; a.hitFlash = 3; lasers.splice(j,1); 
                if(a.hp<=0){ score+=250; updateScore(); spawnExplosion(a.x,a.y,palAst,20); asteroids.splice(i,1); break;} 
            }
        }
        if(asteroids[i] && Math.hypot(paddle.x-a.x, paddle.y-a.y) < a.size*scale*0.7) { takeHit(600); asteroids.splice(i,1); }
        else if(a.y > canvas.height + 50 || a.x < -100 || a.x > canvas.width + 100) asteroids.splice(i,1);
    }

    // OLEADAS DE ENEMIGOS 
    let activeEnemyTypes = [];
    if(gamePhase === 2) activeEnemyTypes = [1, 5]; 
    else if(gamePhase === 3) activeEnemyTypes = [2, 1]; 
    else if(gamePhase === 4) activeEnemyTypes = [3, 4]; 
    else if(gamePhase === 5 && bosses.length === 0) activeEnemyTypes = [1, 4, 5]; 
    else if(gamePhase === 8 && bosses.length === 0) activeEnemyTypes = [2, 3, 6]; 
    else if(gamePhase === 10 && bosses.length === 0) activeEnemyTypes = [1, 2, 3, 4, 5, 6]; 
    else if(gamePhase === 7) activeEnemyTypes = [4, 5, 6]; 
    else if(gamePhase === 10 || gamePhase === 11) activeEnemyTypes = [1, 2, 3, 4, 5, 6]; 

    let spawnCap = (gamePhase === 10 || gamePhase === 11) ? 25 : 12; 
    let spawnChance = (gamePhase === 10 || gamePhase === 11) ? 0.2 : 0.05; 

    if(activeEnemyTypes.length > 0 && Math.random() < spawnChance && drops.length < spawnCap) { 
        let type = activeEnemyTypes[Math.floor(Math.random()*activeEnemyTypes.length)];
        let hp = (type===2?15:(type===3?6:(type===4?4:(type===6?5:2)))); 
        let sprite = type===1 ? enemyBasic : (type===2 ? enemyTank : (type===3 ? enemyShooter : (type===4 ? enemyKamikaze : (type===5 ? enemySwarm : enemyAngel))));
        let vx = (type===1 || type===3) ? (Math.random() > 0.5 ? 3 : -3) : 0;
        drops.push({ x: Math.random()*(canvas.width-60)+30, y: -40, type: type, vy: 3, vx: vx, hp: hp, sprite: sprite, hitFlash: 0, aliveTime: 0, visible: true });
    }

    for(let i=drops.length-1; i>=0; i--) {
        let d = drops[i]; d.aliveTime++; 
        
        if(gamePhase >= 13) { 
            d.vy -= 0.2; d.y += d.vy; d.x += d.vx;
        } else {
            if(d.type === 2) { d.x += (paddle.x - d.x) * 0.015; d.y += d.vy * 0.7; } 
            else if(d.type === 4) { d.x += (paddle.x - d.x) * 0.045; d.y += 6.5; } 
            else if(d.type === 5) { d.y += 9; d.x += Math.sin(d.aliveTime*0.3)*10; } 
            else if(d.type !== 6) { d.x += d.vx; if(d.x < 30 || d.x > canvas.width - 30) d.vx *= -1; d.y += d.vy; }
            
            if(d.type === 3 && d.aliveTime % 60 === 0) enemyLasers.push({ x: d.x, y: d.y + 20, vx: 0, vy: 8 });
            
            if(d.type === 6) { 
                if(d.aliveTime % 160 < 80) { d.visible = true; d.y += d.vy; } 
                else if (d.aliveTime % 160 === 80) { d.visible = false; spawnGlow(d.x, d.y, '#0ff'); d.x = paddle.x + (Math.random()-0.5)*300; d.y = paddle.y - 250; }
                else if (d.aliveTime % 160 === 159) { spawnGlow(d.x, d.y, '#fff'); } 
            }
        }

        if(d.visible) {
            let ePal = d.hitFlash > 0 ? ['#fff','#fff','#fff'] : getEnemyPal(d.type);
            drawSprite(ctx, d.sprite, d.x, d.y, ePal);
            if(d.hitFlash > 0) d.hitFlash--;
            for(let j=lasers.length-1; j>=0; j--){
                if(Math.hypot(lasers[j].x-d.x, lasers[j].y-d.y) < 35) {
                    d.hp--; d.hitFlash = 3; lasers.splice(j,1); score += 30; updateScore();
                    if(d.hp <= 0) { 
                        score += d.type*200; enemiesKilled++; updateScore(); spawnExplosion(d.x, d.y, ePal, 25); 
                        if(Math.random()<0.1) { powerups.push({x:d.x, y:d.y, color: Math.random()>0.5 ? '#fff' : '#00f'}); }
                        drops.splice(i,1); break; 
                    }
                }
            }
            if(drops[i] && Math.hypot(paddle.x-d.x, paddle.y-d.y) < 35) { takeHit(300); drops.splice(i,1); }
        }
        if(drops[i] && (d.y > canvas.height + 100 || d.y < -300)) drops.splice(i,1);
    }

    // JEFES MASIVOS
    for(let i=bosses.length-1; i>=0; i--) {
        let b = bosses[i];
        if(b.state === 'entering') { b.y += 1.5; if(b.y > 180) { b.state = 'fighting'; b.startX = b.x; b.fightFrame = 0;} }
        else if(b.state === 'escaping') { b.y -= 4; if(b.y < -400) bosses.splice(i,1); }
        else {
            b.fightFrame++;
            if(b.type === 1) { 
                b.x = b.startX + Math.sin(b.fightFrame * 0.015) * (canvas.width/2 - 180); 
                if(b.fightFrame % 60 === 0) enemyLasers.push({ x: b.x, y: b.y+80, vx: 0, vy: 8 }, { x: b.x-80, y: b.y+70, vx: -4, vy: 7 }, { x: b.x+80, y: b.y+70, vx: 4, vy: 7 });
            } else if (b.type === 2) { 
                b.x = b.startX + Math.sin(b.fightFrame * 0.02) * (canvas.width/2 - 180);
                b.y = 180 + Math.sin(b.fightFrame * 0.05) * 80;
                if(b.fightFrame % 45 === 0) {
                    let dx = paddle.x - b.x; let dy = paddle.y - b.y; let dist = Math.hypot(dx, dy);
                    enemyLasers.push({ x: b.x, y: b.y+60, vx: (dx/dist)*9, vy: (dy/dist)*9 });
                }
            } else if (b.type === 3) { 
                b.x = b.startX + Math.sin(b.fightFrame * 0.01) * 150;
                if(b.fightFrame % 70 === 0) {
                    for(let k=-5; k<=5; k+=2.5) enemyLasers.push({ x: b.x + (k*15), y: b.y+80, vx: k*1.5, vy: 7 });
                }
            }
        }
        if(bosses[i]){
            let bPal = b.hitFlash > 0 ? ['#fff','#fff','#fff'] : b.palette;
            drawSprite(ctx, b.sprite, b.x, b.y, bPal, 0, scale * 3.5); 
            if(b.hitFlash > 0) b.hitFlash--;
            
            ctx.fillStyle = '#333'; ctx.fillRect(canvas.width/2 - 200, 15 + i*20, 400, 10);
            ctx.fillStyle = bPal[0]; ctx.fillRect(canvas.width/2 - 200, 15 + i*20, 400 * (b.hp/b.maxHp), 10);

            for(let j=lasers.length-1; j>=0; j--){
                if(Math.hypot(lasers[j].x-b.x, lasers[j].y-b.y) < 150) { 
                    b.hp--; b.hitFlash = 2; lasers.splice(j,1); score += 80; updateScore(); 
                    if(b.hp <= 0) { 
                        score += b.type*15000; bossesKilled++; updateScore(); 
                        spawnExplosion(b.x, b.y, bPal, 120); triggerShake(30); 
                        showMessage("¡¡¡" + b.name + " ANIQUILADO!!!"); bosses.splice(i,1); break; 
                    }
                }
            }
        }
    }

    // LASERES ENEMIGOS
    ctx.fillStyle = '#ff0';
    for(let i=enemyLasers.length-1; i>=0; i--){
        let el = enemyLasers[i]; el.y += el.vy; el.x += el.vx; ctx.fillRect(el.x-scale/2, el.y-scale/2, scale, scale*2); 
        if(Math.hypot(paddle.x-el.x, paddle.y-el.y) < 20 && playerScale === 1.0) { takeHit(300); enemyLasers.splice(i,1); }
        else if(el.y > canvas.height) enemyLasers.splice(i,1);
    }

    // POWERUPS
    for(let i=powerups.length-1; i>=0; i--){
        let p = powerups[i]; p.y += 2.5; 
        let floatY = p.y + Math.sin(frameCount * 0.1) * 5;
        
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.2) * 0.3;
        drawPixelCircle(ctx, p.x, floatY, 25, p.color); ctx.globalAlpha = 1.0; 
        let pPal = p.color === '#00f' ? ['#0cf', '#005', '#fff'] : (p.color === '#ff0' ? ['#ff0', '#a80', '#fff'] : ['#fff', '#aaa', '#eee']);
        drawSprite(ctx, powerupSprite, p.x, floatY, pPal, 0, scale * 1.5);

        if(Math.hypot(paddle.x-p.x, paddle.y-p.y) < 40 && playerScale === 1.0) {
            if(p.color === '#fff') playerShieldHp = 3; 
            else if(p.color === '#00f') weaponLevel = Math.min(3, weaponLevel+1); 
            else shieldTimer = 350; 
            score += 1500; updateScore(); spawnExplosion(p.x,floatY,pPal, 15); powerups.splice(i,1);
        } else if(p.y > canvas.height) powerups.splice(i,1);
    }

    // PARTICULAS
    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
        if(p.life % 2 === 0 || p.life % 3 === 0) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, scale, scale); }
        if(p.life <= 0) particles.splice(i,1);
    }

    // MENSAJES BLANCOS Y GRANDES
    if(overlayTimer > 0) {
        ctx.fillStyle = '#fff'; ctx.textAlign = "center"; ctx.font = "24px 'Press Start 2P'";
        ctx.fillText(overlayMsg, canvas.width/2, 120); overlayTimer--;
    }

    ctx.restore(); 
    if(isGameRunning) gameAnim = requestAnimationFrame(gameLoop);
}