// lasya.js (UPDATED: removes the moving white “band/line” but keeps stars moving)
(() => {
  const canvas = document.getElementById("galaxy");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  const particlesLayer = document.getElementById("particles");
  const typeEl = document.getElementById("typeLine");
  const yearEl = document.getElementById("year");

  const openMissionBtn = document.getElementById("openMission");
  const clickToOpenBtn = document.getElementById("clickToOpen");
  const closeMissionBtn = document.getElementById("closeMission");
  const mission = document.getElementById("mission");

  const stardustCountEl = document.getElementById("stardustCount");
  const toggleMotion = document.getElementById("toggleMotion");
  const toggleSound = document.getElementById("toggleSound");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Smooth nav ----------
  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      mission?.classList.remove("open");
    });
  });


// ---------- Hero card flip (Contact) ----------
const heroCard = document.getElementById("heroCard");
const contactBtn = document.getElementById("contactBtn");
const toFrontInline = document.getElementById("toFrontInline");
const flipForm = document.getElementById("flipForm");

// X button may not exist (you removed it)
const contactFlipClose = document.getElementById("contactFlipClose");

if (heroCard && contactBtn && toFrontInline) {
  const openHeroFlip = () => {
    heroCard.classList.add("isFlipped");
    heroCard.setAttribute("aria-expanded", "true");
  };

  const closeHeroFlip = () => {
    heroCard.classList.remove("isFlipped");
    heroCard.setAttribute("aria-expanded", "false");
  };

  contactBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!heroCard.classList.contains("isFlipped")) openHeroFlip();
  });

  // Back closes
  toFrontInline.addEventListener("click", closeHeroFlip);

  // If X exists, it closes too
  contactFlipClose?.addEventListener("click", closeHeroFlip);

  // ESC closes
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && heroCard.classList.contains("isFlipped")) closeHeroFlip();
  });

  // click outside form closes (optional)
  heroCard.addEventListener("click", (e) => {
    if (!heroCard.classList.contains("isFlipped")) return;
    const back = heroCard.querySelector(".heroBack");
    if (!back) return;

    if (
      back.contains(e.target) &&
      !e.target.closest("form") &&
      !e.target.closest(".socialBtns") &&
      !e.target.closest("button")
    ) {
      closeHeroFlip();
    }
  });
}








  // ---------- Mission drawer ----------
  const openMission = () => {
  mission?.classList.add("open");
  document.body.classList.add("mission-open");
};

const closeMission = () => {
  mission?.classList.remove("open");
  document.body.classList.remove("mission-open");
};
  openMissionBtn?.addEventListener("click", openMission);
  clickToOpenBtn?.addEventListener("click", openMission);
  closeMissionBtn?.addEventListener("click", closeMission);

  // ---------- Typing line ----------
  const lines = [
    "✦ Research Assistant",
    "✦ Frontend Intern",
    "✦ Computer Scientist Intern",
    "✦ Student Auxiliary Officer"
  ];
  let lineIdx = 0, charIdx = 0, deleting = false;

  function tickType() {
    if (!typeEl) return;
    const current = lines[lineIdx];
    const speed = deleting ? 22 : 34;

    if (!deleting) {
      charIdx++;
      typeEl.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) {
        deleting = true;
        setTimeout(tickType, 900);
        return;
      }
    } else {
      charIdx--;
      typeEl.textContent = current.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        lineIdx = (lineIdx + 1) % lines.length;
      }
    }
    setTimeout(tickType, speed);
  }
  tickType();

  // ---------- Reveal ----------
  const revealTargets = document.querySelectorAll(".hero-holo, .planet-wrap, .mission-card");
  revealTargets.forEach((el) => el.setAttribute("data-reveal", "true"));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) en.target.classList.add("show");
    });
  }, { threshold: 0.12 });
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  // ---------- Motion toggle ----------
  toggleMotion?.addEventListener("click", () => {
    document.body.classList.toggle("reduced");
  });

  // ---------- “Sound” toggle (UI sparkle only) ----------
  toggleSound?.addEventListener("click", () => {
    const r = toggleSound.getBoundingClientRect();
    sparkle(r.left + 20, r.top + 20, 10);
  });

  // ---------- Helpers ----------
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function roundRectPath(ctx2, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx2.moveTo(x + r, y);
    ctx2.arcTo(x + width, y, x + width, y + height, r);
    ctx2.arcTo(x + width, y + height, x, y + height, r);
    ctx2.arcTo(x, y + height, x, y, r);
    ctx2.arcTo(x, y, x + width, y, r);
    ctx2.closePath();
  }

  // ---------- Milky Way canvas ----------
  let w = 0, h = 0;
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let scrollY = 0;

  let stars = [];
  let dust = [];
  let stardust = 0;

  let autoX = 0.5, autoY = 0.5;
  let targetAutoX = 0.5, targetAutoY = 0.5;

  let lastT = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildField();
  }

  function buildField() {
    stars = [];
    dust = [];

    const starCount = Math.floor((w * h) / 7000);
    const dustCount = Math.floor((w * h) / 4500);

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.6, 1.8),
        a: rand(0.25, 0.95),
        tw: rand(0.004, 0.018),
        layer: Math.random() < 0.55 ? 1 : (Math.random() < 0.8 ? 2 : 3),
        hue: Math.random() < 0.18 ? "c" : (Math.random() < 0.15 ? "p" : "w"),
      });
    }

    // keep dust, but it will NOT form a big bright band anymore (lower alpha + no band overlay)
    const angle = -0.38;
    const cx = w * 0.52;
    const cy = h * 0.45;

    for (let i = 0; i < dustCount; i++) {
      const t = rand(-w, w);
      const spread = rand(-h * 0.22, h * 0.22);
      const x = cx + t * Math.cos(angle) + spread * Math.cos(angle + Math.PI / 2);
      const y = cy + t * Math.sin(angle) + spread * Math.sin(angle + Math.PI / 2);

      dust.push({
        x,
        y,
        r: rand(0.8, 3.2),
        a: rand(0.015, 0.07),     // LOWER alpha (was 0.03..0.14)
        drift: rand(0.08, 0.28),
        tint: Math.random() < 0.5 ? "a" : "b",
      });
    }
  }

  function drawBackgroundGradient() {
    const g = ctx.createRadialGradient(w * 0.6, h * 0.25, 10, w * 0.55, h * 0.45, Math.max(w, h));
    g.addColorStop(0, "rgba(26, 8, 64, 0.95)");
    g.addColorStop(0.55, "rgba(6, 6, 18, 0.95)");
    g.addColorStop(1, "rgba(3, 3, 10, 1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // REMOVED the big “band” overlay (this is the white line-ish thing reacting to cursor)
  // function drawMilkyWayBand(px, py) { ... }  <-- removed on purpose

  function drawDust(px, py) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // reduce cursor influence so it doesn't look like a moving streak
    const ox = (px - 0.5) * 60;   // was 120
    const oy = (py - 0.5) * 40;   // was 80
    const sy = scrollY * 0.04;    // was 0.06

    for (const d of dust) {
      const x = d.x + ox * d.drift;
      const y = d.y + oy * d.drift + sy * d.drift;
      if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;

      ctx.globalAlpha = d.a;
      const col = d.tint === "a" ? `rgba(168,139,255,${d.a})` : `rgba(85,230,255,${d.a})`;
      const g = ctx.createRadialGradient(x, y, 0, x, y, d.r * 10);
      g.addColorStop(0, col);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, d.r * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawStars(px, py, dtMs) {
    const dt = Math.min(40, dtMs || 16) / 16.666;

    const ox1 = (px - 0.5) * 18;
    const oy1 = (py - 0.5) * 14;
    const ox2 = (px - 0.5) * 32;
    const oy2 = (py - 0.5) * 24;
    const ox3 = (px - 0.5) * 48;
    const oy3 = (py - 0.5) * 36;
    const sy = scrollY * 0.08;

    const baseVX = -0.55;
    const baseVY = 0.18;

    for (const s of stars) {
      s.a += (Math.random() - 0.5) * s.tw;
      s.a = Math.max(0.15, Math.min(1, s.a));

      const layerMul = s.layer === 1 ? 0.55 : (s.layer === 2 ? 0.9 : 1.25);
      s.x += baseVX * layerMul * dt;
      s.y += baseVY * layerMul * dt;

      if (s.x < -30) s.x = w + 30;
      if (s.x > w + 30) s.x = -30;
      if (s.y < -30) s.y = h + 30;
      if (s.y > h + 30) s.y = -30;

      let x = s.x, y = s.y + sy * (s.layer * 0.12);
      if (s.layer === 1) { x += ox1; y += oy1; }
      if (s.layer === 2) { x += ox2; y += oy2; }
      if (s.layer === 3) { x += ox3; y += oy3; }

      const color =
        s.hue === "c" ? `rgba(85,230,255,${s.a})` :
        s.hue === "p" ? `rgba(168,139,255,${s.a})` :
        `rgba(255,255,255,${s.a})`;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function applyNebula(px, py) {
    const n1 = document.querySelector(".nebula-1");
    const n2 = document.querySelector(".nebula-2");
    const n3 = document.querySelector(".nebula-3");
    if (!n1 || !n2 || !n3) return;

    const mx = (px - 0.5);
    const my = (py - 0.5);

    n1.style.transform = `translate3d(${mx * 80}px, ${my * 55}px, 0)`;
    n2.style.transform = `translate3d(${mx * 140}px, ${my * 100}px, 0)`;
    n3.style.transform = `translate3d(${mx * 210}px, ${my * 155}px, 0)`;
  }

  function frame(t) {
    const now = t || performance.now();
    const dtMs = lastT ? (now - lastT) : 16;
    lastT = now;

    const time = now * 0.000085;

    if (Math.random() < 0.01) {
      targetAutoX = 0.35 + Math.random() * 0.3;
      targetAutoY = 0.35 + Math.random() * 0.3;
    }
    autoX += (targetAutoX - autoX) * 0.0035;
    autoY += (targetAutoY - autoY) * 0.0035;

    const pxMouse = mouseX / Math.max(1, w);
    const pyMouse = mouseY / Math.max(1, h);

    const driftX = Math.sin(time) * 1.8;
    const driftY = Math.cos(time * 0.85) * 1.4;

    const px = pxMouse * 0.35 + autoX * 0.65 + driftX * 0.03;
    const py = pyMouse * 0.35 + autoY * 0.65 + driftY * 0.03;

    drawBackgroundGradient();
    // drawMilkyWayBand(px, py);  // removed
    drawDust(px, py);
    drawStars(px, py, dtMs);
    applyNebula(px, py);

    requestAnimationFrame(frame);
  }

  // ---------- Stardust particles ----------
  function sparkle(x, y, n = 18) {
    if (!particlesLayer) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const dx = (Math.random() - 0.5) * 140 + "px";
      const dy = (Math.random() - 0.6) * 140 + "px";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty("--dx", dx);
      p.style.setProperty("--dy", dy);
      particlesLayer.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  window.addEventListener("pointermove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener("scroll", () => {
    scrollY = window.scrollY || 0;
  }, { passive: true });

  window.addEventListener("click", (e) => {
    const y = e.clientY;
    if (y < window.innerHeight * 0.55) {
      stardust++;
      if (stardustCountEl) stardustCountEl.textContent = `Stardust: ${stardust}`;
      sparkle(e.clientX, e.clientY, 22);
    }
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
