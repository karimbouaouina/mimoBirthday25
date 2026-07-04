const birthdayName = "Player 2";
const totalRewards = 8;
const finalUnlockCount = 7;
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
let clawX = 50;
let plushX = 62;
let clawBusy = false;
let whackScore = 0;
let whackTime = 25;
let whackActive = false;
let whackTimer;
let whackSpawnTimer;
let activePhotoStream;
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
    rewardCount.textContent = `${rewards.size}/${totalRewards}`;
    document.querySelector(`[data-station="${id}"]`)?.classList.add("completed");
    if (rewards.size >= finalUnlockCount) {
      document.querySelector('[data-station="final"]').classList.remove("locked");
      finalLock.textContent = "Open";
    }
  }
}

function openStation(station) {
  if (station === "final" && rewards.size < finalUnlockCount) {
    openDialog("Prize vault", "Still locked", `<p>Collect ${finalUnlockCount} rewards around the arcade first.</p>`);
    return;
  }

  const views = {
    heart: heartGameView,
    mail: mailView,
    coupons: couponView,
    plush: plushView,
    whack: whackView,
    photo: photoView,
    memory: memoryView,
    final: finalView
  };
  views[station]();
}

function openDialog(kicker, title, html) {
  dialogKicker.textContent = kicker;
  dialogTitle.textContent = title;
  dialogBody.innerHTML = html;
  if (!dialog.open) dialog.showModal();
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
  openDialog(
    "Claw machine",
    rewards.has("plush") ? "Stitch Plushie Won" : "Win the Stitch Plushie",
    `<p>Line up the claw over the plushie, then drop it. You only win if the claw lands close enough.</p>
    <div class="claw-game" id="claw-game" tabindex="0">
      <div class="claw-rail" aria-hidden="true"></div>
      <div class="claw" id="claw" aria-hidden="true">
        <span></span>
      </div>
      <div class="claw-plush" id="claw-plush" aria-hidden="true"></div>
      <div class="prize-chute" aria-hidden="true">Prize</div>
    </div>
    <p class="game-hint" id="claw-hint">${rewards.has("plush") ? "Already claimed, but you can still play again." : "Use Left / Right, then Drop."}</p>
    <div class="dialog-actions">
      <button type="button" data-claw-move="-1">Left</button>
      <button type="button" id="claw-drop">Drop</button>
      <button type="button" data-claw-move="1">Right</button>
    </div>`
  );
  clawX = 50;
  plushX = 18 + Math.random() * 64;
  clawBusy = false;
  setClawPositions();
  document.querySelectorAll("[data-claw-move]").forEach((button) => {
    button.addEventListener("click", () => moveClaw(Number(button.dataset.clawMove)));
  });
  $("#claw-drop").addEventListener("click", dropClaw);
}

function setClawPositions() {
  $("#claw")?.style.setProperty("--claw-x", clawX);
  $("#claw-plush")?.style.setProperty("--plush-x", plushX);
}

function moveClaw(direction) {
  if (clawBusy || !$("#claw-game")) return;
  clawX = Math.min(88, Math.max(12, clawX + direction * 7));
  setClawPositions();
  playTone(420, 0.035);
}

function dropClaw() {
  if (clawBusy || !$("#claw-game")) return;
  const claw = $("#claw");
  const plush = $("#claw-plush");
  const hint = $("#claw-hint");
  const dropButton = $("#claw-drop");
  const won = Math.abs(clawX - plushX) <= 8;

  clawBusy = true;
  dropButton.disabled = true;
  hint.textContent = "Claw descending...";
  claw?.classList.add("is-dropping");
  playTone(320, 0.12);

  window.setTimeout(() => {
    if (won) {
      plush?.classList.add("is-caught");
      hint.textContent = "Got it! Stitch plushie unlocked.";
      addReward("plush");
      burstConfetti();
      playWinJingle();
      window.setTimeout(() => {
        openDialog(
          "Claw machine",
          "Stitch Plushie Won",
          `<div class="plush-prize" aria-hidden="true"></div>
          <p>You won the softest imaginary Stitch plushie. Redeemable for one real plushie hunt together.</p>`
        );
      }, 900);
      return;
    }

    hint.textContent = "So close. Reposition the claw and try again.";
    claw?.classList.remove("is-dropping");
    plushX = 18 + Math.random() * 64;
    clawBusy = false;
    dropButton.disabled = false;
    setClawPositions();
    playTone(180, 0.12);
  }, 760);
}

function whackView() {
  openDialog(
    "Mini game",
    "Whack-a-Heart",
    `<p>Tap the hearts as they pop up. Reach 25 before the timer runs out.</p>
    <div class="whack-board" id="whack-board" aria-label="Whack-a-heart game">
      ${Array.from({ length: 9 }, (_, index) => `<button type="button" class="heart-hole" data-hole="${index}" aria-label="Heart hole"></button>`).join("")}
    </div>
    <div class="whack-stats">
      <span>Hits: <strong id="whack-score">00</strong>/25</span>
      <span>Time: <strong id="whack-time">25</strong></span>
    </div>
    <div class="dialog-actions single-action">
      <button type="button" id="whack-start">Start</button>
    </div>`
  );
  stopWhackGame();
  whackScore = 0;
  whackTime = 25;
  $("#whack-start").addEventListener("click", startWhackGame);
  document.querySelectorAll(".heart-hole").forEach((hole) => {
    hole.addEventListener("click", () => hitWhackHeart(hole));
  });
}

function startWhackGame() {
  stopWhackGame();
  whackScore = 0;
  whackTime = 25;
  whackActive = true;
  $("#whack-score").textContent = "00";
  $("#whack-time").textContent = "25";
  $("#whack-start").textContent = "Playing";
  $("#whack-start").disabled = true;
  spawnWhackHeart();
  whackSpawnTimer = window.setInterval(spawnWhackHeart, 720);
  whackTimer = window.setInterval(() => {
    whackTime -= 1;
    $("#whack-time").textContent = pad(whackTime);
    if (whackTime <= 0) finishWhackGame(false);
  }, 1000);
}

function spawnWhackHeart() {
  if (!whackActive) return;
  const holes = [...document.querySelectorAll(".heart-hole")];
  holes.forEach((hole) => hole.classList.remove("is-up", "is-bonked"));
  const hole = holes[Math.floor(Math.random() * holes.length)];
  hole?.classList.add("is-up");
}

function hitWhackHeart(hole) {
  if (!whackActive || !hole.classList.contains("is-up")) return;
  hole.classList.remove("is-up");
  hole.classList.add("is-bonked");
  whackScore += 1;
  $("#whack-score").textContent = pad(whackScore);
  playTone(760 + whackScore * 7, 0.04);
  if (whackScore >= 25) finishWhackGame(true);
}

function finishWhackGame(won) {
  stopWhackGame();
  if (won) {
    addReward("whack", 15);
    openDialog("Reward unlocked", "Heart Bonk Champion", `<p>You tapped 25 hearts. A bundle of birthday tickets popped out of the machine.</p>`);
    burstConfetti();
    return;
  }
  $("#whack-start").textContent = "Try Again";
  $("#whack-start").disabled = false;
  $("#whack-time").textContent = "00";
}

function stopWhackGame() {
  whackActive = false;
  window.clearInterval(whackTimer);
  window.clearInterval(whackSpawnTimer);
}

function photoView() {
  openDialog(
    "Photo booth",
    "25th Birthday Snapshot",
    `<p>Press Start Camera, allow camera access, then snap a picture with the arcade birthday frame.</p>
    <div class="photo-booth">
      <div class="photo-preview">
        <video id="photo-video" autoplay playsinline muted></video>
        <canvas id="photo-canvas" width="900" height="1200"></canvas>
        <div class="photo-frame" aria-hidden="true">
          <span>Happy 25th Birthday</span>
          <strong>${birthdayName}</strong>
          <small>Birthday Arcade 2026</small>
        </div>
      </div>
      <p class="game-hint" id="photo-hint">Camera stays on this device only.</p>
    </div>
    <div class="dialog-actions photo-actions">
      <button type="button" id="camera-start">Start Camera</button>
      <button type="button" id="photo-snap" disabled>Snap</button>
      <button type="button" id="photo-download" disabled>Download</button>
    </div>`
  );
  stopCamera();
  $("#camera-start").addEventListener("click", startCamera);
  $("#photo-snap").addEventListener("click", snapPhoto);
  $("#photo-download").addEventListener("click", downloadPhoto);
}

async function startCamera() {
  const hint = $("#photo-hint");
  const video = $("#photo-video");
  if (!navigator.mediaDevices?.getUserMedia) {
    hint.textContent = "Camera access is not available in this browser.";
    return;
  }
  try {
    activePhotoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    video.srcObject = activePhotoStream;
    $("#photo-snap").disabled = false;
    hint.textContent = "Pose inside the pixel frame, then snap.";
  } catch (error) {
    hint.textContent = "Camera permission was blocked or unavailable.";
  }
}

function snapPhoto() {
  const video = $("#photo-video");
  const canvas = $("#photo-canvas");
  const hint = $("#photo-hint");
  const context = canvas.getContext("2d");
  if (!video?.videoWidth) {
    hint.textContent = "Start the camera first, then snap.";
    return;
  }

  context.fillStyle = "#ffd3ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const sourceRatio = video.videoWidth / video.videoHeight;
  const targetRatio = canvas.width / canvas.height;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = video.videoHeight * targetRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = video.videoWidth / targetRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }

  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  drawPhotoFrame(context, canvas.width, canvas.height);
  canvas.classList.add("has-photo");
  $("#photo-download").disabled = false;
  addReward("photo", 10);
  hint.textContent = "Perfect. Download the framed birthday photo.";
  burstConfetti();
  playTone(980, 0.08);
}

function drawPhotoFrame(context, width, height) {
  context.lineWidth = 34;
  context.strokeStyle = "#321327";
  context.strokeRect(17, 17, width - 34, height - 34);
  context.lineWidth = 20;
  context.strokeStyle = "#ff5ebc";
  context.strokeRect(46, 46, width - 92, height - 92);
  context.fillStyle = "rgba(255, 248, 252, 0.92)";
  context.fillRect(70, height - 230, width - 140, 150);
  context.fillStyle = "#ff2f93";
  context.font = "54px 'Press Start 2P', monospace";
  context.textAlign = "center";
  context.fillText("HAPPY 25TH", width / 2, height - 158);
  context.fillStyle = "#7b3ff2";
  context.font = "40px 'Press Start 2P', monospace";
  context.fillText("BIRTHDAY", width / 2, height - 102);
  context.fillStyle = "#fff07a";
  for (let i = 0; i < 18; i += 1) {
    const x = 70 + ((i * 47) % (width - 140));
    const y = i % 2 === 0 ? 78 : height - 52;
    context.fillRect(x, y, 18, 18);
  }
}

function downloadPhoto() {
  const canvas = $("#photo-canvas");
  const link = document.createElement("a");
  link.download = "birthday-arcade-photo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function stopCamera() {
  activePhotoStream?.getTracks().forEach((track) => track.stop());
  activePhotoStream = undefined;
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
  if (dialog.open && event.key === "ArrowLeft") moveClaw(-1);
  if (dialog.open && event.key === "ArrowRight") moveClaw(1);
  if (dialog.open && event.key === " ") dropClaw();
});
dialog.addEventListener("close", () => {
  gameRunning = false;
  clawBusy = false;
  stopWhackGame();
  stopCamera();
});
window.addEventListener("resize", resizeConfetti);
resizeConfetti();
