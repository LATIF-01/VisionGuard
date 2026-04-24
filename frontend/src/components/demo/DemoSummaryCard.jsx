/**
 * AI summary metrics + short narrative paragraph.
 */
export default function DemoSummaryCard({ heading, summary, metricLabels }) {
  const { peopleDetected, eventsDetected, suspiciousEvents, paragraph } = summary;

  return (
    <div className="demo-summary-card card p-4 glass border-white/10">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-vg-text-muted mb-3">{heading}</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="demo-metric-tile rounded-lg p-2 text-center border border-white/5 bg-white/[0.03]">
          <p className="text-lg font-bold text-white tabular-nums">{peopleDetected}</p>
          <p className="text-[10px] uppercase tracking-wide text-vg-text-muted leading-tight mt-1">{metricLabels.people}</p>
        </div>
        <div className="demo-metric-tile rounded-lg p-2 text-center border border-white/5 bg-white/[0.03]">
          <p className="text-lg font-bold text-vg-accent-light tabular-nums">{eventsDetected}</p>
          <p className="text-[10px] uppercase tracking-wide text-vg-text-muted leading-tight mt-1">{metricLabels.events}</p>
        </div>
        <div className="demo-metric-tile rounded-lg p-2 text-center border border-vg-warning/20 bg-vg-warning/5">
          <p className="text-lg font-bold text-vg-warning tabular-nums">{suspiciousEvents}</p>
          <p className="text-[10px] uppercase tracking-wide text-vg-text-muted leading-tight mt-1">{metricLabels.suspicious}</p>
        </div>
      </div>
      <p className="text-sm text-vg-text-muted leading-relaxed border-t border-white/10 pt-3">{paragraph}</p>
    </div>
  );
}
