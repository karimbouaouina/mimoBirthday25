const birthdayName = "Player 2";
const slotValues = ["07", "14", "21", "22", "23", "24", "25"];
const rewards = new Set();

const $ = (selector) => document.querySelector(selector);
const reels = [$("#reel-1"), $("#reel-2"), $("#reel-3")];
const slotGate = $("#slot-gate");
const arcadeRoom = $("#arcade-room");
const spinButton = $("#spin-button");
const slotMessage = $("#slot-message");
const ticketCount = $("#ticket-count");
const rewardCount = $("#reward-count");
const finalLock = $("#final-lock");
const dialog = $("#arcade-dialog");
const dialogKicker = $("#dialog-kicker");
const dialogTitle = $("#dialog-title");
const dialogBody = $("#dialog-body");
const confettiCanvas = $("#confetti");
const confettiContext = confettiCanvas.getContext("2d");

let spinCount = 0;
let tickets = 0;
let heartScore = 0;
let playerX = 50;
let heartX = 40;
let heartY = -10;
let gameRunning = false;
let lastFrame = 0;
let audioContext;
let muted = true;
let confettiPieces = [];

const letters = [
  {
    title: "Save Point",
    text:
      "Whenever the world feels loud, I hope you remember you are loved softly, loudly, and on purpose."
  },
  {
    title: "Rare Item",
    text:
      "Your laugh is one of my favorite sounds. I would replay it forever if life had a menu button."
  },
  {
    title: "Level 25",
    text:
      "This year, I hope you get peace, pretty surprises, answered prayers, and the kind of joy that stays."
  }
];

const coupons = [
  "One emergency hug, no questions asked.",
  "One cute food date, your choice.",
  "One movie night where you control the snacks and the playlist.",
  "One day of being spoiled extra dramatically."
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration = 0.08) {
  if (muted) return;
  ensureAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.045, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function toggleSound() {
  muted = !muted;
  $("#sound-toggle").setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
  if (!muted) {
    playTone(523);
    window.setTimeout(() => playTone(659), 90);
    window.setTimeout(() => playTone(784), 180);
  }
}

function spinSlot() {
  spinCount += 1;
  spinButton.disabled = true;
  slotMessage.textContent = spinCount < 3 ? "Almost... the birthday magic is warming up." : "Jackpot loading...";

  reels.forEach((reel, reelIndex) => {
    let ticks = 0;
    const maxTicks = 12 + reelIndex * 7 + spinCount * 2;
    const timer = window.setInterval(() => {
      const value = slotValues[Math.floor(Math.random() * slotValues.length)];
      reel.textContent = spinCount >= 3 && ticks > maxTicks - 4 ? "25" : value;
      reel.classList.add("is-spinning");
      playTone(260 + reelIndex * 80, 0.025);
      ticks += 1;
      if (ticks >= maxTicks) {
        window.clearInterval(timer);
        reel.classList.remove("is-spinning");
        if (spinCount >= 3) reel.textContent = "25";
        if (reelIndex === 2) finishSpin();
      }
    }, 70);
  });
}

function finishSpin() {
  spinButton.disabled = false;
  if (spinCount >= 3) {
    slotMessage.textContent = "HAPPY BIRTHDAY! The arcade room is open.";
    spinButton.textContent = "Enter Arcade";
    spinButton.removeEventListener("click", spinSlot);
    spinButton.addEventListener("click", enterArcade, { once: true });
    burstConfetti();
    playWinJingle();
  } else {
    slotMessage.textContent = "Spin again. The machine wants the birthday number.";
  }
}

function enterArcade() {
  slotGate.classList.add("is-hidden");
  arcadeRoom.classList.remove("is-hidden");
  burstConfetti();
}

function playWinJingle() {
  [523, 659, 784, 1046].forEach((note, index) => {
    window.setTimeout(() => playTone(note, 0.11), index * 120);
  });
}

function addReward(id, amount = 5) {
  if (!rewards.has(id)) {
    rewards.add(id);
    tickets += amount;
    ticketCount.textContent = pad(tickets);
    rewardCount.textContent = `${rewards.size}/6`;
    document.querySelector(`[data-station="${id}"]`)?.classList.add("completed");
    if (rewards.size >= 5) {
      document.querySelector('[data-station="final"]').classList.remove("locked");
      finalLock.textContent = "Open";
    }
  }
}

function openStation(station) {
  if (station === "final" && rewards.size < 5) {
    openDialog("Prize vault", "Still locked", `<p>Collect at least 5 rewards around the arcade first.</p>`);
    return;
  }

  const views = {
    heart: heartGameView,
    mail: mailView,
    coupons: couponView,
    plush: plushView,
    memory: memoryView,
    final: finalView
  };
  views[station]();
}

function openDialog(kicker, title, html) {
  dialogKicker.textContent = kicker;
  dialogTitle.textContent = title;
  dialogBody.innerHTML = html;
  dialog.showModal();
  playTone(660);
}

function heartGameView() {
  openDialog(
    "Mini game",
    "Heart Catch",
    `<p>Catch 25 hearts to win the Love Letter reward.</p>
    <div class="mini-game" id="mini-game" tabindex="0">
      <div class="mini-score">Hearts: <strong id="mini-score">00</strong>/25</div>
      <div class="mini-player" id="mini-player"></div>
      <div class="mini-heart" id="mini-heart"></div>
    </div>
    <div class="dialog-actions">
      <button type="button" data-mini-move="-1">Left</button>
      <button type="button" id="mini-start">Start</button>
      <button type="button" data-mini-move="1">Right</button>
    </div>`
  );
  heartScore = 0;
  playerX = 50;
  resetHeart();
  setMiniPositions();
  $("#mini-start").addEventListener("click", startHeartGame);
  document.querySelectorAll("[data-mini-move]").forEach((button) => {
    button.addEventListener("click", () => moveMiniPlayer(Number(button.dataset.miniMove)));
  });
}

function setMiniPositions() {
  $("#mini-player")?.style.setProperty("--player-x", playerX);
  $("#mini-heart")?.style.setProperty("--heart-x", heartX);
  $("#mini-heart")?.style.setProperty("--heart-y", heartY);
}

function resetHeart() {
  heartX = 8 + Math.random() * 84;
  heartY = -10;
}

function moveMiniPlayer(direction) {
  playerX = Math.min(94, Math.max(6, playerX + direction * 9));
  setMiniPositions();
}

function startHeartGame() {
  gameRunning = true;
  lastFrame = performance.now();
  $("#mini-start").textContent = "Playing";
  requestAnimationFrame(heartGameLoop);
}

function heartGameLoop(time) {
  if (!gameRunning || !$("#mini-heart")) return;
  const delta = Math.min(32, time - lastFrame || 16);
  lastFrame = time;
  heartY += delta * 0.055;
  if (heartY > 78 && heartY < 95 && Math.abs(heartX - playerX) < 9) {
    heartScore += 1;
    $("#mini-score").textContent = pad(heartScore);
    playTone(880 + heartScore * 5, 0.04);
    resetHeart();
    if (heartScore >= 25) {
      gameRunning = false;
      addReward("heart", 25);
      openDialog("Reward unlocked", "Love Letter Ticket", `<p>You won the heart cabinet. A final love letter has been added to the prize vault.</p>`);
      burstConfetti();
      return;
    }
  }
  if (heartY > 108) resetHeart();
  setMiniPositions();
  requestAnimationFrame(heartGameLoop);
}

function mailView() {
  const html = letters
    .map(
      (letter, index) =>
        `<button type="button" class="reward-tile" data-letter="${index}"><strong>${letter.title}</strong><small>Open</small></button>`
    )
    .join("");
  openDialog("Love mailbox", "Pick a letter", `<div class="reward-list">${html}</div>`);
  document.querySelectorAll("[data-letter]").forEach((button) => {
    button.addEventListener("click", () => {
      const letter = letters[Number(button.dataset.letter)];
      addReward("mail");
      openDialog("Love letter", letter.title, `<p>${letter.text}</p>`);
    });
  });
}

function couponView() {
  const html = coupons
    .map((coupon) => `<div class="coupon"><span>Coupon</span><p>${coupon}</p></div>`)
    .join("");
  addReward("coupons");
  openDialog("Reward booth", "Cute Coupons", `<div class="coupon-grid">${html}</div>`);
}

function plushView() {
  addReward("plush");
  openDialog(
    "Claw machine",
    "Stitch Plushie Won",
    `<div class="plush-prize" aria-hidden="true"></div>
    <p>You won the softest imaginary Stitch plushie. Redeemable for one real plushie hunt together.</p>`
  );
  burstConfetti();
}

function memoryView() {
  addReward("memory");
  openDialog(
    "Memory quest",
    "Tiny Things I Choose",
    `<ul class="memory-list">
      <li>More late-night calls.</li>
      <li>More food dates and random photos.</li>
      <li>More laughing until the day feels lighter.</li>
      <li>More choosing you, again and again.</li>
    </ul>`
  );
}

function finalView() {
  addReward("final", 25);
  openDialog(
    "Final prize",
    `Happy 25th Birthday, ${birthdayName}`,
    `<p>My favorite girl, this whole arcade is just a tiny version of what I hope today feels like: playful, soft, full of surprises, and overflowing with love.</p>
    <p>You are my jackpot. You are my favorite reward. Happy birthday, my love.</p>`
  );
  burstConfetti();
  playWinJingle();
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
  confettiPieces = Array.from({ length: 140 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 160,
    y: window.innerHeight * 0.34,
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

spinButton.addEventListener("click", spinSlot);
$("#sound-toggle").addEventListener("click", toggleSound);
document.querySelectorAll("[data-station]").forEach((button) => {
  button.addEventListener("click", () => openStation(button.dataset.station));
});
document.addEventListener("keydown", (event) => {
  if (dialog.open && (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")) moveMiniPlayer(-1);
  if (dialog.open && (event.key === "ArrowRight" || event.key.toLowerCase() === "d")) moveMiniPlayer(1);
});
dialog.addEventListener("close", () => {
  gameRunning = false;
});
window.addEventListener("resize", resizeConfetti);
resizeConfetti();
