/**
 * Suave animação de ondas ao fundo do portal.
 * Fica fixed atrás de tudo, pointer-events none, decorativo.
 */
export function WaveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.97_0.03_240)_0%,oklch(0.99_0.005_250)_55%,var(--background)_100%)]" />

      {/* Slow drifting blobs */}
      <div className="absolute -left-32 top-40 h-[520px] w-[520px] rounded-full bg-[oklch(0.85_0.09_240/0.35)] blur-3xl animate-blob-a" />
      <div className="absolute -right-24 top-[520px] h-[420px] w-[420px] rounded-full bg-[oklch(0.8_0.11_225/0.28)] blur-3xl animate-blob-b" />
      <div className="absolute left-1/3 top-[1100px] h-[380px] w-[380px] rounded-full bg-[oklch(0.88_0.07_255/0.3)] blur-3xl animate-blob-c" />

      {/* Layered SVG waves — bottom */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[220px] w-full"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveA" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.14 245)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="oklch(0.6 0.18 255)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="waveB" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.11 235)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="oklch(0.7 0.14 250)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path
          className="animate-wave-slow"
          fill="url(#waveA)"
          d="M0,120 C240,180 480,60 720,120 C960,180 1200,60 1440,120 L1440,220 L0,220 Z"
        />
        <path
          className="animate-wave-fast"
          fill="url(#waveB)"
          d="M0,150 C300,90 600,210 900,150 C1200,90 1440,180 1440,150 L1440,220 L0,220 Z"
        />
      </svg>

      {/* Layered SVG waves — top (subtle) */}
      <svg
        className="absolute inset-x-0 top-0 h-[140px] w-full rotate-180"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
      >
        <path
          className="animate-wave-slow"
          fill="oklch(0.72 0.14 245 / 0.08)"
          d="M0,80 C360,20 720,140 1080,80 C1260,50 1380,90 1440,80 L1440,140 L0,140 Z"
        />
      </svg>
    </div>
  );
}
