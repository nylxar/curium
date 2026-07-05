import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import icon from "../icon.png";

export function Splash() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remove the HTML splash immediately — React takes over
    const htmlSplash = document.getElementById("curium-splash");
    if (htmlSplash) {
      htmlSplash.style.transition = "none";
      htmlSplash.style.display = "none";
      htmlSplash.remove();
    }

    const tl = gsap.timeline();

    tl.fromTo(
      iconRef.current,
      { scale: 0.5, opacity: 0, rotate: -8 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: "back.out(1.7)" },
    )
      .fromTo(
        textRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "-=0.2",
      )
      .to(containerRef.current, {
        opacity: 0,
        scale: 0.96,
        duration: 0.45,
        ease: "power3.inOut",
        delay: 0.8,
        onComplete: () => containerRef.current?.remove(),
      });
  }, []);

  return (
    <div ref={containerRef} className="splash">
      <img ref={iconRef} src={icon} alt="Curium" className="splash-icon" />
      <div ref={textRef} className="splash-text">Curium</div>
    </div>
  );
}
