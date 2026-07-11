// ---------------------------------------------------------------------------
// OvalBackdrop — perspective AFL oval rendered behind the game UI.
// Pure decoration: fixed, pointer-events none, very low opacity so panels
// stay legible. Opacity differs per theme (set via CSS below in tokens-free
// inline styles so it works under both .dirA and .dirB without new tokens).
// ---------------------------------------------------------------------------
import React from "react";

export default function OvalBackdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute"
        style={{
          width: 1100,
          height: 700,
          left: "50%",
          top: "52%",
          transform: "translate(-50%, -50%) perspective(620px) rotateX(54deg)",
          opacity: "var(--fd-oval-opacity, 0.10)",
        }}
      >
        <svg viewBox="0 0 560 360" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Field fill — turf green so it reads as a grass oval (very subtle at backdrop opacity) */}
          <ellipse cx="280" cy="180" rx="276" ry="172" fill="color-mix(in srgb, #1F7A46 34%, transparent)" />
          {/* Mown stripe bands */}
          <ellipse cx="280" cy="180" rx="248" ry="153" stroke="color-mix(in srgb, var(--A-text) 7%, transparent)" strokeWidth="10" fill="none" />
          <ellipse cx="280" cy="180" rx="208" ry="128" stroke="color-mix(in srgb, var(--A-text) 7%, transparent)" strokeWidth="10" fill="none" />
          <ellipse cx="280" cy="180" rx="168" ry="103" stroke="color-mix(in srgb, var(--A-text) 7%, transparent)" strokeWidth="10" fill="none" />
          <ellipse cx="280" cy="180" rx="128" ry="78" stroke="color-mix(in srgb, var(--A-text) 7%, transparent)" strokeWidth="10" fill="none" />
          {/* Boundary */}
          <ellipse cx="280" cy="180" rx="276" ry="172" stroke="color-mix(in srgb, var(--A-text) 55%, transparent)" strokeWidth="1.5" fill="none" />
          {/* Centre line, square, circle */}
          <line x1="4" y1="180" x2="556" y2="180" stroke="color-mix(in srgb, var(--A-text) 22%, transparent)" strokeWidth="1" />
          <rect x="228" y="153" width="104" height="54" stroke="color-mix(in srgb, var(--A-text) 38%, transparent)" strokeWidth="1" fill="none" />
          <circle cx="280" cy="180" r="30" stroke="color-mix(in srgb, var(--A-text) 45%, transparent)" strokeWidth="1.2" fill="none" />
          <circle cx="280" cy="180" r="3" fill="color-mix(in srgb, var(--A-text) 55%, transparent)" />
          {/* 50m arcs */}
          <path d="M88,85 A118,118 0 0 1 88,275" stroke="color-mix(in srgb, var(--A-text) 30%, transparent)" strokeWidth="1.2" fill="none" />
          <path d="M472,85 A118,118 0 0 0 472,275" stroke="color-mix(in srgb, var(--A-text) 30%, transparent)" strokeWidth="1.2" fill="none" />
          {/* Goal squares */}
          <rect x="5" y="157" width="40" height="46" stroke="color-mix(in srgb, var(--A-text) 38%, transparent)" strokeWidth="1" fill="none" />
          <rect x="515" y="157" width="40" height="46" stroke="color-mix(in srgb, var(--A-text) 38%, transparent)" strokeWidth="1" fill="none" />
          {/* Goal posts */}
          {[
            // left top
            { x: 14, y1: 140, y2: 157, w: 1.5, o: 45 }, { x: 26, y1: 130, y2: 157, w: 2.2, o: 70 },
            { x: 38, y1: 130, y2: 157, w: 2.2, o: 70 }, { x: 50, y1: 140, y2: 157, w: 1.5, o: 45 },
            // left bottom
            { x: 14, y1: 203, y2: 220, w: 1.5, o: 45 }, { x: 26, y1: 203, y2: 230, w: 2.2, o: 70 },
            { x: 38, y1: 203, y2: 230, w: 2.2, o: 70 }, { x: 50, y1: 203, y2: 220, w: 1.5, o: 45 },
            // right top
            { x: 510, y1: 140, y2: 157, w: 1.5, o: 45 }, { x: 522, y1: 130, y2: 157, w: 2.2, o: 70 },
            { x: 534, y1: 130, y2: 157, w: 2.2, o: 70 }, { x: 546, y1: 140, y2: 157, w: 1.5, o: 45 },
            // right bottom
            { x: 510, y1: 203, y2: 220, w: 1.5, o: 45 }, { x: 522, y1: 203, y2: 230, w: 2.2, o: 70 },
            { x: 534, y1: 203, y2: 230, w: 2.2, o: 70 }, { x: 546, y1: 203, y2: 220, w: 1.5, o: 45 },
          ].map((p, i) => (
            <line
              key={i}
              x1={p.x} y1={p.y1} x2={p.x} y2={p.y2}
              stroke={`color-mix(in srgb, var(--A-text) ${p.o}%, transparent)`}
              strokeWidth={p.w}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
