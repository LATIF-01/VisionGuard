export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Deep navy base gradient — the "wallpaper" canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020918] via-[#050c1a] to-[#061525]" />

      {/* Radial spotlight — soft sky-blue glow from top-center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(14,165,233,0.18),transparent_65%)]" />

      {/* Silk wave mesh — two overlapping radial bands that give the flowing "wave" look */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_40%_at_20%_80%,rgba(30,64,175,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_35%_at_80%_30%,rgba(14,165,233,0.12),transparent_55%)]" />

      {/* Blob 1 — deep dark blue, large, drifts top-left */}
      <div className="liquid-blob liquid-blob-1" />
      {/* Blob 2 — sky blue, replaces old purple, drifts top-right */}
      <div className="liquid-blob liquid-blob-2" />
      {/* Blob 3 — light sky blue, drifts bottom-center */}
      <div className="liquid-blob liquid-blob-3" />
      {/* Blob 4 — dark navy accent, subtle, mid-right depth layer */}
      <div className="liquid-blob liquid-blob-4" />

      {/* Fine noise/grain overlay for the iOS "silk" texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
        }}
      />
    </div>
  );
}
