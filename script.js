
/* =========================================
   PENGATURAN UNDANGAN PELANGGAN
   Ubah informasi di bagian CONFIG ini saja.
========================================= */

const CONFIG = {
  name: "Your Name",

  // Format tanggal: YYYY-MM-DDTHH:MM:SS+07:00
  eventDate: "2026-11-21T15:00:00+07:00",

  dateText: "Sabtu, 21 November 2026",
  timeText: "15.00 WIB – selesai",

  location: "Our Lovely Place",
  address: "Alamat acara akan diperbarui.",
  mapUrl: "https://maps.google.com",

  // Ganti dengan nomor WhatsApp penerima RSVP.
  // Format Indonesia: 628xxxxxxxxxx tanpa + atau spasi.
  whatsappNumber: "6281234567890",

  giftRecipient: "Nama Penerima",
  giftBank: "Nama Bank / E-wallet",
  giftNumber: "0000000000",
  giftDescription: "Informasi hadiah dari pemilik acara.",

  heroImage:
    "https://images.unsplash.com/photo-1530103862676-de8c9de136e2?auto=format&fit=crop&w=900&q=85"
};

const $ = selector => document.querySelector(selector);

/* Menerapkan data pelanggan ke halaman */
function applyConfig() {
  $("#birthdayName").textContent = CONFIG.name;
  $("#footerName").textContent = `${CONFIG.name}'s Birthday`;

  $("#eventDateText").textContent = CONFIG.dateText;
  $("#eventTimeText").textContent = CONFIG.timeText;
  $("#eventLocation").textContent = CONFIG.location;
  $("#eventAddress").textContent = CONFIG.address;
  $("#mapLink").href = CONFIG.mapUrl;

  $("#giftRecipient").textContent = CONFIG.giftRecipient;
  $("#giftBank").textContent = CONFIG.giftBank;
  $("#giftNumber").textContent = CONFIG.giftNumber;
  $("#giftDescription").textContent = CONFIG.giftDescription;

  $("#heroPhoto").src = CONFIG.heroImage;
  document.title = `Birthday Invitation | ${CONFIG.name}`;
}

/* Countdown acara */
function updateCountdown() {
  const target = new Date(CONFIG.eventDate).getTime();
  const distance = target - Date.now();

  if (!Number.isFinite(target)) {
    $("#countdownMessage").textContent =
      "Silakan isi tanggal acara di script.js.";
    return;
  }

  if (distance <= 0) {
    ["#days", "#hours", "#minutes", "#seconds"].forEach(id => {
      $(id).textContent = "00";
    });

    $("#countdownMessage").textContent =
      "Today is the day! Let's celebrate ♡";
    return;
  }

  const values = {
    "#days": Math.floor(distance / 86400000),
    "#hours": Math.floor((distance % 86400000) / 3600000),
    "#minutes": Math.floor((distance % 3600000) / 60000),
    "#seconds": Math.floor((distance % 60000) / 1000)
  };

  Object.entries(values).forEach(([id, value]) => {
    $(id).textContent = String(value).padStart(2, "0");
  });
}

/* Membuka undangan */
$("#openInvitation").addEventListener("click", () => {
  $("#cover").hidden = true;
  $("#invitation").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  launchConfetti(120);
});

/* RSVP dikirim melalui WhatsApp */
$("#rsvpForm").addEventListener("submit", event => {
  event.preventDefault();

  const guestName = $("#guestName").value.trim();
  const attendance = $("#attendance").value;
  const guestCount = $("#guestCount").value;
  const wish = $("#guestWish").value.trim();

  if (!guestName || !attendance) return;

  const message = [
    `Halo! Aku ${guestName}.`,
    `Konfirmasi kehadiran: ${attendance}.`,
    `Jumlah tamu: ${guestCount} orang.`,
    wish ? `Ucapan dan doa: ${wish}` : "",
    `Untuk undangan ulang tahun ${CONFIG.name}.`
  ].filter(Boolean).join("\n");

  const phone = CONFIG.whatsappNumber.replace(/\D/g, "");

  if (!phone || phone === "6281234567890") {
    alert(
      "Pemilik template perlu mengganti whatsappNumber di script.js."
    );
    return;
  }

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener"
  );
});

/* Tombol salin nomor hadiah */
$("#copyGift").addEventListener("click", async () => {
  const number = CONFIG.giftNumber;

  try {
    await navigator.clipboard.writeText(number);
    $("#copyStatus").textContent = "Nomor hadiah berhasil disalin ♡";
  } catch {
    $("#copyStatus").textContent = `Silakan salin manual: ${number}`;
  }
});

/* Musik ulang tahun.
   Tambahkan file assets/birthday-music.mp3 sendiri. */
const music = $("#birthdayMusic");

$("#musicToggle").addEventListener("click", async () => {
  if (music.paused) {
    try {
      await music.play();
      $("#musicLabel").textContent = "Jeda musik";
    } catch {
      alert(
        "Tambahkan file assets/birthday-music.mp3 terlebih dahulu."
      );
    }
  } else {
    music.pause();
    $("#musicLabel").textContent = "Putar musik";
  }
});

/* Confetti */
const canvas = $("#confettiCanvas");
const ctx = canvas.getContext("2d");

let particles = [];
let animationFrame = null;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function launchConfetti(amount = 90) {
  const colors = [
    "#d987a7",
    "#f3c7d7",
    "#c8a66a",
    "#fff0f5",
    "#bd7894"
  ];

  for (let i = 0; i < amount; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 300,
      size: 3 + Math.random() * 5,
      speed: 1.5 + Math.random() * 3.5,
      drift: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 6,
      spin: (Math.random() - 0.5) * 0.12,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 160
    });
  }

  if (!animationFrame) animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles.filter(
    p => p.life > 0 && p.y < window.innerHeight + 30
  );

  particles.forEach(p => {
    p.y += p.speed;
    p.x += p.drift + Math.sin(p.y / 35) * 0.5;
    p.rotation += p.spin;
    p.life--;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.min(1, p.life / 25);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
    ctx.restore();
  });

  if (particles.length) {
    animationFrame = requestAnimationFrame(animateConfetti);
  } else {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

applyConfig();
updateCountdown();
setInterval(updateCountdown, 1000);
