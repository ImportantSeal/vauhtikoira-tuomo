const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

// Ladataan kuvat hahmolle ja esteelle
const dogImg = new Image();
dogImg.src = '/models/1.png'; 
const poopImg = new Image();
poopImg.src = '/models/poop.png';

// Hahmon tiedot
let groundY = 250; // Maanpinnan korkeus
let dog = {x: 50, y: groundY - 50, width: 45, height: 50, dy: 0, jumping: false}; // Varmista että hahmo ei ole maan alla

// Esteet
let poopArray = [];
let poopWidth = 20;
let poopHeight = 20;
let poopSpeed = 1;
let gameRunning = true;
let poopTimer; // Viittaus ajastimeen
let animationFrameId; // Viittaus requestAnimationFrameen

// Fysiikka
let gravity = 0.1;
let jumpForce = -7;

// Esteen generointi
function spawnPoop() {
    let poop = {
        x: canvas.width,
        y: groundY - poopHeight,
        width: poopWidth,
        height: poopHeight,
    };
    poopArray.push(poop);
}

// Hahmojen piirto
function drawCharacter() {
    ctx.drawImage(dogImg, dog.x, dog.y, dog.width, dog.height);
}

function drawPoop() {
    poopArray.forEach(poop => {
        ctx.drawImage(poopImg, poop.x, poop.y, poop.width, poop.height);
    });
}

// Pelin päivitys
function update() {
    if (!gameRunning) return;

    // Lisätään painovoima
    dog.dy += gravity;
    dog.y += dog.dy;

    // Estetään maan läpi putoaminen
    if (dog.y + dog.height >= groundY) {
        dog.y = groundY - dog.height;
        dog.jumping = false;
    }

    // Esteiden liike
    poopArray.forEach(poop => {
        poop.x -= poopSpeed;
    });

    // Poistetaan esteet, jotka ovat menneet ruudun ulkopuolelle
    poopArray = poopArray.filter(poop => poop.x + poop.width > 0);

    // Törmäyksen tarkistus
    poopArray.forEach(poop => {
        if (dog.x < poop.x + poop.width &&
            dog.x + dog.width > poop.x &&
            dog.y < poop.y + poop.height &&
            dog.y + dog.height > poop.y) {
            gameRunning = false;
            restartButton.style.display = 'block'; // Näytetään uudelleenkäynnistyspainike
            clearInterval(poopTimer); // Pysäytetään ajastin
            cancelAnimationFrame(animationFrameId); // Pysäytetään peli
        }
    });
}

// Piirtäminen ja päivitys
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Tyhjennetään ruutu

    drawCharacter();
    drawPoop();
    update();

    if (gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Hahmon hyppy
function jump() {
    if (!dog.jumping) {
        dog.dy = jumpForce;
        dog.jumping = true;
    }
}

// Uudelleenkäynnistä peli
function restartGame() {
    // Nollataan hahmon ja esteiden tilat
    poopArray = [];
    dog.x = 50;
    dog.y = groundY - dog.height;
    dog.dy = 0;
    dog.jumping = false; // Nollataan hyppyasema

    // Nollataan fysiikkamuuttujat, jos ne ovat muuttuneet
    gravity = 0.15;
    jumpForce = -6;
    poopSpeed = 1;

    gameRunning = true;
    restartButton.style.display = 'none';

    // Nollataan ja käynnistetään uusi ajastin
    clearInterval(poopTimer); // Pysäytetään vanha ajastin
    poopTimer = setInterval(spawnPoop, 2000); // Luodaan uusi este 2 sekunnin välein

    cancelAnimationFrame(animationFrameId); // Varmistetaan, että aiempi requestAnimationFrame lopetetaan
    gameLoop();
}

// Käynnistetään peli kun kuvat on ladattu
dogImg.onload = () => {
    gameLoop();
    poopTimer = setInterval(spawnPoop, 2000); // Luodaan este 2 sekunnin välein alussa
};

// Lisätään kuuntelijat
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        jump();
    }
});

restartButton.addEventListener('click', restartGame);
