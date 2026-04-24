/**
 * Full-area overlay shown during fake analysis with stepped status list.
 */
export default function DemoAnalyzeOverlay({ visible, activeStepIndex, stepLabels }) {
  if (!visible) return null;

  return (
    <div className="demo-analyze-overlay absolute inset-0 z-20 flex items-center justify-center p-4 rounded-xl">
      <div className="demo-analyze-card glass max-w-md w-full rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="demo-analyze-spinner w-10 h-10 rounded-full border-2 border-vg-accent/30 border-t-vg-accent" />
          <div>
            <p className="text-white font-semibold">VisionGuard</p>
            <p className="text-vg-text-muted text-sm">Pipeline preview (mock)</p>
          </div>
        </div>
        <ul className="space-y-3">
          {stepLabels.map((label, index) => {
            const done = index < activeStepIndex;
            const active = index === activeStepIndex;
            return (
              <li
                key={`analyze-step-${index}`}
                className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2 transition-colors ${
                  active ? 'bg-vg-accent/15 text-vg-accent-light' : done ? 'text-vg-text-muted' : 'text-slate-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    done ? 'bg-vg-success' : active ? 'bg-vg-accent animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className={active ? 'font-medium' : ''}>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
