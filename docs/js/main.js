/* prompt chatgpt */
let joystick = {
    active: false,
    baseX: 0,
    baseY: 0,
    dx: 0,
    dy: 0,
};

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;
document.querySelector("#Inicio").appendChild(canvas);

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreTable = document.getElementById("scoreTable");

let ship, bullets, asteroids, score, lives, lastShot, gameOver;
let keys = {}, touch = { active: false, x: 0, y: 0 };
let mobileShoot = false, isPlaying = false;

let highScores = JSON.parse(localStorage.getItem("highScores")) || [];

function initGame() {
    ship = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        angle: 0,
        radius: 20,
        thrust: { x: 0, y: 0 },
    };
    bullets = [];
    asteroids = createAsteroids(5);
    score = 0;
    lives = 5;
    lastShot = 0;
    gameOver = false;
}

function createAsteroids(count) {
    let list = [];
    for (let i = 0; i < count; i++) {
        let x, y;
        do {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
        } while (Math.hypot(x - ship.x, y - ship.y) < 100);
        list.push({ x, y, dx: Math.random() * 2 - 1, dy: Math.random() * 2 - 1, radius: 30 });
    }
    return list;
}

function shoot() {
    if (Date.now() - lastShot > 300) {
        bullets.push({
            x: ship.x,
            y: ship.y,
            dx: Math.cos(ship.angle) * 6,
            dy: Math.sin(ship.angle) * 6
        });
        lastShot = Date.now();
    }
}

function wrapAround(obj) {
    obj.x = (obj.x + canvas.width) % canvas.width;
    obj.y = (obj.y + canvas.height) % canvas.height;
}

function update() {
    if (!isPlaying || gameOver) return;

    // Joystick: aplicar impulso si se mueve
if (joystick.active) {
    const angle = Math.atan2(joystick.dy, joystick.dx);
    ship.angle = angle;
    ship.thrust.x += Math.cos(angle) * 0.2;
    ship.thrust.y += Math.sin(angle) * 0.2;
}



    if (keys["ArrowLeft"]) ship.angle -= 0.05;
    if (keys["ArrowRight"]) ship.angle += 0.05;
    if (keys["ArrowUp"]) {
        ship.thrust.x += Math.cos(ship.angle) * 0.1;
        ship.thrust.y += Math.sin(ship.angle) * 0.1;
    }
    if (keys["KeyZ"] || mobileShoot) shoot();

    if (touch.active) {
        const dx = touch.x - ship.x;
        const dy = touch.y - ship.y;
        const angle = Math.atan2(dy, dx);
        ship.thrust.x += Math.cos(angle) * 0.05;
        ship.thrust.y += Math.sin(angle) * 0.05;
    }

    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
    ship.thrust.x *= 0.99;
    ship.thrust.y *= 0.99;
    wrapAround(ship);

    bullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
    });
    bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

    asteroids.forEach(a => {
        a.x += a.dx;
        a.y += a.dy;
        wrapAround(a);
    });

    bullets.forEach((b, bi) => {
        asteroids.forEach((a, ai) => {
            if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
                score += 10;
                bullets.splice(bi, 1);
                if (a.radius > 15) {
                    asteroids.push(
                        { ...a, dx: -a.dx, dy: -a.dy, radius: a.radius / 2 },
                        { ...a, dx: a.dy, dy: -a.dx, radius: a.radius / 2 }
                    );
                }
                asteroids.splice(ai, 1);
            }
        });
    });

    asteroids.forEach((a, ai) => {
        if (Math.hypot(ship.x - a.x, ship.y - a.y) < ship.radius + a.radius) {
            lives--;
            asteroids.splice(ai, 1);
            if (lives <= 0) {
                gameOver = true;
                isPlaying = false;
                restartBtn.style.display = "block";

                const name = prompt("¡Juego terminado! Ingresa tu nombre:");
                highScores.push({ name: name || "Anónimo", score });
                highScores.sort((a, b) => b.score - a.score);
                localStorage.setItem("highScores", JSON.stringify(highScores));
                renderScores();
            }
        }
    });

    if (asteroids.length < 5) asteroids.push(...createAsteroids(1));
}

function drawShip(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.strokeStyle = "white";
    ctx.stroke();
    ctx.restore();
}

function renderScores() {
    scoreTable.innerHTML = `<h3>Puntuaciones:</h3><ol>${highScores.slice(0, 5).map(s => `<li>${s.name}: ${s.score}</li>`).join("")}</ol>`;
}

function render() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isPlaying) {
        drawShip(ship.x, ship.y, ship.angle);
        ctx.fillStyle = "white";
        bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.strokeStyle = "gray";
        asteroids.forEach(a => {
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Puntos: ${score}`, 20, 30);
        ctx.fillText(`Vidas: ${lives}`, 20, 60);
    } else if (!gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText("Presiona Iniciar Juego", canvas.width / 2 - 140, canvas.height / 2);
    }

    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("¡Juego Terminado!", canvas.width / 2 - 150, canvas.height / 2);
    }
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}
loop();

startBtn.addEventListener("click", () => {
    startBtn.style.display = "none";
    isPlaying = true;
    initGame();
    renderScores();

    if (canvas.requestFullscreen) canvas.requestFullscreen();
});

restartBtn.addEventListener("click", () => {
    restartBtn.style.display = "none";
    isPlaying = true;
    initGame();
    renderScores();

    if (canvas.requestFullscreen) canvas.requestFullscreen();
});

document.addEventListener("keydown", e => {
    if (isPlaying && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
    }
    keys[e.code] = true;
});
document.addEventListener("keyup", e => keys[e.code] = false);

              // Aplicar tema guardado
              window.onload = () => {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.body.classList.add('dark-mode');
                  document.getElementById('toggle-theme').textContent = '☀️';
                }
              };
              function toggleMenu() {
    const navbar = document.getElementById('navbar');
    navbar.classList.toggle('active');
  }

  const darkToggleBtn = document.getElementById("toggleDarkMode");

// Aplicar modo al cargar la página
const userPref = localStorage.getItem("colorMode");
if (userPref) {
    document.body.classList.add(userPref);
} else {
    // Si no hay preferencia guardada, usar preferencia del sistema
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.add(prefersDark ? "dark-mode" : "light-mode");
}

// Alternar modo
darkToggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("dark-mode")) {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        localStorage.setItem("colorMode", "light-mode");
    } else {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        localStorage.setItem("colorMode", "dark-mode");
    }
});

const joystickBase = document.getElementById("joystick");
const joystickHandle = document.getElementById("joystick-handle");

// Joystick táctil
joystickBase.addEventListener("touchstart", (e) => {
    joystick.active = true;
    const rect = joystickBase.getBoundingClientRect();
    const touch = e.touches[0];
    joystick.baseX = rect.left + rect.width / 2;
    joystick.baseY = rect.top + rect.height / 2;
    moveJoystick(touch.clientX, touch.clientY);
});

joystickBase.addEventListener("touchmove", (e) => {
    if (!joystick.active) return;
    const touch = e.touches[0];
    moveJoystick(touch.clientX, touch.clientY);
});

joystickBase.addEventListener("touchend", () => {
    joystick.active = false;
    joystick.dx = 0;
    joystick.dy = 0;
    joystickHandle.style.transform = `translate(0px, 0px)`;
});

function moveJoystick(x, y) {
    const dx = x - joystick.baseX;
    const dy = y - joystick.baseY;
    const distance = Math.min(Math.hypot(dx, dy), 40);
    const angle = Math.atan2(dy, dx);

    joystick.dx = Math.cos(angle) * (distance / 40); // Normalizado entre 0 y 1
    joystick.dy = Math.sin(angle) * (distance / 40);

    joystickHandle.style.transform = `translate(${joystick.dx * 40}px, ${joystick.dy * 40}px)`;
}

// Botón de disparo táctil
const mobileFireBtn = document.getElementById("mobileFire");

mobileFireBtn.addEventListener("touchstart", () => {
    mobileShoot = true;
});
mobileFireBtn.addEventListener("touchend", () => {
    mobileShoot = false;
});
