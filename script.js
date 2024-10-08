const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const playButton = document.getElementById('playButton');
const backgroundMusic = document.getElementById('backgroundMusic');

let lastFrameTime = 0; // Muuttuja, joka pitää edellisen ruudun ajan

// restart-nappi piilotetaan varmuuden vuoksi heti sivun latauksen alussa
restartButton.style.display = 'none';

// ladataan kuvat hahmolle, esteelle ja taustalle
const dogImg = new Image();
dogImg.src = 'models/tuomo_lowreso.png'; 
const laserDogImg = new Image();
laserDogImg.src = 'models/tuomo_laser.png';
const poopImg = new Image();
poopImg.src = 'models/poop.png';
const bgImg = new Image();
bgImg.src = 'map.jpg'; 
const boneImg = new Image();
boneImg.src= 'models/bone.png';
const waspImg = new Image();
waspImg.src= 'models/wasp.png';
const laserEyesImg = new Image();
laserEyesImg.src = 'models/tuomo_laser_eyes.png'; 


// tuomon juoksemis kuvat
const tuomoRunImages = [
    new Image(),
    new Image(),
    new Image(),
    new Image()
];
tuomoRunImages[0].src = 'models/tuomo_lowreso.png'; 
tuomoRunImages[1].src = 'models/tuomo_lowreso1.png';
tuomoRunImages[2].src = 'models/tuomo_lowreso2.png';
tuomoRunImages[3].src = 'models/tuomo_lowreso3.png';

// Variables to control animation speed
let currentFrame = 0;
const totalFrames = tuomoRunImages.length;
const animationSpeed = 100; // Time (ms) between frames
let lastFrameChangeTime = 0;

// hahmon tiedot
let showingLaserEyes = false;  
let groundY = 360; // Maanpinnan korkeus
let dog = {x: 80, y: groundY - 50, width: 100, height: 100, dy: 0, jumping: false}; // Varmista että hahmo ei ole maan alla
let currentDogImg = dogImg;  // aluksi käytetään normaalia kuvaa

// taustakuvan tiedot
let bgX = 0; // taustakuvan x-sijainti
let bgSpeed = 400; // taustakuvan vierimisnopeus

// kakan tiedot
let poopArray = [];
let poopWidth = 30;
let poopHeight = 30;
let poopSpeed = 400;
let gameRunning = true;
let gameStarted = false;
let poopTimer; // viittaus ajastimeen
let animationFrameId; // biittaus requestAnimationFrameen
let gameTimer; // ajastimen laskenta
let timeElapsed = 0; // ajastin (sekunteina)
let showInGameScore = true;

// luun tiedot
let boneArray = []; 
let boneWidth = 30;
let boneHeight = 30;
let boneSpeed = 400;
let boneTimer;
let bonePoints = 10; // pisteet, jotka saadaan luusta

// ampiaisen tiedot
let waspArray = [];
let waspWidth = 40;
let waspHeight = 40;
let waspSpeed = 600;
let waspTimer;

// laser
let laserArray = []; // lasereille oma taulukko
let laserSpeed = 1000; // lasereiden nopeus
let lastShotTime = 0;  // aika, jolloin viimeinen laser ammuttiin
const laserCooldown = 300;  // cooldown-aika millisekunteina

// fysiikka
let gravity = 0.1;
let jumpForce = -5.5;

// min ja max kakkojen esiintymisajat millisekuntteina
let minPoopInterval = 700;
let maxPoopInterval = 3000;

// min ja max ampiaisten esiintymisajat millisekuntteina
let minWaspInterval = 1100;
let maxWaspInterval = 10000;


// ajastimen käynnistys
function startTimer(){
    gameTimer = setInterval(() => {
        timeElapsed++;
    }, 1000); // Lisätään sekuntti
}

// ajastimen pysäytys
function stopTimer(){
    clearInterval(gameTimer);
}

// pisteiden näyttäminen pelin lopussa
function displayScore() {
    ctx.font = '40px Franklin Gothic Medium'; 
    ctx.fillStyle = '#ff00ff';   
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00ff';  
    ctx.shadowBlur = 15;  
    ctx.shadowColor = 'transparent'; // Poista varjon väri

    ctx.fillText('Pisteet: ' + timeElapsed, canvas.width / 2, 50);
}


// satunnaisten intervallien generoiminen
function randomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// satunnaisten intervallien generoiminen luille(harvemmin kuin kakat)
function randomBoneInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min); 
}

// esteen eli kakan generointi
function spawnPoop() {
    let poop = {
        x: canvas.width,
        y: groundY - poopHeight,
        width: poopWidth,
        height: poopHeight,
    };
    poopArray.push(poop);
    // kun kakka on luotu, asetetaan uusi satunnainen ajastin seuraavalle kakalle
    scheduleNextPoop();
}

// luun generointi
function spawnBone() {
    let bone = {
        x: canvas.width,
        // satunnainen korkeus maalla tai ilmassa
        y: groundY - boneHeight - (Math.random() < 0.5 ? 0 : 100), // joko maassa tai ilmassa
        width: boneWidth,
        height: boneHeight
    };
    boneArray.push(bone);
    scheduleNextBone(); // asetetaan seuraavan luun luonti
}

// ampiaisen generointi
function spawnWasp(){
    let wasp = {
        x: canvas.width,
        y: groundY - waspHeight - (Math.random() * 50 + 100), // Ampiainen ilmestyy random px+px korkeudelle
        width: waspWidth,
        height: waspHeight,
    };
    waspArray.push(wasp);
    //kun ampiainen on luotu asetetaan uusi satunnainen ajastin seuraavalla ampiaiselle
    scheduleNextWasp();
}

// lasereiden generointi ja ammunta 
function shootLaser() {
    const currentTime = Date.now();  // hae nykyinen aika

    // tarkista, onko viimeisen laukaisun jälkeen kulunut tarpeeksi aikaa
    if (currentTime - lastShotTime >= laserCooldown) {
        let laser = {
            x: dog.x + dog.width,  // Laserin lähtöpaikka koiran silmistä
            y: dog.y + dog.height / 7,
            width: 100,
            height: 5,
            color: 'red'
        };
        laserArray.push(laser);  // lisätään uusi laser taulukkoon
        lastShotTime = currentTime;  // päivitetään viimeinen ampumisaika

        laserSound.currentTime = 0; // äänitiedoston nollaus, jotta se voidaan soittaa useita kertoja peräkkäin
        laserSound.play();
          
        //nätetään laser silmät hetkellisesti
        showingLaserEyes = true;
        setTimeout(() => {
            showingLaserEyes = false;  
        }, 150);
    }
}

// seuraava kakka asetetaan satunnaisella aikavälillä
function scheduleNextPoop() {
    const interval = randomInterval(minPoopInterval, maxPoopInterval);
    poopTimer = setTimeout(spawnPoop, interval); // Käytetään setTimeouttia intervallin sijasta
}

// seuraava luu asetetaan satunnailella aikavälillä
function scheduleNextBone() {
    const interval = randomBoneInterval(5000, 10000); // luut ilmestyvät harvemmin kuin kakat
    boneTimer = setTimeout(spawnBone, interval);
}

// seuraava ampiainen asetetaan satunnaisella aikavälillä
function scheduleNextWasp() {
    const interval = randomInterval(minWaspInterval, maxWaspInterval);
    waspTimer = setTimeout(spawnWasp, interval);
}

// hahmon piirto
function drawCharacter(deltaTime) {
    // päivitetään animaation framejen indeksi
    lastFrameChangeTime += deltaTime * 1000; 
    if (lastFrameChangeTime > animationSpeed) {
        currentFrame = (currentFrame + 1) % totalFrames; // siirrytään seuraavaan ruutuun
        lastFrameChangeTime = 0; // nollataan ajastin ruudun vaihtamisen jälkeen
    }

    // piirretään nykyinen ruutu juoksevaan animaatioon
    ctx.drawImage(tuomoRunImages[currentFrame], dog.x, dog.y, dog.width, dog.height);

    // piirretään laser-silmät juoksevan hahmon päälle, jos laser on ammuttu
    if (showingLaserEyes) {
        ctx.drawImage(laserEyesImg, dog.x, dog.y, dog.width, dog.height); // piirretään laser-silmät nykyisen kuvan päälle
    }
}




// kaka piirto
function drawPoop() {
    poopArray.forEach(poop => {
        ctx.drawImage(poopImg, poop.x, poop.y, poop.width, poop.height);
    });
}

// luun piirto
function drawBone(){
    boneArray.forEach(bone => {
        ctx.drawImage(boneImg, bone.x, bone.y, bone.width, bone.height);
    })
}

// ampiaisen piirto
function drawWasp(){
    waspArray.forEach(wasp => {
        ctx.drawImage(waspImg, wasp.x, wasp.y, wasp.width, wasp.height);
    })
}

// laserin piirto
function drawLaser(){
    laserArray.forEach(laser => {
        ctx.fillStyle = laser.color;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height); // piirretään suorakulmio laserin muodossa
    });
}

// taustan piirto
function drawBackground(deltaTime) {
    bgX -= bgSpeed * deltaTime; // taustanopeus delta-ajan mukaan skaalaus

    // varmistus sille ettei bgX mee negatiiviseksi yli kanvaksen leveyden
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    // koordinaattien kokonaisluvuiksi pyöristys
    let roundedBgX = Math.floor(bgX);

    // ensimmäinen taustakuva
    ctx.drawImage(bgImg, roundedBgX, 0, canvas.width, canvas.height);

    // toinen taustakuva heti ensimmäisen perään
    ctx.drawImage(bgImg, roundedBgX + canvas.width, 0, canvas.width, canvas.height);
}


function updateLasers(deltaTime) {
    laserArray.forEach((laser) => {
        laser.x += laserSpeed * deltaTime; // Skaalaa nopeus delta-ajan mukaan

        // tarkistetaan törmäys ampiaisen kanssa
        waspArray.forEach((wasp, waspIndex) => {
            if (
                laser.x < wasp.x + wasp.width &&
                laser.x + laser.width > wasp.x &&
                laser.y < wasp.y + wasp.height &&
                laser.y + laser.height > wasp.y
            ) {
                // poistetaan osunut ampiainen ja laser
                waspArray.splice(waspIndex, 1);
                timeElapsed += 20; 
            }
        });
    });

    // poistetaan laserit, jotka menevät ulos ruudulta
    laserArray = laserArray.filter(laser => laser.x < canvas.width);
}

function update(deltaTime) {
    dog.dy += gravity * deltaTime * 150; // skaalataan painovoima delta-ajan mukaan
    dog.y += dog.dy * deltaTime * 100; // skaalataan nopeus delta-ajan mukaan

    // Estetään maan läpi putoaminen
    if (dog.y + dog.height >= groundY) {
        dog.y = groundY - dog.height;
        dog.jumping = false;
    }

    poopArray.forEach(poop => {
        poop.x -= poopSpeed * deltaTime; // Skaalaa nopeus delta-ajan mukaan
    });

    boneArray.forEach(bone => {
        bone.x -= boneSpeed * deltaTime; // Skaalaa nopeus delta-ajan mukaan
    });

    waspArray.forEach(wasp => {
        wasp.x -= waspSpeed * deltaTime; // Skaalaa nopeus delta-ajan mukaan
    });

    // Poistetaan ruudun ulkopuolelle menevät
    poopArray = poopArray.filter(poop => poop.x + poop.width > 0);
    waspArray = waspArray.filter(wasp => wasp.x + wasp.width > 0);

    // Törmäyksen tarkistus kakkoja varten
    poopArray.forEach(poop => {
        const poopHitboxMargin = 11; // Hitboxin pienennys marginaali

        if (
            dog.x < poop.x + poop.width - poopHitboxMargin &&   // poistetaan marginaali oikeasta reunasta
            dog.x + dog.width > poop.x + poopHitboxMargin &&   // poistetaan marginaali vasemmasta reunasta
            dog.y < poop.y + poop.height - poopHitboxMargin &&  // poistetaan marginaali alareunasta
            dog.y + dog.height > poop.y + poopHitboxMargin      // poistetaan marginaali yläreunasta
        ) {
            gameRunning = false;
            restartButton.style.display = 'block'; // näytetään uudelleenkäynnistyspainike
            clearTimeout(poopTimer); // pysäytetään kakkojen generointi
            cancelAnimationFrame(animationFrameId); // pysäytetään peli
            stopTimer(); // pysäytetään ajastin
            displayScore(); // näytetään pisteet
        }
    });

    // Törmäyksen tarkistus luita varten
    boneArray.forEach((bone, index) => {
        if (
            dog.x < bone.x + bone.width &&
            dog.x + dog.width > bone.x &&
            dog.y < bone.y + bone.height &&
            dog.y + dog.height > bone.y
        ) {
            timeElapsed += bonePoints; // lisätään 10 pistettä
            boneSound.play();
            boneArray.splice(index, 1); // poistetaan luu kun se on kerätty
        }
    });

    // Törmäyksen tarkistus ampiaisia varten
    waspArray.forEach(wasp => {
        if (
            dog.x < wasp.x + wasp.width &&
            dog.x + dog.width > wasp.x &&
            dog.y < wasp.y + wasp.height &&
            dog.y + dog.height > wasp.y
        ) {
            gameRunning = false;
            restartButton.style.display = 'block'; // näytetään uudelleenkäynnistyspainike
            cancelAnimationFrame(animationFrameId); // pysäytetään peli
            stopTimer(); // pysäytetään ajastin
            displayScore(); // näytetään pisteet
        }
    });
}


// 

//piirrä pisteet ja näytä ne pelin aikana, jos peli on käynnissä ja näyttö on sallittu
function drawScore(){
    if (showInGameScore) {
        ctx.font = '20px Franklin Gothic Medium'; 
        ctx.fillStyle = '#00ffff';  
        ctx.textAlign = 'left';
        ctx.shadowColor = '#00ffff';  
        ctx.shadowBlur = 10;          
        ctx.fillText('Pisteet: ' + timeElapsed, 10, 30);
        ctx.shadowBlur = 0;          
    }
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    let deltaTime = (timestamp - lastFrameTime) / 1000; // Delta-aika sekunteina
    lastFrameTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Tyhjennetään ruutu

    drawBackground(deltaTime);  // Piirrä tausta
    drawCharacter(deltaTime);   // Piirrä hahmo
    drawBone();                 // Piirrä luut
    drawPoop();                 // Piirrä kakat
    drawWasp();                 // Piirrä ampiainen
    drawLaser();                // Piirrä laserit
    drawScore();                // Piirrä pisteet (tämä pitää lisätä)
    update(deltaTime);          // Päivitä elementit
    updateLasers(deltaTime);    // Päivitä laserit

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}


function jump() {
    if (!dog.jumping) {
        dog.dy = jumpForce; 
        dog.jumping = true;
        jumpSound.play();
    }
}

// uudelleenkäynnistä peli
function restartGame() {
    // nollataan hahmon ja esteiden tilat
    poopArray = [];
    boneArray = [];
    waspArray = [];
    dog.x = 80;
    dog.y = groundY - dog.height;
    dog.dy = 0;
    dog.jumping = false; // nollataan hyppyasema

    // nollataan fysiikkamuuttujat, jos ne ovat muuttuneet
    gravity = 0.1;
    jumpForce = -5.5;
    poopSpeed = 400;
    boneSpeed = 400

    // taustan vieritys nollaus
    bgX = 0;
    timeElapsed = 0; // nollataan ajastin
    showInGameScore = true; // pisteiden näyttö pelin aikana päälle

    gameRunning = true;
    restartButton.style.display = 'none';

    // nollataan ja käynnistetään uusi ajastin
    clearTimeout(poopTimer); // varmistetaan, että vanha ajastin pysäytetään
    clearTimeout(boneTimer);
    clearTimeout(waspTimer);
    scheduleNextPoop(); // asetetaan uusi kakkageneraattori
    scheduleNextBone(); // asetetaan uusi luugeneraattori
    scheduleNextWasp();
    startTimer(); // aloitetaan uusi ajastin

    // Nollaa ja soita taustamusiikki uudelleen
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();  // Soita musiikkia

    // Alusta lastFrameTime ja käynnistä peli uudelleen
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

//käynnistä peli
// käynnistä peli
// käynnistä peli
function startGame() {
    
    backgroundMusic.volume = 0.15;  // Säädä musiikin voimakkuus
    backgroundMusic.play().catch(error => {
        console.log("Musiikin toisto epäonnistui:", error);
    }); 

    playButton.style.display = 'none';
    gameStarted = true;
    gameRunning = true;
    startTimer();
    scheduleNextPoop();
    scheduleNextBone();
    scheduleNextWasp();

    // Alustetaan lastFrameTime ennen ensimmäistä animaatiota
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}


// alkunäytön piirtäminen
function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(0); // Piirretään tausta alkunäyttöön
    ctx.font = '40px Franklin Gothic Medium'; 
    ctx.fillStyle = '#ff00ff';   
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00ff';  
    ctx.shadowBlur = 15;          
    ctx.shadowBlur = 0;    
           
}

// käynnistä peli kun kuvat on ladattu
dogImg.onload = () => {
    drawStartScreen();
};

playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// kuuntelijat 
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        jump();
    }
    if (e.code === 'Enter') {
        shootLaser();
    }
});

window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        jump();
        e.preventDefault(); // Estetään välilyönti vierittämästä sivua
    }
    if (e.code === 'Enter') {
        shootLaser();
        e.preventDefault(); // Estetään Enter vierittämästä sivua
    }
});



restartButton.addEventListener('click', restartGame);
