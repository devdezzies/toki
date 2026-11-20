// ---------- the walkthrough film (film.js, concatenated after demo.js on toki-film.html only) ----------
// film/record.mjs drives the page on a virtual clock (the head script replaces requestAnimationFrame and
// performance.now): __film.start() plays the story from t = 0, and each __film.step() advances one frame and draws it.
// Subtitles, chapter cards, title cards and the fades to and from black are computed from demo.t, so every frame is exact.
{
  const F = DATA.film;
  const card = document.querySelector("[data-film-card]");
  const cardTitle = card.querySelector("h1"), cardSub = card.querySelector("p");
  const chap = document.querySelector("[data-film-chapter]");
  const chapN = chap.querySelector(".n"), chapT = chap.querySelector(".t");
  const black = document.querySelector("[data-film-black]");
  const index = Object.fromEntries(DM.chapters.map((c, i) => [c.id, i]));
  const ramp = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  const sameSub = (a, b) => Boolean(a && b && a.sub && b.sub && a.sub.en === b.sub.en);
  const sameCard = (a, b) => Boolean(a && b && a.card && b.card && a.card.title === b.card.title && a.card.sub === b.card.sub);
  let shownCard = "", shownChap = "", cardK = 0;
  function overlay() {
    const t = demo.t;
    const i = Math.max(0, demo.shot);
    const s = SHOTS[i], prev = SHOTS[i - 1], next = SHOTS[i + 1];
    const u = t - starts[i], left = starts[i] + s.dur - t;
    // subtitles fade in and out at the edges of their shot
    if (ui.sub) ui.sub.style.opacity = s.sub ? Math.min(sameSub(prev, s) ? 1 : ramp(u, 0, 0.25), sameSub(s, next) ? 1 : ramp(left, 0, 0.3)).toFixed(3) : "0";
    // the title card, over a run of shots that carry it (the last one stays up into the fade to black)
    if (s.card) {
      const key = `${s.card.title}|${s.card.sub}`;
      if (key !== shownCard) {
        shownCard = key;
        cardTitle.textContent = s.card.title;
        cardSub.textContent = s.card.sub;
      }
      cardK = Math.min(sameCard(prev, s) ? 1 : ramp(u, 0, 1.1), sameCard(s, next) || !next ? 1 : ramp(left, 0, 1.1));
      card.style.opacity = Math.min(sameCard(prev, s) ? 1 : ramp(u, 0.2, 1.1), sameCard(s, next) || !next ? 1 : ramp(left, 0, 0.7)).toFixed(3);
    } else {
      cardK = 0;
      card.style.opacity = "0";
    }
    // while a title card is up, the stage slides right so the card has the left of the frame (eased with the card)
    const k = cardK * cardK * (3 - 2 * cardK);
    stage.style.transform = k > 0.001 ? `translateX(${(k * F.width * F.cardShift).toFixed(1)}px)` : "";
    // the chapter card, for a few seconds from each chapter's start
    if (F.cards.includes(s.ch)) {
      const e = t - chapterStart[s.ch];
      const c = DM.chapters[index[s.ch]];
      const key = c.id;
      if (key !== shownChap) {
        shownChap = key;
        chapN.textContent = String(index[s.ch] + 1).padStart(2, "0");
        chapT.textContent = c.en;
      }
      chap.style.opacity = Math.min(ramp(e, 0.2, 0.7), 1 - ramp(e, F.chapterCard - 0.6, F.chapterCard)).toFixed(3);
    } else chap.style.opacity = "0";
    black.style.opacity = Math.max(1 - ramp(t, 0, F.fadeIn), ramp(t, total - F.fadeOut, total - 0.05)).toFixed(3);
  }
  const frame = 1000 / F.fps;
  window.__film = {
    fps: F.fps,
    duration: total,
    frames: Math.floor(total * F.fps),
    // play from the top; prime the loop once so every later step is exactly one frame of demo time
    start() {
      play();
      window.__filmAdvance(frame);
      seek(0);
      overlay();
      return { t: demo.t, shot: demo.shot };
    },
    step() {
      window.__filmAdvance(frame);
      overlay();
      return demo.t;
    },
    // jump to time t (for stills): seek, then let the camera settle on that shot for a moment of virtual time
    at(t, settle = 2.5) {
      seek(Math.max(0, t - settle));
      for (let k = 0; k < settle * F.fps; k++) window.__filmAdvance(frame);
      overlay();
      return demo.t;
    },
  };
}
