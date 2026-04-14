export const mockChatHistory = [
  {
    id: 1,
    role: 'user',
    content: 'Show me any suspicious activity in the parking lot over the last 2 hours.',
    timestamp: '2026-03-30T00:15:00',
  },
  {
    id: 2,
    role: 'assistant',
    content: `I found 3 events in the parking lot during the last 2 hours:

1. **00:28** - Loitering detected near entrance gate. Individual remained stationary for 12 minutes. (76% confidence)

2. **23:55** - Unusual gathering of 4 individuals near vehicle bay C. Duration: 8 minutes before dispersing.

3. **22:18** - Unregistered vehicle (License: ABC-1234) entered facility. No matching records in authorized database.

Would you like me to pull up the video clips for any of these events?`,
    timestamp: '2026-03-30T00:15:05',
  },
  {
    id: 3,
    role: 'user',
    content: 'Yes, show me the video for the loitering incident.',
    timestamp: '2026-03-30T00:16:00',
  },
  {
    id: 4,
    role: 'assistant',
    content: `Here's the video clip for the loitering incident at 00:28:

📹 **CAM 02 - Parking Lot**
Duration: 12 minutes 34 seconds
Time range: 00:28:47 - 00:41:21

The individual was detected standing near the entrance gate. Movement pattern analysis shows minimal displacement with occasional phone usage. No interaction with other individuals or vehicles was observed.

**Risk Assessment:** Medium
**Recommended Action:** Review and flag for follow-up if individual returns within 24 hours.`,
    timestamp: '2026-03-30T00:16:08',
  },
  {
    id: 5,
    role: 'user',
    content: 'Were there any falls detected today?',
    timestamp: '2026-03-30T00:20:00',
  },
  {
    id: 6,
    role: 'assistant',
    content: `Yes, I detected 1 fall incident today:

**Fall Detected - CAM 03 Hallway A**
- Time: 00:32:15
- Confidence: 89%
- Duration before recovery: 45 seconds
- Individual appeared to recover independently
- No medical assistance was dispatched

The fall occurred near the east stairwell. Video analysis shows the individual tripped on an unmarked obstacle. I recommend reviewing floor hazard protocols for this area.

Would you like me to generate a safety report for this incident?`,
    timestamp: '2026-03-30T00:20:06',
  },
];
