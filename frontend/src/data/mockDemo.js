/**
 * Mock data for VisionGuard Demo page (presentation only).
 * Replace scenario fields with API responses later; keep shapes stable for UI mapping.
 */

/** i18n keys for the fake analyze overlay sequence */
export const DEMO_ANALYZE_STEP_KEYS = [
  'demo.step.extracting',
  'demo.step.detecting',
  'demo.step.timeline',
  'demo.step.summary',
];

/** Suggested prompts shown above the chat input */
export const DEMO_SUGGESTED_PROMPTS = [
  'What happened in this video?',
  'Show suspicious activity',
  'Who stayed longest in the scene?',
  'Summarize events by time',
];

const baseChatIntro = (scenarioTitle) => [
  {
    id: 'sys-1',
    role: 'assistant',
    content: `**VisionGuard** — scenario loaded: *${scenarioTitle}*\n\nThis is a frontend-only demo. Responses are canned for poster presentation.`,
  },
];

/** @typedef {'normal' | 'warning' | 'critical'} DemoSeverity */

/**
 * @typedef {Object} DemoTimelineEvent
 * @property {string} id
 * @property {string} timeLabel
 * @property {string} text
 * @property {DemoSeverity} severity
 */

/**
 * @typedef {Object} DemoScenario
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {DemoSeverity} severity
 * @property {string | null} videoSrc — public URL e.g. `/videos/cam1.mp4`; null shows placeholder
 * @property {{ peopleDetected: number, eventsDetected: number, suspiciousEvents: number, paragraph: string }} summary
 * @property {DemoTimelineEvent[]} timeline
 */

/** @type {DemoScenario[]} */
export const DEMO_SCENARIOS = [
  {
    id: 'parking-loiter',
    title: 'Parking Area – Suspicious Loitering',
    subtitle: 'Synthetic demo · 02:14',
    severity: 'warning',
    videoSrc: '/videos/cam2.mp4',
    summary: {
      peopleDetected: 4,
      eventsDetected: 12,
      suspiciousEvents: 2,
      paragraph:
        'One individual remained near the entrance column for an extended period with minimal movement. Two secondary persons crossed the frame without interaction. Pattern consistent with loitering watchlist heuristics (demo).',
    },
    timeline: [
      { id: 't1', timeLabel: '00:08', text: 'Person entered scene', severity: 'normal' },
      { id: 't2', timeLabel: '00:21', text: 'Stayed near door', severity: 'warning' },
      { id: 't3', timeLabel: '00:33', text: 'Suspicious loitering detected', severity: 'warning' },
      { id: 't4', timeLabel: '00:47', text: 'Interaction near restricted zone', severity: 'critical' },
      { id: 't5', timeLabel: '01:02', text: 'Subject departed frame', severity: 'normal' },
    ],
  },
  {
    id: 'entrance-multi',
    title: 'Main Entrance – Multiple Entries',
    subtitle: 'Synthetic demo · 01:48',
    severity: 'normal',
    videoSrc: '/videos/cam1.mp4',
    summary: {
      peopleDetected: 9,
      eventsDetected: 18,
      suspiciousEvents: 0,
      paragraph:
        'Elevated foot traffic during a 12-minute window. All entries aligned with typical arrival bursts. No tailgating or forced entry signatures in this mock run.',
    },
    timeline: [
      { id: 't1', timeLabel: '00:05', text: 'First group entered', severity: 'normal' },
      { id: 't2', timeLabel: '00:19', text: 'Door held open (courtesy)', severity: 'normal' },
      { id: 't3', timeLabel: '00:41', text: 'Peak density: 6 persons in FOV', severity: 'normal' },
      { id: 't4', timeLabel: '01:10', text: 'Traffic normalized', severity: 'normal' },
    ],
  },
  {
    id: 'hallway-normal',
    title: 'Hallway – Normal Movement',
    subtitle: 'Synthetic demo · 01:22',
    severity: 'normal',
    videoSrc: '/videos/cam3.mp4',
    summary: {
      peopleDetected: 3,
      eventsDetected: 6,
      suspiciousEvents: 0,
      paragraph:
        'Continuous ambulatory traffic with expected dwell times at intersections. No anomalies flagged in demo classifier output.',
    },
    timeline: [
      { id: 't1', timeLabel: '00:12', text: 'Person A passed eastbound', severity: 'normal' },
      { id: 't2', timeLabel: '00:28', text: 'Person B passed westbound', severity: 'normal' },
      { id: 't3', timeLabel: '00:55', text: 'Brief overlap at junction', severity: 'normal' },
    ],
  },
  {
    id: 'restricted-unauth',
    title: 'Restricted Zone – Unauthorized Presence',
    subtitle: 'Synthetic demo · 02:05',
    severity: 'critical',
    videoSrc: '/videos/cam4.mp4',
    summary: {
      peopleDetected: 2,
      eventsDetected: 9,
      suspiciousEvents: 3,
      paragraph:
        'Unauthorized presence detected inside a policy-controlled region. Extended dwell and approach toward secure door. Escalation recommended in a live deployment (mock narrative only).',
    },
    timeline: [
      { id: 't1', timeLabel: '00:06', text: 'Boundary crossed without badge', severity: 'critical' },
      { id: 't2', timeLabel: '00:22', text: 'Stopped at secure door', severity: 'warning' },
      { id: 't3', timeLabel: '00:40', text: 'Unauthorized presence sustained', severity: 'critical' },
      { id: 't4', timeLabel: '01:05', text: 'Exit toward service corridor', severity: 'warning' },
    ],
  },
];

/**
 * @param {string} scenarioId
 * @returns {DemoScenario | undefined}
 */
export function getDemoScenarioById(scenarioId) {
  return DEMO_SCENARIOS.find((s) => s.id === scenarioId);
}

/**
 * Build initial chat messages for a scenario (mock).
 * @param {DemoScenario} scenario
 */
export function buildInitialChatMessages(scenario) {
  return [...baseChatIntro(scenario.title)];
}

/** Mock assistant replies keyed by normalized prompt prefix (demo only) */
const MOCK_REPLY_MAP = [
  {
    match: (q) => /what happened/i.test(q),
    reply:
      '**Timeline overview (demo):** entry patterns, dwell near thresholds, and any policy hits would appear here. Use the event timeline on the right for minute-level detail.',
  },
  {
    match: (q) => /suspicious/i.test(q),
      reply:
        '**Suspicious activity (demo):** flagged intervals correlate with loitering and zone violations in this scenario. In production this would link to clip timestamps and detector scores.',
  },
  {
    match: (q) => /longest|stayed/i.test(q),
    reply:
      '**Dwell analysis (demo):** longest stationary track is attributed to the primary subject near the door region (~45s simulated). Real ranking would use tracker IDs from the pipeline.',
  },
  {
    match: (q) => /summarize|time/i.test(q),
    reply:
      '**By time (demo):** early segment shows approach; mid segment shows sustained presence; late segment shows exit. See the scrollable timeline for exact mock timestamps.',
  },
];

/**
 * @param {string} userText
 * @returns {string}
 */
export function getMockAssistantReply(userText) {
  const trimmed = userText.trim();
  for (const { match, reply } of MOCK_REPLY_MAP) {
    if (match(trimmed)) return reply;
  }
  return '**Demo response:** I can correlate detections, timelines, and policy rules once the backend and LLM are connected. For now this is a canned investigation-console preview.';
}
