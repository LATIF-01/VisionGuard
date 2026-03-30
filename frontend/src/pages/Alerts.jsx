import { mockAlerts } from '../data/mockAlerts';

const severityConfig = {
  critical: {
    bg: 'bg-vg-critical/10',
    border: 'border-vg-critical/30',
    badge: 'bg-vg-critical text-white',
    icon: '🚨',
    label: 'Critical',
  },
  warning: {
    bg: 'bg-vg-warning/10',
    border: 'border-vg-warning/30',
    badge: 'bg-vg-warning text-black',
    icon: '⚠️',
    label: 'Warning',
  },
  info: {
    bg: 'bg-vg-info/10',
    border: 'border-vg-info/30',
    badge: 'bg-vg-info text-white',
    icon: 'ℹ️',
    label: 'Info',
  },
};

export default function Alerts() {
  const criticalCount = mockAlerts.filter(a => a.type === 'critical').length;
  const warningCount = mockAlerts.filter(a => a.type === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Alerts</h1>
          <p className="text-vg-text-muted mt-1">Monitor and respond to detected events</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-vg-critical/20 text-vg-critical text-sm font-medium">
            {criticalCount} Critical
          </span>
          <span className="px-3 py-1.5 rounded-full bg-vg-warning/20 text-vg-warning text-sm font-medium">
            {warningCount} Warnings
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <FilterButton active>All Alerts</FilterButton>
        <FilterButton>Critical</FilterButton>
        <FilterButton>Warnings</FilterButton>
        <FilterButton>Info</FilterButton>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {mockAlerts.map((alert, index) => (
          <AlertCard 
            key={alert.id} 
            alert={alert} 
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      {/* Load more */}
      <div className="text-center pt-4">
        <button className="btn-ghost text-sm px-6 py-2">
          Load More Alerts
        </button>
      </div>
    </div>
  );
}

function FilterButton({ children, active = false }) {
  return (
    <button
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${active 
          ? 'bg-vg-accent/20 text-vg-accent border border-vg-accent/30' 
          : 'text-vg-text-muted hover:bg-white/5 hover:text-white'
        }
      `}
    >
      {children}
    </button>
  );
}

function AlertCard({ alert, style }) {
  const config = severityConfig[alert.type];
  const timestamp = new Date(alert.timestamp);
  
  return (
    <div 
      className={`
        card p-4 cursor-pointer animate-fade-in
        ${config.bg} ${config.border} border
        hover:border-opacity-60 transition-all duration-200
      `}
      style={style}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Icon and content */}
        <div className="flex gap-4 flex-1">
          {/* Severity icon */}
          <div className="text-2xl flex-shrink-0">{config.icon}</div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-white font-semibold truncate">{alert.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                {config.label}
              </span>
            </div>
            <p className="text-vg-text-muted text-sm mb-2 line-clamp-2">{alert.description}</p>
            <div className="flex items-center gap-4 text-xs text-vg-text-muted">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {alert.camera}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {alert.confidence}% confidence
              </span>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-right flex-shrink-0">
          <p className="text-white text-sm font-medium">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-vg-text-muted text-xs">
            {timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
