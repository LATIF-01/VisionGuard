/**
 * Scrollable event feed with severity-based accent colors.
 */
export default function DemoTimeline({ heading, events, isReady, visibleCount, skeletonLabel, animateSkeleton }) {
  const skeletonClass = animateSkeleton ? 'demo-skeleton-block' : 'demo-skeleton-block demo-skeleton-block--static';

  if (!isReady) {
    return (
      <div className="demo-timeline-card card flex flex-col min-h-0 flex-1 glass border-white/10 overflow-hidden">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-vg-text-muted p-4 pb-2 shrink-0">{heading}</h3>
        <div className="demo-timeline-scroll px-4 pb-4 flex-1 overflow-y-auto space-y-2">
          <div className={`h-14 rounded-lg ${skeletonClass}`} />
          <div className={`h-14 rounded-lg ${skeletonClass}`} />
          <div className={`h-14 rounded-lg ${skeletonClass}`} />
          <p className="text-xs text-vg-text-muted pt-2">{skeletonLabel}</p>
        </div>
      </div>
    );
  }

  const visibleEvents = events.slice(0, visibleCount);

  return (
    <div className="demo-timeline-card card flex flex-col min-h-0 flex-1 glass border-white/10 overflow-hidden">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-vg-text-muted p-4 pb-2 shrink-0">{heading}</h3>
      <div className="demo-timeline-scroll px-4 pb-4 flex-1 overflow-y-auto space-y-2">
        {visibleEvents.map((ev) => (
          <div
            key={ev.id}
            className={`demo-timeline-row demo-event-reveal rounded-lg px-3 py-2.5 border-l-2 text-sm ${
              ev.severity === 'critical'
                ? 'border-vg-critical bg-vg-critical/10 demo-timeline-row--critical'
                : ev.severity === 'warning'
                  ? 'border-vg-warning bg-vg-warning/10'
                  : 'border-vg-info bg-vg-info/10'
            }`}
          >
            <div className="flex gap-2 items-baseline">
              <span className="font-mono text-xs text-vg-text-muted shrink-0 w-12">{ev.timeLabel}</span>
              <span
                className={
                  ev.severity === 'critical'
                    ? 'text-red-200 demo-critical-text'
                    : ev.severity === 'warning'
                      ? 'text-amber-100'
                      : 'text-slate-200'
                }
              >
                {ev.text}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
