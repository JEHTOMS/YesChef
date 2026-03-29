// Shared mutable state for timer <-> voice coordination.
// Both VoiceContext and Directions import this module.
// The object is a singleton stable across the app lifecycle.

const timerBridge = {
  // Currently running timers tracked by voice: { '2-3': { stepIndex, seconds, label, remaining, _notified } }
  activeTimers: {},

  // Pending timer offer: set by VoiceContext when asking "should I start the timer?"
  // Cleared after user responds. Shape: { stepIndex, seconds, label }
  pendingTimerOffer: null,

  // Callback registered by Directions on mount so VoiceContext can start timers programmatically.
  // Signature: (stepIndex, timeText, seconds) => void
  startTimerFn: null,
};

export default timerBridge;
