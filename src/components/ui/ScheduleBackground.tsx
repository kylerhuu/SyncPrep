"use client";

/**
 * Schedule page background: neural texture + localized card glow only.
 * Dark page first; neural is sparse, embedded, concentrated toward edges.
 */
export function ScheduleBackground() {
  return (
    <>
      <div className="schedule-neural" aria-hidden role="presentation">
        <svg
          className="schedule-neural-svg"
          viewBox="0 0 640 520"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="neural-node-dim">
              <stop offset="0%" stopColor="rgba(255, 170, 95, 0.06)" />
              <stop offset="100%" stopColor="rgba(255, 140, 60, 0)" />
            </radialGradient>
            <radialGradient id="neural-node-glow">
              <stop offset="0%" stopColor="rgba(255, 180, 100, 0.1)" />
              <stop offset="100%" stopColor="rgba(255, 150, 70, 0)" />
            </radialGradient>
          </defs>
          <g>
            {/* Sparse lines - only nearby nodes, ultra-thin */}
            <line x1="40" y1="90" x2="95" y2="85" className="neural-line" />
            <line x1="95" y1="85" x2="150" y2="95" className="neural-line" />
            <line x1="280" y1="88" x2="335" y2="82" className="neural-line" />
            <line x1="335" y1="82" x2="390" y2="92" className="neural-line" />
            <line x1="520" y1="100" x2="565" y2="140" className="neural-line" />
            <line x1="75" y1="165" x2="130" y2="158" className="neural-line" />
            <line x1="130" y1="158" x2="185" y2="168" className="neural-line" />
            <line x1="310" y1="155" x2="365" y2="148" className="neural-line" />
            <line x1="455" y1="145" x2="500" y2="175" className="neural-line" />
            <line x1="60" y1="235" x2="115" y2="228" className="neural-line" />
            <line x1="115" y1="228" x2="170" y2="238" className="neural-line" />
            <line x1="340" y1="225" x2="395" y2="218" className="neural-line" />
            <line x1="395" y1="218" x2="450" y2="228" className="neural-line" />
            <line x1="125" y1="305" x2="180" y2="298" className="neural-line" />
            <line x1="180" y1="298" x2="235" y2="308" className="neural-line" />
            <line x1="380" y1="295" x2="435" y2="288" className="neural-line" />
            <line x1="95" y1="85" x2="88" y2="158" className="neural-line" />
            <line x1="355" y1="82" x2="348" y2="148" className="neural-line" />
            <line x1="118" y1="228" x2="125" y2="298" className="neural-line" />
            <line x1="25" y1="180" x2="72" y2="175" className="neural-line" />
            <line x1="598" y1="220" x2="565" y2="260" className="neural-line" />
            <line x1="200" y1="385" x2="255" y2="378" className="neural-line" />
            <line x1="420" y1="410" x2="475" y2="400" className="neural-line" />

            {/* Nodes: 1.5–2.5px, most dim, few glow */}
            <circle cx="40" cy="90" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="95" cy="85" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="150" cy="95" r="2" className="neural-node neural-node-glow" fill="url(#neural-node-glow)" />
            <circle cx="280" cy="88" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="335" cy="82" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="390" cy="92" r="2" className="neural-node neural-node-glow" fill="url(#neural-node-glow)" />
            <circle cx="520" cy="100" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="565" cy="140" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="75" cy="165" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="130" cy="158" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="185" cy="168" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="310" cy="155" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="365" cy="148" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="455" cy="145" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="60" cy="235" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="115" cy="228" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="170" cy="238" r="2" className="neural-node neural-node-glow" fill="url(#neural-node-glow)" />
            <circle cx="340" cy="225" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="395" cy="218" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="450" cy="228" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="125" cy="305" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="180" cy="298" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="235" cy="308" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="380" cy="295" r="2" className="neural-node neural-node-glow" fill="url(#neural-node-glow)" />
            <circle cx="435" cy="288" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="25" cy="180" r="1.2" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="598" cy="220" r="1.2" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="35" cy="400" r="1.2" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="600" cy="480" r="1.2" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="200" cy="385" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="255" cy="378" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="420" cy="410" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
            <circle cx="475" cy="400" r="1.5" className="neural-node neural-node-dim" fill="url(#neural-node-dim)" />
          </g>
        </svg>
      </div>
      {/* Subtle orange ambient at left/right edges */}
      <div className="schedule-edge-glow schedule-edge-glow-left" aria-hidden />
      <div className="schedule-edge-glow schedule-edge-glow-right" aria-hidden />
      {/* Faint navy/orange radial depth behind content */}
      <div className="schedule-depth-radial" aria-hidden />
      <div className="schedule-card-glow" aria-hidden />
    </>
  );
}
