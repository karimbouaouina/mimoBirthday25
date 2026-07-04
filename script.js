const birthday = new Date("2026-07-05T00:00:00+01:00");
const birthdayName = "Player 2";
const finalLetter = {
  title: "For my favorite person",
  body:
    "Happy 25th birthday, my love. I hope this tiny arcade makes you smile, but I hope today makes you feel even more adored. You are my sweetest win, my calm place, and the best part of every ordinary day."
};

const letters = [
  {
    title: "Save Point",
    tag: "For when you need softness",
    body:
      "I hope this year gives you rooms where you can rest, laugh loudly, be held gently, and never doubt how loved you are."
  },
  {
    title: "Rare Item",
    tag: "A tiny truth",
    body:
      "Your smile has this unfair superpower. It turns normal moments into memories I want to keep."
  },
  {
    title: "Side Quest",
    tag: "A promise",
    body:
      "I want more walks, more calls, more food runs, more jokes that make no sense, and more little adventures with you."
  },
  {
    title: "Boss Level",
    tag: "For your 25th",
    body:
      "May this level bring brave dreams, answered prayers, pretty surprises, and the kind of peace that feels like home."
  }
];

const $ = (selector) => document.querySelector(selector);
const heartCount = $("#heart-count");
const mode = $("#birthday-mode");
const days = $("#days");
const hours = $("#hours");
const minutes = $("#minutes");
const seconds = $("#seconds");
const typeLine = $("#type-line");
const stage = $("#game-stage");
const player = $("#player");
const heart = $("#falling-heart");
const startButton = $("#start-game");
const dialog = $("#letter-dialog");
const dialogTitle = $("#dialog-title");
const dialogBody = $("#dialog-body");
const dialogKicker = $("#dialog-kicker");
const confettiCanvas = $("#confetti");
const confettiContext = confettiCanvas.getContext("2d");

let score = 0;
let playerX = 50;
let heartX = 40;
let heartY = -12;
let gameRunning = false;
let lastFrame = 0;
let audioContext;
let muted = true;
let confettiPieces = [];

function pad(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const distance = birthday - now;

  if (distance <= 0) {
    mode.textContent = "Birthday";
    days.textContent = "00";
    hours.textContent = "25";
    minutes.textContent = "Love";
    seconds.textContent = "You";
    typeLine.textContent =
      "It is officially your birthday. Level 25 has started, and I am cheering the loudest.";
    return;
  }

  mode.textContent = "Countdown";
  const totalSeconds = Math.floor(distance / 1000);
  days.textContent = pad(Math.floor(totalSeconds / 86400));
  hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
  minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
  seconds.textContent = pad(totalSeconds % 60);
}

function typeMessage(message) {
  let index = 0;
  typeLine.textContent = "";
  const timer = window.setInterval(() => {
    typeLine.textContent += message[index] || "";
    index += 1;
    if (index >= message.length) window.clearInterval(timer);
  }, 42);
}

function renderLetters() {
  const list = $("#letters");
  list.innerHTML = "";
  letters.forEach((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-tile";
    button.innerHTML = `<span aria-hidden="true"></span><strong>${letter.title}</strong><small>${letter.tag}</small>`;
    button.addEventListener("click", () => openLetter(letter));
    list.appendChild(button);
  });
}

function openLetter(letter, kicker = "Love letter") {
  dialogKicker.textContent = kicker;
  dialogTitle.textContent = letter.title;
  dialogBody.textContent = letter.body;
  dialog.showModal();
  playTone(660, 0.08);
}

function setPositions() {
  player.style.setProperty("--player-x", playerX);
  heart.style.setProperty("--heart-x", heartX);
  heart.style.setProperty("--heart-y", heartY);
}

function resetHeart() {
  heartX = 8 + Math.random() * 84;
  heartY = -10;
}

function movePlayer(direction) {
  playerX = Math.min(94, Math.max(6, playerX + direction * 8));
  setPositions();
}

function gameLoop(time) {
  if (!gameRunning) return;
  const delta = Math.min(32, time - lastFrame || 16);
  lastFrame = time;
  heartY += delta * 0.045;

  if (heartY > 78 && heartY < 95 && Math.abs(heartX - playerX) < 8) {
    score = Math.min(25, score + 1);
    heartCount.textContent = pad(score);
    playTone(880 + score * 8, 0.045);
    resetHeart();
    if (score >= 25) {
      gameRunning = false;
      startButton.textContent = "Won";
      openLetter(finalLetter, "Final letter");
      burstConfetti();
      return;
    }
  }

  if (heartY > 108) resetHeart();
  setPositions();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  if (score >= 25) {
    openLetter(finalLetter, "Final letter");
    return;
  }
  gameRunning = true;
  startButton.textContent = "Playing";
  lastFrame = performance.now();
  stage.focus();
  requestAnimationFrame(gameLoop);
}

function unlockFinalLetter() {
  openLetter(finalLetter, score >= 25 ? "Final letter" : "Sneak peek");
  burstConfetti();
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration) {
  if (muted) return;
  ensureAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.04, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function toggleSound() {
  muted = !muted;
  $("#sound-toggle").classList.toggle("is-on", !muted);
  $("#sound-toggle").setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
  if (!muted) {
    playTone(523, 0.06);
    window.setTimeout(() => playTone(659, 0.06), 70);
    window.setTimeout(() => playTone(784, 0.08), 140);
  }
}

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth * window.devicePixelRatio;
  confettiCanvas.height = window.innerHeight * window.devicePixelRatio;
  confettiCanvas.style.width = `${window.innerWidth}px`;
  confettiCanvas.style.height = `${window.innerHeight}px`;
  confettiContext.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function burstConfetti() {
  const colors = ["#ff2f93", "#fff07a", "#9df7d3", "#6bc6ff", "#7b3ff2"];
  confettiPieces = Array.from({ length: 120 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 8,
    vy: -Math.random() * 8 - 2,
    size: 6 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    spin: Math.random() * Math.PI
  }));
  requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiPieces.forEach((piece) => {
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vy += 0.23;
    piece.spin += 0.18;
    confettiContext.save();
    confettiContext.translate(piece.x, piece.y);
    confettiContext.rotate(piece.spin);
    confettiContext.fillStyle = piece.color;
    confettiContext.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
    confettiContext.restore();
  });
  confettiPieces = confettiPieces.filter((piece) => piece.y < window.innerHeight + 40);
  if (confettiPieces.length) requestAnimationFrame(drawConfetti);
}

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => movePlayer(Number(button.dataset.move)));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") movePlayer(-1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") movePlayer(1);
  if (event.key === " " && document.activeElement === stage) startGame();
});

startButton.addEventListener("click", startGame);
$("#secret-button").addEventListener("click", unlockFinalLetter);
$("#confetti-button").addEventListener("click", burstConfetti);
$("#sound-toggle").addEventListener("click", toggleSound);
window.addEventListener("resize", resizeConfetti);

renderLetters();
setPositions();
resizeConfetti();
updateCountdown();
window.setInterval(updateCountdown, 1000);
typeMessage(`Tomorrow is ${birthdayName}'s 25th birthday, so I made a tiny world full of hearts.`);
