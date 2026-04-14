/**
 * Offline demo alerts — aligned with config/alert_rules.json (rule names, severities, message style).
 * Shown only when the API is unreachable (see Alerts.jsx).
 */
export const mockAlerts = [
  {
    id: 1,
    type: 'warning',
    title: 'high_conf_any_action',
    description:
      'high_conf_any_action: subject 3 is performing \'running\' with score 0.84.',
    camera: 'Latest run',
    timestamp: '2026-03-30T00:45:23',
    confidence: 84,
  },
  {
    id: 2,
    type: 'critical',
    title: 'violent_actions',
    description:
      "Potential violent behavior detected for subject 1: 'wrestling' (score 0.58).",
    camera: 'Latest run',
    timestamp: '2026-03-30T00:32:15',
    confidence: 58,
  },
  {
    id: 3,
    type: 'warning',
    title: 'high_conf_any_action',
    description:
      'high_conf_any_action: subject 7 is performing \'standing\' with score 0.91.',
    camera: 'Latest run',
    timestamp: '2026-03-30T00:28:47',
    confidence: 91,
  },
  {
    id: 4,
    type: 'critical',
    title: 'violent_actions',
    description:
      "Potential violent behavior detected for subject 2: 'fighting' (score 0.62).",
    camera: 'Latest run',
    timestamp: '2026-03-29T23:55:12',
    confidence: 62,
  },
];
