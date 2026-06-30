import { gsap } from "gsap";

// ─── Button Bounce (state change: 150ms) ────────────────────────────────────
export function bounceButton(el: HTMLElement) {
  gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.15, ease: "back.out(2)" });
}

// ─── Theme Transition (overlay: 200ms) ──────────────────────────────────────
export function animateThemeTransition() {
  const el = document.querySelector(".app");
  if (!el) return;
  gsap.fromTo(el, { opacity: 0.92 }, { opacity: 1, duration: 0.2, ease: "power1.out" });
}
