// Shared time-parsing utilities used by Directions.jsx and VoiceContext.jsx

// Regex to match time expressions in step text (e.g., "5 minutes", "1:30", "90s", "1.5 hours")
export const TIME_PATTERN = /\b(?:about\s+)?(\d+(?:\.\d+)?(?::\d{1,2})?)\s*(?:to\s+\d+\s*)?(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|seconds)\b/gi;

// Parse a time value string into seconds.
// Accepts numbers (minutes), strings like '5', '5 mins', '1:30', '90s', or hours like '1.5 hours', '1 hr', '2h'.
export function parseTimeToSeconds(timeValue) {
  if (timeValue == null) return 0;
  // If already a finite number, assume minutes
  if (typeof timeValue === 'number' && Number.isFinite(timeValue)) {
    return Math.max(0, Math.floor(timeValue * 60));
  }
  const s = String(timeValue).trim();
  if (!s) return 0;

  // If format mm:ss or m:ss
  if (/^\d+:\d{1,2}$/.test(s)) {
    const [mins, secs] = s.split(':').map(Number);
    if (Number.isFinite(mins) && Number.isFinite(secs)) {
      return Math.max(0, mins * 60 + Math.floor(secs));
    }
  }

  // Hours like '1.5 hours', '1 hr', '2h'
  const hoursMatch = s.match(/([0-9]*\.?[0-9]+)\s*(h|hr|hrs|hour|hours)\b/i);
  if (hoursMatch) {
    const num = Number(hoursMatch[1]);
    if (Number.isFinite(num)) return Math.max(0, Math.floor(num * 3600));
  }

  // If contains seconds unit like '90s' or '30 sec'
  const secondsMatch = s.match(/(\d+)\s*s(ec)?/i);
  if (secondsMatch) return Math.max(0, Number(secondsMatch[1]));

  // Extract a leading number (could be minutes)
  const numMatch = s.match(/([0-9]*\.?[0-9]+)/);
  if (numMatch) {
    const num = Number(numMatch[1]);
    if (Number.isFinite(num)) {
      // default assume minutes unless string contains 'sec' or 's'
      const isSeconds = /sec|s\b/i.test(s) && !/min/i.test(s);
      return Math.max(0, Math.floor(isSeconds ? num : num * 60));
    }
  }

  return 0;
}

// Extract all timer references from step instruction text.
// Returns [{ text: "5 minutes", seconds: 300, matchIndex: 42 }, ...]
export function extractTimersFromStep(stepText) {
  if (!stepText) return [];
  const timers = [];
  let match;
  TIME_PATTERN.lastIndex = 0;
  while ((match = TIME_PATTERN.exec(stepText)) !== null) {
    const seconds = parseTimeToSeconds(match[0]);
    if (seconds > 0) {
      timers.push({ text: match[0], seconds, matchIndex: match.index });
    }
  }
  return timers;
}
