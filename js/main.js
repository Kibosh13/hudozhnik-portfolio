document.documentElement.classList.add("js");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector(".header");
const progress = document.getElementById("progress");
const loader = document.getElementById("loader");

let introSeen = false;
try {
  introSeen = sessionStorage.getItem("orlova-intro") === "1";
} catch {
  introSeen = true;
}

function markReady() {
  document.body.classList.add("is-ready");
}

if (!loader || reduce || introSeen) {
  loader?.remove();
  markReady();
} else {
  window.addEventListener("load", () => {
    try { sessionStorage.setItem("orlova-intro", "1"); } catch { /* private mode */ }
    window.setTimeout(() => {
      loader.classList.add("is-done");
      markReady();
    }, 980);
    window.setTimeout(() => loader.remove(), 1900);
  });
}

const nav = document.getElementById("nav");
const navToggle = document.querySelector(".nav-toggle");

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-lock", open);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-lock");
    });
  });
}

window.addEventListener(
  "scroll",
  () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (!progress) return;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const value = height > 0 ? (window.scrollY / height) * 100 : 0;
    progress.style.width = `${value}%`;
  },
  { passive: true }
);

const reveals = document.querySelectorAll(".reveal");
if (reveals.length && !reduce && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  requestAnimationFrame(() => {
    reveals.forEach((el) => observer.observe(el));
  });
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

const strip = document.getElementById("strip");
if (strip) {
  const prev = document.querySelector("[data-strip='-1']");
  const next = document.querySelector("[data-strip='1']");
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  const scrollByDir = (dir) => {
    strip.scrollBy({ left: dir * Math.min(strip.clientWidth * 0.72, 520), behavior: reduce ? "auto" : "smooth" });
  };

  prev?.addEventListener("click", () => scrollByDir(-1));
  next?.addEventListener("click", () => scrollByDir(1));

  strip.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = strip.scrollLeft;
    strip.classList.add("is-grabbing");
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
    strip.classList.remove("is-grabbing");
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 6) moved = true;
    strip.scrollLeft = startScroll - delta;
  });

  strip.addEventListener(
    "click",
    (event) => {
      if (!moved) return;
      event.preventDefault();
      moved = false;
    },
    true
  );
}

const grid = document.getElementById("catalog");
const viewer = document.getElementById("viewer");

if (grid && viewer) {
  const filters = document.querySelectorAll(".filter");
  const count = document.getElementById("count");
  const image = document.getElementById("viewer-image");
  const title = document.getElementById("viewer-title");
  const sub = document.getElementById("viewer-sub");
  const series = document.getElementById("viewer-series");
  const counter = document.getElementById("viewer-count");
  let current = 0;

  const pieces = () => [...grid.querySelectorAll(".piece:not(.is-hidden)")];

  const label = (n) => {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return `${n} работа`;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `${n} работы`;
    return `${n} работ`;
  };

  const applyFilter = (kind) => {
    grid.querySelectorAll(".piece").forEach((piece) => {
      const show = kind === "all" || piece.dataset.kind === kind;
      piece.classList.toggle("is-hidden", !show);
    });
    if (count) count.textContent = label(pieces().length);
  };

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      filters.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      applyFilter(button.dataset.filter);
      if (viewer.open) viewer.close();
    });
  });

  const render = (index) => {
    const list = pieces();
    if (!list.length) return;
    current = (index + list.length) % list.length;
    const piece = list[current];
    const source = piece.querySelector("img");
    image.src = source.src;
    image.alt = source.alt;
    title.textContent = piece.querySelector(".piece-title").textContent;
    sub.textContent = piece.querySelector(".piece-sub").textContent;
    series.textContent = `${piece.dataset.year} · серия «${piece.dataset.series}»`;
    counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
  };

  const openAt = (index) => {
    render(index);
    if (!viewer.open) viewer.showModal();
  };

  grid.addEventListener("click", (event) => {
    const piece = event.target.closest(".piece");
    if (!piece || piece.classList.contains("is-hidden")) return;
    const index = pieces().indexOf(piece);
    if (index >= 0) openAt(index);
  });

  document.getElementById("viewer-prev")?.addEventListener("click", () => render(current - 1));
  document.getElementById("viewer-next")?.addEventListener("click", () => render(current + 1));
  document.getElementById("viewer-close")?.addEventListener("click", () => viewer.close());

  viewer.addEventListener("click", (event) => {
    const quiet = event.target === viewer || event.target.classList.contains("viewer-stage");
    if (quiet) viewer.close();
  });

  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") render(current + 1);
    if (event.key === "ArrowLeft") render(current - 1);
  });

  let touchX = 0;
  viewer.addEventListener(
    "touchstart",
    (event) => {
      touchX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );
  viewer.addEventListener(
    "touchend",
    (event) => {
      const delta = event.changedTouches[0].clientX - touchX;
      if (delta > 48) render(current - 1);
      if (delta < -48) render(current + 1);
    },
    { passive: true }
  );

  applyFilter("all");
}

if (location.hash) {
  const target = document.querySelector(location.hash);
  if (target) {
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      target.classList.add("is-target");
    }, 80);
  }
}
