const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

// ladataan kuvat hahmolle, esteelle ja taustalle
const dogImg = new Image();
dogImg.src = '/models/1.png'; 
const poopImg = new Image();
poopImg.src = '/models/poop.png';
const bgImg = new Image();
bgImg.src = '/background.jpg'; // taustakuvan polku

// hahmon tiedot
let groundY = 365; // maanpinnan korkeus
let dog = {x: 80, y: groundY - 50, width: 85, height: 90, dy: 0, jumping: false}; // varmista että hahmo ei ole maan alla

// taustakuvan tiedot
let bgX = 0; // taustakuvan x-sijainti
let bgSpeed = 2; // taustakuvan vierimisnopeus

// esteet
let poopArray = [];
let poopWidth = 30;
let poopHeight = 30;
let poopSpeed = 2;
let gameRunning = true;
let poopTimer; // viittaus ajastimeen
let animationFrameId; // viittaus requestAnimationFrameen

// fysiikka
let gravity = 0.1;
let jumpForce = -5.5;

// esteen generointi
function spawnPoop() {
    let poop = {
        x: canvas.width,
        y: groundY - poopHeight,
        width: poopWidth,
        height: poopHeight,
    };
    poopArray.push(poop);
}

// hahmon piirto
function drawCharacter() {
    ctx.drawImage(dogImg, dog.x, dog.y, dog.width, dog.height);
}

// esteen piirto
function drawPoop() {
    poopArray.forEach(poop => {
        ctx.drawImage(poopImg, poop.x, poop.y, poop.width, poop.height);
    });
}

// taustan piirto
function drawBackground(){
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height); // ensimmäinen taustakuva
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height); // toinen taustakuva

    // taustakuvan liikutus vasemmalle
    bgX -= bgSpeed;

    // jos ensimmäinen taustakuva on kokonaan vasemmalla ulkona ruudusta, nollataan sijainti
    if (bgX <= -canvas.width){
        bgX = 0;
    }
}

// pelin päivitys
function update() {
    if (!gameRunning) return;

    // lisätään painovoima
    dog.dy += gravity;
    dog.y += dog.dy;

    // estetään maan läpi putoaminen
    if (dog.y + dog.height >= groundY) {
        dog.y = groundY - dog.height;
        dog.jumping = false;
    }

    // esteiden liike
    poopArray.forEach(poop => {
        poop.x -= poopSpeed;
    });

    // poistetaan esteet, jotka ovat menneet ruudun ulkopuolelle
    poopArray = poopArray.filter(poop => poop.x + poop.width > 0);

    // törmäyksen tarkistus
    poopArray.forEach(poop => {
        if (dog.x < poop.x + poop.width &&
            dog.x + dog.width > poop.x &&
            dog.y < poop.y + poop.height &&
            dog.y + dog.height > poop.y) {
            gameRunning = false;
            restartButton.style.display = 'block'; // näytetään uudelleenkäynnistyspainike
            clearInterval(poopTimer); // pysäytetään ajastin
            cancelAnimationFrame(animationFrameId); // pysäytetään peli
        }
    });
}

// piirtäminen ja päivitys
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // tyhjennetään ruutu

    drawBackground();
    drawCharacter();
    drawPoop();
    update();

    if (gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// hahmon hyppy
function jump() {
    if (!dog.jumping) {
        dog.dy = jumpForce;
        dog.jumping = true;
    }
}

// uudelleenkäynnistä peli
function restartGame() {
    // nollataan hahmon ja esteiden tilat
    poopArray = [];
    dog.x = 80;
    dog.y = groundY - dog.height;
    dog.dy = 0;
    dog.jumping = false; // nollataan hyppyasema

    // nollataan fysiikkamuuttujat, jos ne ovat muuttuneet
    gravity = 0.1;
    jumpForce = -5.5;
    poopSpeed = 2;

    // taustan vieritys nollaus
    bgX = 0;

    gameRunning = true;
    restartButton.style.display = 'none';

    // nollataan ja käynnistetään uusi ajastin
    clearInterval(poopTimer); // pysäytetään vanha ajastin
    poopTimer = setInterval(spawnPoop, 2000); // luodaan uusi este 2 sekunnin välein

    cancelAnimationFrame(animationFrameId); // varmistetaan, että aiempi requestAnimationFrame lopetetaan
    gameLoop();
}

// käynnistetään peli kun kuvat on ladattu
dogImg.onload = () => {
    gameLoop();
    poopTimer = setInterval(spawnPoop, 2000); // luodaan este 2 sekunnin välein alussa
};

// lisätään kuuntelijat
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        jump();
    }
});

restartButton.addEventListener('click', restartGame);
