import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import { extractTimersFromStep } from '../utils/timeUtils';
import timerBridge from '../timerBridge';
import popSound from '../Pop_sound.mp3';

const VoiceContext = createContext(null);

// Scale ingredient quantities in step text for voice reading
function scaleStepText(text, multiplier) {
  if (!text || multiplier === 1) return text;

  // Time/heat patterns to skip
  const timePattern = /\b(?:about\s+)?(\d+(?:\.\d+)?(?::\d{1,2})?)\s*(?:to\s+\d+\s*)?(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|seconds)\b/gi;
  const heatPattern = /\b\d{2,3}\s*°[FC]?\b|\b\d{2,3}\s*degrees?\s*[FC]?\b/gi;
  const stepNumPattern = /\bstep\s+\d+/gi;

  // Collect positions to skip
  const skipRanges = [];
  let m;
  stepNumPattern.lastIndex = 0;
  while ((m = stepNumPattern.exec(text)) !== null) skipRanges.push([m.index, m.index + m[0].length]);
  timePattern.lastIndex = 0;
  while ((m = timePattern.exec(text)) !== null) skipRanges.push([m.index, m.index + m[0].length]);
  heatPattern.lastIndex = 0;
  while ((m = heatPattern.exec(text)) !== null) skipRanges.push([m.index, m.index + m[0].length]);

  const isSkipped = (start, end) => skipRanges.some(([s, e]) => start < e && end > s);

  const unitWords = '(?:cups?|c\\.?|tbsps?\\.?|tablespoons?|tsps?\\.?|teaspoons?|oz\\.?|ounces?|lbs?\\.?|pounds?|g\\.?|grams?|kg\\.?|ml\\.?|liters?|quarts?|pints?|gallons?|pinch(?:es)?|dash(?:es)?|cloves?|slices?|pieces?|stalks?|sprigs?|cans?|sticks?|heads?)';
  const qtyPattern = new RegExp(`\\b(\\d+(?:\\.\\d+)?(?:\\s*/\\s*\\d+)?(?:\\s+\\d+/\\d+)?)\\s*${unitWords}?\\b`, 'gi');

  let result = '';
  let lastEnd = 0;
  qtyPattern.lastIndex = 0;
  while ((m = qtyPattern.exec(text)) !== null) {
    const numStart = m.index;
    const numEnd = numStart + m[1].length;
    if (isSkipped(numStart, numEnd)) continue;

    const numStr = m[1].trim();
    let val;
    if (numStr.includes('/')) {
      const parts = numStr.split(/\s+/);
      if (parts.length === 2) {
        const [n, d] = parts[1].split('/');
        val = parseFloat(parts[0]) + parseFloat(n) / parseFloat(d);
      } else {
        const [n, d] = parts[0].split('/');
        val = parseFloat(n) / parseFloat(d);
      }
    } else {
      val = parseFloat(numStr);
    }
    if (!Number.isFinite(val) || val <= 0) continue;

    const scaled = val * multiplier;
    const remainder = scaled % 1;
    // Use voice-friendly fractions instead of decimals (TTS reads "7.5" as "7. 5")
    let scaledStr;
    if (Math.abs(remainder) < 0.01) {
      scaledStr = String(Math.round(scaled));
    } else if (Math.abs(remainder - 0.25) < 0.01) {
      scaledStr = `${Math.floor(scaled)} and a quarter`;
    } else if (Math.abs(remainder - 0.5) < 0.01) {
      scaledStr = scaled < 1 ? 'half' : `${Math.floor(scaled)} and a half`;
    } else if (Math.abs(remainder - 0.75) < 0.01) {
      scaledStr = `${Math.floor(scaled)} and three quarters`;
    } else {
      scaledStr = String(Math.round(scaled));
    }

    if (scaledStr !== numStr) {
      result += text.slice(lastEnd, numStart) + scaledStr;
      lastEnd = numEnd;
    }
  }
  result += text.slice(lastEnd);
  return result;
}

// Voice states for clean state machine
const VoiceState = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking'
};

// Simple hash function for cache keys
const hashText = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `tts_${getVoiceId()}_${hash}`;
};

// Cache management - uses localStorage with base64 encoded audio
const audioCache = {
  get: (text) => {
    try {
      const key = hashText(text);
      const cached = localStorage.getItem(key);
      if (cached) {
        const byteCharacters = atob(cached);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: 'audio/mpeg' });
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  },
  
  set: (text, blob) => {
    try {
      const key = hashText(text);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        try {
          localStorage.setItem(key, base64);
        } catch (e) {
          console.warn('Cache full, clearing old TTS entries');
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('tts_')) keysToRemove.push(k);
          }
          keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach(k => localStorage.removeItem(k));
          try {
            localStorage.setItem(key, base64);
          } catch (e2) {
            console.warn('Still cannot cache:', e2);
          }
        }
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }
};

// Read the user's saved voice preference from localStorage
function getVoiceId() {
  try {
    const saved = JSON.parse(localStorage.getItem('yeschef_voice_prefs'));
    if (saved?.voiceId) return saved.voiceId;
  } catch { /* ignore */ }
  return 'echo'; // default — clearly male voice
}

function isLikelyIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function configureAudioElementForPlayback(audioElement) {
  if (!audioElement) return;
  audioElement.preload = 'auto';
  audioElement.volume = 1;
  audioElement.muted = false;
  audioElement.playsInline = true;
}

export function VoiceProvider({ children }) {
  // Core state machine
  const [voiceState, setVoiceState] = useState(VoiceState.IDLE);
  const [speechLevel, setSpeechLevel] = useState(0);
  
  // UI States
  const [currentReadingIndex, setCurrentReadingIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [aiCaption, setAiCaption] = useState('');
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [hasStartedCooking, setHasStartedCooking] = useState(false);
  
  // Refs for stable values in callbacks
  const audioRef = useRef(null);
  const stepsRef = useRef([]);
  const recipeNameRef = useRef('');
  const servingMultiplierRef = useRef(1);
  const currentIndexRef = useRef(-1);
  const voiceModeActiveRef = useRef(false);
  const hasStartedCookingRef = useRef(false);
  const voiceStateRef = useRef(VoiceState.IDLE);
  
  // WebRTC Audio refs
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const playbackAudioContextRef = useRef(null);
  const playbackAnalyserRef = useRef(null);
  const playbackSourceNodeRef = useRef(null);
  const playbackDataRef = useRef(null);
  const playbackRafRef = useRef(null);
  const playbackSmoothedLevelRef = useRef(0);
  const playbackLastEmitRef = useRef(0);
  const thinkingSoundRef = useRef(null);
  const ttsAudioElementRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const audioChunksRef = useRef([]);
  const vadIntervalRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Conversation turn history for dialogue state (Fix #7)
  const conversationTurnsRef = useRef([]);

  // Timer-voice integration refs
  const pendingTimerOfferRef = useRef(null);       // { stepIndex, seconds, label } — set when AI asks "start the timer?"
  const pendingTimerNotificationRef = useRef(null); // queued TTS message string for when voice is busy
  const pendingTimerCompletionRef = useRef(false);  // true when "Ready for next step?" was asked after timer done

  // VAD Configuration — tuned for human speech, ignoring ambient noise
  const VAD_THRESHOLD = 8; // Low threshold for noisy kitchen environments
  const SILENCE_DURATION = 450; // ms of silence before processing (slightly longer to avoid cutting off in noise)
  const MIN_RECORDING_DURATION = 130; // minimum utterance length to process

  // Derived states for backwards compatibility
  const isPlaying = voiceState === VoiceState.SPEAKING;
  const isListening = voiceState === VoiceState.LISTENING;
  const isProcessing = voiceState === VoiceState.PROCESSING;
  const isLoading = voiceState === VoiceState.PROCESSING;
  const isPaused = false; // No pause state in new architecture

  // Keep refs in sync with state
  useEffect(() => {
    currentIndexRef.current = currentReadingIndex;
  }, [currentReadingIndex]);

  useEffect(() => {
    voiceModeActiveRef.current = isVoiceModeActive;
  }, [isVoiceModeActive]);

  useEffect(() => {
    hasStartedCookingRef.current = hasStartedCooking;
  }, [hasStartedCooking]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
    console.log('🔄 Voice state:', voiceState);
  }, [voiceState]);

  // Initialize WebRTC audio stream with echo cancellation
  const initAudioStream = useCallback(async () => {
    try {
      // Request microphone with WebRTC echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      mediaStreamRef.current = stream;
      console.log('🎤 Microphone initialized with echo cancellation');
      
      // Set up AudioContext for VAD
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      return stream;
    } catch (err) {
      console.error('❌ Microphone access denied:', err);
      setError('Microphone access is required for voice mode');
      throw err;
    }
  }, []);

  // Start recording audio
  const startRecording = useCallback(() => {
    if (!mediaStreamRef.current) return;
    
    audioChunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    
    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100); // Collect data every 100ms
    console.log('🔴 Recording started');
  }, []);

  // Forward declarations for functions that reference each other
  const stopVADRef = useRef(null);
  const startVADRef = useRef(null);
  const transcribeAndRespondRef = useRef(null);

  // Background barge-in verification: record while TTS keeps playing,
  // only interrupt if real speech is confirmed via STT
  const bargeInRecorderRef = useRef(null);
  const bargeInChunksRef = useRef([]);
  const bargeInSilenceTimerRef = useRef(null);
  const bargeInActiveRef = useRef(false);
  const finishBargeInVerificationRef = useRef(null);

  // Stop VAD
  const stopVAD = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    isSpeakingRef.current = false;
    console.log('🔇 VAD stopped');
  }, []);
  stopVADRef.current = stopVAD;

  const stopPlaybackAnalysis = useCallback(() => {
    if (playbackRafRef.current) {
      cancelAnimationFrame(playbackRafRef.current);
      playbackRafRef.current = null;
    }

    // Disconnect source from the analyser chain but keep the node reference alive.
    // createMediaElementSource can only be called ONCE per audio element, so we
    // must reuse the same source node across playback sessions.
    if (playbackSourceNodeRef.current) {
      try { playbackSourceNodeRef.current.disconnect(); } catch {}
      // DO NOT null — we reuse it in startPlaybackAnalysis
    }

    if (playbackAnalyserRef.current) {
      try { playbackAnalyserRef.current.disconnect(); } catch {}
      playbackAnalyserRef.current = null;
    }

    playbackDataRef.current = null;
    playbackSmoothedLevelRef.current = 0;
    playbackLastEmitRef.current = 0;
    setSpeechLevel(0);
  }, []);

  const closePlaybackAudioContext = useCallback(() => {
    const playbackContext = playbackAudioContextRef.current;
    if (!playbackContext) return;
    if (playbackContext.state !== 'closed') {
      playbackContext.close().catch(() => {});
    }
    playbackAudioContextRef.current = null;
    // Source node is tied to this context — must be recreated with the next context
    playbackSourceNodeRef.current = null;
    // The old TTS audio element was captured by createMediaElementSource, which
    // permanently reroutes its output through Web Audio. With the context closed,
    // audio goes nowhere → silence. Discard it so a fresh element is created next time.
    if (ttsAudioElementRef.current) {
      try {
        ttsAudioElementRef.current.pause();
        ttsAudioElementRef.current.removeAttribute('src');
        ttsAudioElementRef.current.load();
      } catch {}
      ttsAudioElementRef.current = null;
    }
  }, []);

  const stopThinkingLoop = useCallback(() => {
    if (!thinkingSoundRef.current) return;
    try {
      thinkingSoundRef.current.pause();
      thinkingSoundRef.current.currentTime = 0;
    } catch {
      // noop
    }
  }, []);

  const startThinkingLoop = useCallback(() => {
    if (!thinkingSoundRef.current) {
      try {
        const loopAudio = new Audio(popSound);
        loopAudio.loop = true;
        loopAudio.volume = 0.4;
        loopAudio.preload = 'auto';
        loopAudio.muted = false;
        loopAudio.playsInline = true;
        thinkingSoundRef.current = loopAudio;
      } catch {
        thinkingSoundRef.current = null;
      }
    }

    if (!thinkingSoundRef.current || !thinkingSoundRef.current.paused) return;
    const playPromise = thinkingSoundRef.current.play();
    if (playPromise?.catch) {
      playPromise.catch((err) => {
        console.warn('Thinking loop playback blocked:', err?.name || err);
      });
    }
  }, []);

  const getReusableTtsAudioElement = useCallback(() => {
    if (!ttsAudioElementRef.current) {
      const audioElement = new Audio();
      configureAudioElementForPlayback(audioElement);
      ttsAudioElementRef.current = audioElement;
    }
    return ttsAudioElementRef.current;
  }, []);

  const unlockAudioPlayback = useCallback(async () => {
    if (audioUnlockedRef.current) return true;

    if (!thinkingSoundRef.current) {
      try {
        const loopAudio = new Audio(popSound);
        loopAudio.loop = true;
        loopAudio.volume = 0.4;
        thinkingSoundRef.current = loopAudio;
      } catch {
        thinkingSoundRef.current = null;
      }
    }

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      if (playbackAudioContextRef.current?.state === 'suspended') {
        await playbackAudioContextRef.current.resume();
      }

      if (thinkingSoundRef.current) {
        const previewAudio = thinkingSoundRef.current;
        const prevLoop = previewAudio.loop;
        const prevVolume = previewAudio.volume;
        previewAudio.loop = false;
        previewAudio.volume = 0.001;
        await previewAudio.play();
        previewAudio.pause();
        previewAudio.currentTime = 0;
        previewAudio.loop = prevLoop;
        previewAudio.volume = prevVolume;
      }

      // Prime a reusable TTS element inside user gesture context.
      const ttsAudio = getReusableTtsAudioElement();
      ttsAudio.pause();
      ttsAudio.currentTime = 0;

      audioUnlockedRef.current = true;
      return true;
    } catch (err) {
      console.warn('Audio unlock failed:', err?.name || err);
      return false;
    }
  }, [getReusableTtsAudioElement]);

  useEffect(() => {
    const shouldLoopThinking = isVoiceModeActive && voiceState === VoiceState.PROCESSING;
    if (shouldLoopThinking) {
      startThinkingLoop();
    } else {
      stopThinkingLoop();
    }
  }, [isVoiceModeActive, startThinkingLoop, stopThinkingLoop, voiceState]);

  const startPlaybackAnalysis = useCallback((audioElement) => {
    if (!audioElement) return;

    // On iOS/mobile Safari, routing media elements through Web Audio can cause silent playback.
    // Instead of real audio analysis, simulate natural speech-like wave animation.
    if (isLikelyIOSDevice()) {
      stopPlaybackAnalysis();
      let phase = 0;
      const simulateLevel = () => {
        // Generate organic speech-like fluctuation using overlapping sine waves
        phase += 0.12;
        const base = 0.35;
        const variation = Math.sin(phase) * 0.2 + Math.sin(phase * 2.7) * 0.15 + Math.sin(phase * 0.5) * 0.1;
        const level = Math.max(0.1, Math.min(0.85, base + variation));
        setSpeechLevel(level);
        playbackRafRef.current = requestAnimationFrame(simulateLevel);
      };
      playbackRafRef.current = requestAnimationFrame(simulateLevel);
      return;
    }

    try {
      stopPlaybackAnalysis();

      let playbackContext = playbackAudioContextRef.current;
      if (!playbackContext || playbackContext.state === 'closed') {
        playbackContext = new (window.AudioContext || window.webkitAudioContext)();
        playbackAudioContextRef.current = playbackContext;
        // Old source node is dead with the old context — must recreate
        playbackSourceNodeRef.current = null;
      }

      if (playbackContext.state === 'suspended') {
        playbackContext.resume().catch(() => {});
      }

      const analyser = playbackContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;

      // Reuse existing source node — createMediaElementSource can only be called
      // ONCE per audio element. Calling it again throws InvalidStateError, which
      // leaves the element permanently routed through Web Audio with no connection
      // to the destination → total silence on all subsequent TTS plays.
      let source = playbackSourceNodeRef.current;
      if (!source) {
        source = playbackContext.createMediaElementSource(audioElement);
        playbackSourceNodeRef.current = source;
      }
      source.connect(analyser);
      analyser.connect(playbackContext.destination);

      playbackAnalyserRef.current = analyser;
      playbackDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      playbackLastEmitRef.current = 0;

      const updateLevel = () => {
        if (!playbackAnalyserRef.current || !playbackDataRef.current) return;

        playbackAnalyserRef.current.getByteFrequencyData(playbackDataRef.current);

        let weightedEnergy = 0;
        for (let i = 0; i < playbackDataRef.current.length; i++) {
          weightedEnergy += playbackDataRef.current[i] * (1 + (i / playbackDataRef.current.length));
        }

        const normalized = Math.min(1, (weightedEnergy / (playbackDataRef.current.length * 255)) * 1.25);
        const smoothed = (playbackSmoothedLevelRef.current * 0.72) + (normalized * 0.28);
        playbackSmoothedLevelRef.current = smoothed;

        const now = performance.now();
        if (now - playbackLastEmitRef.current >= 80) {
          playbackLastEmitRef.current = now;
          setSpeechLevel((prev) => {
            if (Math.abs(prev - smoothed) < 0.025) return prev;
            return smoothed;
          });
        }

        playbackRafRef.current = requestAnimationFrame(updateLevel);
      };

      playbackRafRef.current = requestAnimationFrame(updateLevel);
    } catch (err) {
      console.warn('Playback analysis disabled for this audio segment:', err);
      stopPlaybackAnalysis();
    }
  }, [stopPlaybackAnalysis]);

  // Stop recording and send to Google STT
  const stopRecordingAndProcess = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }
    
    // Check minimum recording duration
    const recordingDuration = Date.now() - (recordingStartTimeRef.current || 0);
    if (recordingDuration < MIN_RECORDING_DURATION) {
      console.log('⏱️ Recording too short, ignoring');
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      return;
    }
    
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          console.log('📭 No audio data');
          resolve();
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        console.log('📤 Sending audio for transcription:', (audioBlob.size / 1024).toFixed(1), 'KB');
        
        // Transcribe
        if (transcribeAndRespondRef.current) {
          await transcribeAndRespondRef.current(audioBlob);
        }
        resolve();
      };
      
      mediaRecorderRef.current.stop();
    });
  }, []);

  // Stop any active background barge-in recorder
  const stopBargeInRecorder = useCallback(() => {
    if (bargeInSilenceTimerRef.current) {
      clearTimeout(bargeInSilenceTimerRef.current);
      bargeInSilenceTimerRef.current = null;
    }
    if (bargeInRecorderRef.current && bargeInRecorderRef.current.state !== 'inactive') {
      try { bargeInRecorderRef.current.stop(); } catch {}
    }
    bargeInRecorderRef.current = null;
    bargeInChunksRef.current = [];
    bargeInActiveRef.current = false;
  }, []);

  // Start background recording during TTS to verify if barge-in sound is real speech.
  // TTS keeps playing — if STT returns empty, we discard silently; if real words, we interrupt.
  const startBargeInVerification = useCallback(() => {
    if (bargeInActiveRef.current || !mediaStreamRef.current) return;
    bargeInActiveRef.current = true;
    bargeInChunksRef.current = [];

    const recorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: 'audio/webm;codecs=opus'
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) bargeInChunksRef.current.push(e.data);
    };
    bargeInRecorderRef.current = recorder;
    recorder.start(100);
    console.log('🎙️ Background barge-in recording started (TTS still playing)');
  }, []);

  // Voice Activity Detection - detects when user is speaking
  // Uses frequency-filtered energy to focus on human speech (300Hz–3kHz)
  // and ignore ambient noise (fans, traffic, appliance hums, etc.)
  const startVAD = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    // Track consecutive high-volume frames to avoid false barge-in from speaker bleed
    let bargeInFrames = 0;
    const BARGE_IN_FRAME_THRESHOLD = 6; // ~300ms of continuous speech at 50ms intervals

    // Compute frequency bin range for human speech (300Hz – 3kHz)
    // binIndex = frequency / (sampleRate / fftSize)
    const sampleRate = audioContextRef.current?.sampleRate || 48000;
    const binHz = sampleRate / analyser.fftSize; // Hz per bin
    const speechBinStart = Math.floor(300 / binHz);
    const speechBinEnd = Math.min(Math.ceil(3000 / binHz), analyser.frequencyBinCount - 1);

    // Measure energy only in the speech-frequency band
    const getSpeechEnergy = () => {
      analyser.getByteFrequencyData(data);
      let energy = 0;
      const count = speechBinEnd - speechBinStart + 1;
      for (let i = speechBinStart; i <= speechBinEnd; i++) {
        energy += data[i];
      }
      return count > 0 ? energy / count : 0;
    };

    const checkVoice = () => {
      const currentState = voiceStateRef.current;

      // During SPEAKING: detect potential barge-in (user talks over TTS)
      // TTS keeps playing — we record in the background and verify via STT.
      // Only confirmed human speech will interrupt TTS.
      if (currentState === VoiceState.SPEAKING) {
        const volume = getSpeechEnergy();
        if (volume > VAD_THRESHOLD * 3) {
          bargeInFrames++;
          if (bargeInFrames >= BARGE_IN_FRAME_THRESHOLD && !bargeInActiveRef.current) {
            console.log('🎙️ Potential barge-in, starting background verification. volume:', volume.toFixed(1));
            bargeInFrames = 0;
            startBargeInVerification();
          }
          // Clear any pending silence timer while sound is active
          if (bargeInSilenceTimerRef.current) {
            clearTimeout(bargeInSilenceTimerRef.current);
            bargeInSilenceTimerRef.current = null;
          }
        } else {
          bargeInFrames = Math.max(0, bargeInFrames - 1);
          // If we're recording in background and silence returns, finish verification
          if (bargeInActiveRef.current && !bargeInSilenceTimerRef.current) {
            bargeInSilenceTimerRef.current = setTimeout(() => {
              bargeInSilenceTimerRef.current = null;
              finishBargeInVerificationRef.current?.();
            }, SILENCE_DURATION);
          }
        }
        return;
      }

      if (currentState !== VoiceState.LISTENING) return;

      const volume = getSpeechEnergy();

      if (volume > VAD_THRESHOLD) {
        // User started speaking
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          console.log('🗣️ Speech detected, volume:', volume.toFixed(1));

          // Start recording if not already
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            startRecording();
          }
        }

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else if (isSpeakingRef.current) {
        // Silence detected after speech - wait for SILENCE_DURATION before processing
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('🔇 Silence detected, processing...');
            isSpeakingRef.current = false;
            stopRecordingAndProcess();
          }, SILENCE_DURATION);
        }
      }
    };

    // Check every 50ms for faster responsiveness
    vadIntervalRef.current = setInterval(checkVoice, 50);
    console.log('👂 VAD started (speech-band filtered:', speechBinStart, '-', speechBinEnd, 'bins,', (speechBinStart * binHz).toFixed(0), '-', (speechBinEnd * binHz).toFixed(0), 'Hz)');
  }, [startRecording, stopRecordingAndProcess, startBargeInVerification]);
  startVADRef.current = startVAD;

  // Interrupt current audio playback (barge-in)
  const interruptAudio = useCallback(() => {
    if (voiceStateRef.current === VoiceState.PROCESSING) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      console.log('⏹️ Audio interrupted (barge-in)');
    }
    stopPlaybackAnalysis();
    if (voiceStateRef.current === VoiceState.SPEAKING) {
      setVoiceState(VoiceState.LISTENING);
    }
  }, [stopPlaybackAnalysis]);

  // Speak text using TTS — streams audio so playback starts before full download
  const speakText = useCallback(async (text, options = {}) => {
    const { existingResponse, signal, onComplete } = options;
    if (!text) return;

    // Sync ref immediately to avoid race where audio ends before state effect runs
    voiceStateRef.current = VoiceState.SPEAKING;
    setVoiceState(VoiceState.SPEAKING);
    setAiCaption(text);
    // Don't fully stop VAD — keep it running so it can detect barge-in during playback
    // Only stop the silence timeout / recording state
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    isSpeakingRef.current = false;
    // On iOS, keeping mic/VAD active while speaking can suppress audible output.
    // So disable barge-in during playback and resume after TTS completes.
    const shouldDisableBargeInForPlayback = isLikelyIOSDevice();

    if (shouldDisableBargeInForPlayback) {
      stopVADRef.current?.();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
    } else if (!vadIntervalRef.current && analyserRef.current) {
      // Restart VAD in SPEAKING-aware mode (it checks voiceStateRef to decide behavior)
      startVADRef.current?.();
    }
    
    // Interrupt any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let safetyTimeoutId = null;
    const onFinished = (audioUrl) => {
      if (safetyTimeoutId) { clearTimeout(safetyTimeoutId); safetyTimeoutId = null; }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioRef.current = null;
      stopPlaybackAnalysis();

      // Drain any queued timer notification before resuming listening
      if (pendingTimerNotificationRef.current) {
        const msg = pendingTimerNotificationRef.current;
        pendingTimerNotificationRef.current = null;
        speakText(msg); // re-entrant — will set up its own onFinished
        return;
      }

      // Only resume listening if still in SPEAKING state (not interrupted/paused)
      if (voiceModeActiveRef.current && voiceStateRef.current === VoiceState.SPEAKING) {
        voiceStateRef.current = VoiceState.LISTENING;
        setVoiceState(VoiceState.LISTENING);
        // Always restart VAD after audio ends — small delay to let echo cancellation settle
        setTimeout(() => {
          if (voiceModeActiveRef.current && voiceStateRef.current === VoiceState.LISTENING) {
            // Stop existing VAD first to ensure a clean restart
            stopVADRef.current?.();
            startVADRef.current?.();
            console.log('👂 Auto-resumed listening after TTS');
          }
        }, 200);
      } else if (!voiceModeActiveRef.current) {
        voiceStateRef.current = VoiceState.IDLE;
        setVoiceState(VoiceState.IDLE);
      }
      if (onComplete) onComplete();
    };
    
    try {
      // Check cache first (skip when streaming from combined endpoint)
      const cachedBlob = !existingResponse ? audioCache.get(text) : null;
      
      if (cachedBlob) {
        if (signal?.aborted) return;
        console.log('🔊 Using cached TTS');
        const audioUrl = URL.createObjectURL(cachedBlob);
        const audio = getReusableTtsAudioElement();
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        audio.load();
        configureAudioElementForPlayback(audio);
        audioRef.current = audio;
        startPlaybackAnalysis(audio);
        audio.onended = () => { console.log('🔊 Audio finished'); onFinished(audioUrl); };
        audio.onerror = () => onFinished(audioUrl);
        try {
          await audio.play();
        } catch (playErr) {
          console.warn('Cached TTS playback blocked:', playErr?.name || playErr);
          setError('Audio playback was blocked on this device. Tap the voice button again to re-enable audio.');
          onFinished(audioUrl);
        }
        return;
      }

      // Use pre-fetched response (from combined endpoint) or make new TTS request
      const response = existingResponse || await fetch(`${API_ENDPOINTS.SPEECH_TTS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: getVoiceId() }),
        signal
      });
      
      if (!existingResponse && !response.ok) throw new Error('TTS failed');

      // Try MediaSource streaming for instant playback (disabled on iOS/Safari where it is unreliable)
      const canUseMediaSourceStreaming =
        typeof MediaSource !== 'undefined'
        && MediaSource.isTypeSupported('audio/mpeg')
        && !isLikelyIOSDevice();

      if (canUseMediaSourceStreaming) {
        const mediaSource = new MediaSource();
        const audioUrl = URL.createObjectURL(mediaSource);
        const audio = getReusableTtsAudioElement();
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        audio.load();
        configureAudioElementForPlayback(audio);
        audioRef.current = audio;
        startPlaybackAnalysis(audio);

        const allChunks = [];

        mediaSource.addEventListener('sourceopen', async () => {
          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
          const reader = response.body.getReader();
          let done = false;
          const appendQueue = [];
          let appending = false;

          const processQueue = () => {
            if (appending || appendQueue.length === 0) return;
            if (mediaSource.readyState !== 'open') return;
            appending = true;
            const chunk = appendQueue.shift();
            try {
              sourceBuffer.appendBuffer(chunk);
            } catch {
              appending = false;
            }
          };

          sourceBuffer.addEventListener('updateend', () => {
            appending = false;
            if (appendQueue.length > 0) {
              processQueue();
            } else if (done && mediaSource.readyState === 'open') {
              try { mediaSource.endOfStream(); } catch {}
            }
          });

          while (true) {
            // Abort if interrupted or paused
            if (signal?.aborted || audioRef.current !== audio) break;
            const { value, done: readerDone } = await reader.read();
            if (readerDone) { done = true; break; }
            allChunks.push(value);
            appendQueue.push(value);
            processQueue();
            // Start playback as soon as first chunk arrives
            if (audio.paused && sourceBuffer.buffered.length > 0 && audioRef.current === audio) {
              audio.play().catch((playErr) => {
                console.warn('Stream chunk playback retry blocked:', playErr?.name || playErr);
              });
            }
          }
          // Flush remaining queue
          processQueue();

          // Cache the full audio for next time
          if (allChunks.length > 0) {
            const fullBlob = new Blob(allChunks, { type: 'audio/mpeg' });
            audioCache.set(text, fullBlob);
          }
        });

        audio.onended = () => { console.log('🔊 Audio finished (streamed)'); onFinished(audioUrl); };
        audio.onerror = () => onFinished(audioUrl);
        try {
          await audio.play();
          // Safety: if onended never fires (browser bug, MediaSource edge case), recover after 60s
          safetyTimeoutId = setTimeout(() => {
            if (voiceStateRef.current === VoiceState.SPEAKING && audioRef.current === audio) {
              console.warn('⚠️ Safety timeout: onended never fired, recovering');
              onFinished(audioUrl);
            }
          }, 60000);
        } catch (playErr) {
          console.warn('Streaming TTS playback blocked:', playErr?.name || playErr);
          setError('Audio playback was blocked on this device. Tap the voice button again to re-enable audio.');
          onFinished(audioUrl);
          return;
        }

      } else {
        // Fallback: wait for full blob (Safari / older browsers)
        const audioBlob = await response.blob();
        audioCache.set(text, audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = getReusableTtsAudioElement();
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        audio.load();
        configureAudioElementForPlayback(audio);
        audioRef.current = audio;
        startPlaybackAnalysis(audio);
        audio.onended = () => { console.log('🔊 Audio finished'); onFinished(audioUrl); };
        audio.onerror = () => onFinished(audioUrl);
        await audio.play();
        safetyTimeoutId = setTimeout(() => {
          if (voiceStateRef.current === VoiceState.SPEAKING && audioRef.current === audio) {
            console.warn('⚠️ Safety timeout: onended never fired (blob), recovering');
            onFinished(audioUrl);
          }
        }, 60000);
      }
      
    } catch (err) {
      if (safetyTimeoutId) { clearTimeout(safetyTimeoutId); safetyTimeoutId = null; }
      if (err.name === 'AbortError') return;
      console.error('❌ TTS error:', err);
      setError('Failed to play audio');
      if (voiceModeActiveRef.current) {
        voiceStateRef.current = VoiceState.LISTENING;
        setVoiceState(VoiceState.LISTENING);
        stopVADRef.current?.();
        startVADRef.current?.();
      }
      stopPlaybackAnalysis();
    }
  }, [getReusableTtsAudioElement, startPlaybackAnalysis, stopPlaybackAnalysis]);

  // Apply navigation intent from the converse endpoint
  const applyNavigationIntent = useCallback((intent, stepNumber) => {
    // Mark cooking as started once we get a navigation intent
    if (['start', 'next', 'previous', 'goto', 'repeat'].includes(intent)) {
      if (!hasStartedCookingRef.current) {
        hasStartedCookingRef.current = true;
        setHasStartedCooking(true);
      }
    }

    // If the server sent an explicit step number, use it (1-indexed → 0-indexed)
    if (stepNumber != null) {
      const idx = stepNumber - 1;
      if (idx >= 0 && idx < stepsRef.current.length) {
        currentIndexRef.current = idx;
        setCurrentReadingIndex(idx);
        return;
      }
    }
    // Fallback: derive from intent + current position
    if (intent === 'start') {
      currentIndexRef.current = 0;
      setCurrentReadingIndex(0);
    } else if (intent === 'next' && currentIndexRef.current < stepsRef.current.length - 1) {
      const next = currentIndexRef.current + 1;
      currentIndexRef.current = next;
      setCurrentReadingIndex(next);
    } else if (intent === 'previous' && currentIndexRef.current > 0) {
      const prev = currentIndexRef.current - 1;
      currentIndexRef.current = prev;
      setCurrentReadingIndex(prev);
    }
  }, []);

  // Extract a step number from free text like "Step 3", "step three", or "third step"
  const extractStepNumberFromText = useCallback((text) => {
    if (!text || typeof text !== 'string') return null;
    const t = text.toLowerCase();
    const totalSteps = stepsRef.current.length;
    if (!totalSteps) return null;

    const wordToNum = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
      sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
      first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
      sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10
    };

    // step N
    const stepNumMatch = t.match(/\bstep\s+(\d{1,3})\b/i);
    if (stepNumMatch) {
      const n = parseInt(stepNumMatch[1], 10);
      if (n >= 1 && n <= totalSteps) return n;
    }

    // step word (e.g. "step three")
    const stepWordMatch = t.match(/\bstep\s+([a-z]+)\b/i);
    if (stepWordMatch) {
      const n = wordToNum[stepWordMatch[1]];
      if (n >= 1 && n <= totalSteps) return n;
    }

    // ordinal before step (e.g. "third step")
    const ordinalStepMatch = t.match(/\b([a-z]+)\s+step\b/i);
    if (ordinalStepMatch) {
      const n = wordToNum[ordinalStepMatch[1]];
      if (n >= 1 && n <= totalSteps) return n;
    }

    return null;
  }, []);

  // Handle pending timer offer confirmation (yes/no) — called before normal intent processing
  const handlePendingTimerOffer = useCallback(async (transcript) => {
    if (!pendingTimerOfferRef.current) return false;
    const t = transcript.toLowerCase().trim().replace(/[.,!?]/g, '');
    const isYes = /^(yes|yeah|yep|yup|sure|go|ok(ay)?|alright|start\s*(it|the\s*timer)?|go\s*ahead|do\s*it|please)$/i.test(t);
    const isNo = /^(no|nah|nope|skip|don'?t|not?\s*now|never\s*mind|no\s*thanks?)$/i.test(t);

    if (isYes) {
      const offer = pendingTimerOfferRef.current;
      pendingTimerOfferRef.current = null;
      if (timerBridge.startTimerFn) {
        timerBridge.startTimerFn(offer.stepIndex, offer.label, offer.seconds);
      }
      const mins = Math.round(offer.seconds / 60);
      await speakText(`Timer started. ${mins} minute${mins !== 1 ? 's' : ''} on the clock. I'll let you know when it's done.`);
      return true;
    }
    if (isNo) {
      pendingTimerOfferRef.current = null;
      await speakText(`No worries, no timer.`);
      return true;
    }
    // Ambiguous — clear offer and let normal processing handle it
    pendingTimerOfferRef.current = null;
    return false;
  }, [speakText]);

  // Handle pending timer completion confirmation (user says "yes" to "Ready for next step?")
  const handlePendingTimerCompletion = useCallback(async (transcript) => {
    if (!pendingTimerCompletionRef.current) return false;
    const t = transcript.toLowerCase().trim().replace(/[.,!?]/g, '');
    if (/^(yes|yeah|yep|sure|next|continue|ok(ay)?|alright|move\s+on|go|let'?s\s+go)$/i.test(t)) {
      pendingTimerCompletionRef.current = false;
      const nextIdx = Math.min(currentIndexRef.current + 1, stepsRef.current.length - 1);
      applyNavigationIntent('next', nextIdx + 1);
      const stepText = stepsRef.current[nextIdx]?.text || stepsRef.current[nextIdx]?.instruction || '';
      await speakText(`Step ${nextIdx + 1}. ${scaleStepText(stepText, servingMultiplierRef.current)}`);
      return true;
    }
    // Not a "yes" — clear and fall through to normal processing
    pendingTimerCompletionRef.current = false;
    return false;
  }, [speakText, applyNavigationIntent]);

  // Called when silence returns after a background barge-in recording.
  // Sends audio to STT-only endpoint; if real speech → interrupt TTS & process.
  const finishBargeInVerification = useCallback(async () => {
    if (!bargeInActiveRef.current) return;

    // Collect the recorded chunks
    const recorder = bargeInRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      stopBargeInRecorder();
      return;
    }

    const audioBlob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(bargeInChunksRef.current, { type: 'audio/webm' });
        bargeInChunksRef.current = [];
        resolve(blob);
      };
      recorder.stop();
    });
    bargeInRecorderRef.current = null;
    bargeInActiveRef.current = false;

    if (audioBlob.size < 500) {
      console.log('🔇 Background barge-in too small, ignoring');
      return;
    }

    console.log('🔍 Verifying barge-in audio:', (audioBlob.size / 1024).toFixed(1), 'KB');

    try {
      // Quick STT-only check
      const formData = new FormData();
      formData.append('audio', audioBlob, 'bargein.webm');
      formData.append('sampleRate', '48000');

      const sttRes = await fetch(API_ENDPOINTS.SPEECH_STT, {
        method: 'POST',
        body: formData,
      });

      if (!sttRes.ok) {
        console.warn('⚠️ Barge-in STT check failed, ignoring');
        return;
      }

      const { transcript } = await sttRes.json();

      if (!transcript || transcript.trim().length === 0) {
        console.log('✅ Barge-in was just noise, TTS continues undisturbed');
        return;
      }

      // Real speech detected — NOW interrupt TTS and process
      console.log('🛑 Confirmed barge-in speech:', transcript);

      // Stop TTS
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      // Send the confirmed transcript through the full converse + TTS pipeline
      voiceStateRef.current = VoiceState.PROCESSING;
      setVoiceState(VoiceState.PROCESSING);
      stopVADRef.current?.();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const converseBody = {
        transcript,
        currentStep: Math.max(0, Number.isFinite(currentIndexRef.current) ? currentIndexRef.current : 0),
        steps: stepsRef.current,
        recipeName: recipeNameRef.current,
        hasStarted: hasStartedCookingRef.current,
      };

      if (conversationTurnsRef.current.length > 0) {
        converseBody.conversationTurns = conversationTurnsRef.current.slice(-4);
      }

      const converseRes = await fetch(API_ENDPOINTS.SPEECH_CONVERSE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(converseBody),
        signal: controller.signal,
      });

      if (!converseRes.ok) throw new Error('Converse failed');
      const data = await converseRes.json();
      const { reply, intent, stepNumber } = data;

      setLastTranscript(transcript);
      if (reply) setAiCaption(reply);

      // Track conversation
      conversationTurnsRef.current.push({ role: 'user', content: transcript });
      if (reply) conversationTurnsRef.current.push({ role: 'assistant', content: reply });
      if (conversationTurnsRef.current.length > 8) {
        conversationTurnsRef.current = conversationTurnsRef.current.slice(-8);
      }

      // Timer confirmation interception — check before normal intent processing
      const timerOfferHandled = await handlePendingTimerOffer(transcript);
      if (timerOfferHandled) return;
      const timerCompletionHandled = await handlePendingTimerCompletion(transcript);
      if (timerCompletionHandled) return;

      if (intent === 'pause') {
        stopVADRef.current?.();
        voiceStateRef.current = VoiceState.IDLE;
        setVoiceState(VoiceState.IDLE);
        return;
      }

      const detectedStepNumber =
        (stepNumber != null ? stepNumber : null) ??
        extractStepNumberFromText(reply) ??
        extractStepNumberFromText(transcript);
      applyNavigationIntent(intent, detectedStepNumber);

      // Scale ingredient quantities for current servings
      let finalReply = reply;
      if (['start', 'next', 'previous', 'goto', 'repeat'].includes(intent) && detectedStepNumber != null && reply) {
        const stepIdx = detectedStepNumber - 1;
        const stepText = stepsRef.current[stepIdx]?.text || stepsRef.current[stepIdx]?.instruction || '';
        const detectedTimers = extractTimersFromStep(stepText);
        if (detectedTimers.length > 0) {
          const first = detectedTimers[0];
          const alreadyRunning = Object.keys(timerBridge.activeTimers).some(
            id => id.startsWith(`${stepIdx}-`) && timerBridge.activeTimers[id].remaining > 0
          );
          if (!alreadyRunning) {
            pendingTimerOfferRef.current = { stepIndex: stepIdx, seconds: first.seconds, label: first.text };
            finalReply = `${reply} ... Should I start the ${first.text} timer?`;
          }
        }
      }
      finalReply = scaleStepText(finalReply, servingMultiplierRef.current);

      if (finalReply) await speakText(finalReply, { signal: controller.signal });
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('❌ Barge-in verification error:', err);
      if (voiceModeActiveRef.current) {
        voiceStateRef.current = VoiceState.LISTENING;
        setVoiceState(VoiceState.LISTENING);
        startVADRef.current?.();
      }
    }
  }, [stopBargeInRecorder, speakText, applyNavigationIntent, extractStepNumberFromText, handlePendingTimerOffer, handlePendingTimerCompletion]);
  finishBargeInVerificationRef.current = finishBargeInVerification;

  // Send audio to combined STT+converse+TTS endpoint (single round-trip, streamed audio back)
  const transcribeAndRespond = useCallback(async (audioBlob) => {
    if (!voiceModeActiveRef.current) return;

    voiceStateRef.current = VoiceState.PROCESSING;
    setVoiceState(VoiceState.PROCESSING);
    stopVADRef.current?.();
    
    // Abort any previous in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Safety timeout — auto-abort if processing takes too long (server hang, network stall)
    const processingTimeout = setTimeout(() => {
      if (voiceStateRef.current === VoiceState.PROCESSING) {
        console.warn('⏰ Processing timeout — aborting and recovering');
        controller.abort();
      }
    }, 30000);

    try {
      // Build FormData with audio + recipe context for the combined endpoint
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sampleRate', '48000');
      const safeCurrentStep = Math.max(0, Number.isFinite(currentIndexRef.current) ? currentIndexRef.current : 0);
      formData.append('currentStep', String(safeCurrentStep));
      formData.append('steps', JSON.stringify(stepsRef.current));
      formData.append('recipeName', recipeNameRef.current);
      formData.append('voice', getVoiceId());
      formData.append('hasStarted', String(hasStartedCookingRef.current));

      // Send recent conversation turns for dialogue context (Fix #7)
      if (conversationTurnsRef.current.length > 0) {
        formData.append('conversationTurns', JSON.stringify(conversationTurnsRef.current.slice(-4)));
      }

      // Recipe-specific speech hints
      const hints = [recipeNameRef.current];
      stepsRef.current.forEach(step => {
        if (step.ingredients) {
          step.ingredients.forEach(ing => {
            if (typeof ing === 'string' && ing.length > 2) hints.push(ing);
          });
        }
      });
      // Add timer-related hints when a timer offer is pending
      if (pendingTimerOfferRef.current) {
        hints.push('start the timer', 'yes start it', 'no timer', 'skip timer');
      }
      if (hints.length > 0) {
        formData.append('hints', JSON.stringify(hints.filter(Boolean)));
      }
      
      // Single network call — server does STT + converse + TTS streaming
      const response = await fetch(`${API_ENDPOINTS.SPEECH_PROCESS}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      if (!response.ok) throw new Error('Process failed');
      
      const contentType = response.headers.get('Content-Type') || '';
      
      // Streaming audio — TTS piped directly from server
      if (contentType.includes('audio')) {
        const transcript = decodeURIComponent(response.headers.get('X-Transcript') || '');
        const reply = decodeURIComponent(response.headers.get('X-Reply') || '');
        const intent = response.headers.get('X-Intent') || 'chat';
        const stepNumRaw = response.headers.get('X-Step-Number');
        const stepNumberFromHeader = stepNumRaw ? parseInt(stepNumRaw, 10) : null;
        const detectedStepNumber =
          extractStepNumberFromText(reply) ??
          extractStepNumberFromText(transcript);
        const stepNumber = stepNumberFromHeader ?? detectedStepNumber;
        
        if (transcript) setLastTranscript(transcript);
        if (reply) setAiCaption(reply);

        // Track conversation turns for dialogue context (Fix #7)
        if (transcript) conversationTurnsRef.current.push({ role: 'user', content: transcript });
        if (reply) conversationTurnsRef.current.push({ role: 'assistant', content: reply });
        // Keep only last 8 turns (4 exchanges)
        if (conversationTurnsRef.current.length > 8) {
          conversationTurnsRef.current = conversationTurnsRef.current.slice(-8);
        }

        // Timer confirmation interception — check before normal intent processing
        if (transcript && (pendingTimerOfferRef.current || pendingTimerCompletionRef.current)) {
          const timerOfferHandled = await handlePendingTimerOffer(transcript);
          if (timerOfferHandled) {
            try { await response.body?.cancel(); } catch {}
            return;
          }
          const timerCompletionHandled = await handlePendingTimerCompletion(transcript);
          if (timerCompletionHandled) {
            try { await response.body?.cancel(); } catch {}
            return;
          }
          // Neither handled (ambiguous) — fall through to normal processing
        }

        applyNavigationIntent(intent, stepNumber);

        // Before speaking, check if the step has timers — append the offer to the reply
        let finalReply = reply;
        if (['start', 'next', 'previous', 'goto', 'repeat'].includes(intent) && stepNumber != null && reply) {
          const stepIdx = stepNumber - 1;
          const stepText = stepsRef.current[stepIdx]?.text || stepsRef.current[stepIdx]?.instruction || '';
          const detectedTimers = extractTimersFromStep(stepText);
          if (detectedTimers.length > 0) {
            const first = detectedTimers[0];
            const alreadyRunning = Object.keys(timerBridge.activeTimers).some(
              id => id.startsWith(`${stepIdx}-`) && timerBridge.activeTimers[id].remaining > 0
            );
            if (!alreadyRunning) {
              pendingTimerOfferRef.current = { stepIndex: stepIdx, seconds: first.seconds, label: first.text };
              finalReply = `${reply} ... Should I start the ${first.text} timer?`;
            }
          }
        }

        // Scale ingredient quantities in the reply for current servings
        finalReply = scaleStepText(finalReply, servingMultiplierRef.current);

        // Stream TTS audio — check cache first
        if (finalReply) {
          const cached = audioCache.get(finalReply);
          if (cached) {
            try { await response.body?.cancel(); } catch {}
            await speakText(finalReply);
          } else if (finalReply === reply) {
            // No timer appended — use the streamed response as-is
            await speakText(finalReply, { existingResponse: response, signal: controller.signal });
          } else {
            // Timer question appended or scaled — can't use the streamed audio, cancel and do fresh TTS
            try { await response.body?.cancel(); } catch {}
            await speakText(finalReply);
          }
        } else {
          // No reply to speak — resume listening
          try { await response.body?.cancel(); } catch {}
          if (voiceModeActiveRef.current) {
            voiceStateRef.current = VoiceState.LISTENING;
            setVoiceState(VoiceState.LISTENING);
            startVADRef.current?.();
          }
        }
        return;
      }
      
      // JSON fallback (empty transcript, pause intent, or TTS streaming error)
      const data = await response.json();
      const { transcript, reply, intent, stepNumber } = data;
      
      if (!transcript || transcript.trim().length === 0) {
        if (voiceModeActiveRef.current) {
          voiceStateRef.current = VoiceState.LISTENING;
          setVoiceState(VoiceState.LISTENING);
          startVADRef.current?.();
        }
        return;
      }

      setLastTranscript(transcript);
      if (reply) setAiCaption(reply);

      // Track conversation turns for dialogue context (Fix #7)
      if (transcript) conversationTurnsRef.current.push({ role: 'user', content: transcript });
      if (reply) conversationTurnsRef.current.push({ role: 'assistant', content: reply });
      if (conversationTurnsRef.current.length > 8) {
        conversationTurnsRef.current = conversationTurnsRef.current.slice(-8);
      }

      // Timer confirmation interception — check before normal intent processing
      if (transcript) {
        const timerOfferHandled = await handlePendingTimerOffer(transcript);
        if (timerOfferHandled) return;
        const timerCompletionHandled = await handlePendingTimerCompletion(transcript);
        if (timerCompletionHandled) return;
      }

      // Handle pause intent separately
      if (intent === 'pause') {
        stopVADRef.current?.();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        voiceStateRef.current = VoiceState.IDLE;
        setVoiceState(VoiceState.IDLE);
        return;
      }

      const detectedStepNumber =
        (stepNumber != null ? stepNumber : null) ??
        extractStepNumberFromText(reply) ??
        extractStepNumberFromText(transcript);
      applyNavigationIntent(intent, detectedStepNumber);

      // Before speaking, check if the step has timers — append the offer to the reply
      let finalReply = reply;
      if (['start', 'next', 'previous', 'goto', 'repeat'].includes(intent) && detectedStepNumber != null && reply) {
        const stepIdx = detectedStepNumber - 1;
        const stepText = stepsRef.current[stepIdx]?.text || stepsRef.current[stepIdx]?.instruction || '';
        const detectedTimers = extractTimersFromStep(stepText);
        if (detectedTimers.length > 0) {
          const first = detectedTimers[0];
          const alreadyRunning = Object.keys(timerBridge.activeTimers).some(
            id => id.startsWith(`${stepIdx}-`) && timerBridge.activeTimers[id].remaining > 0
          );
          if (!alreadyRunning) {
            pendingTimerOfferRef.current = { stepIndex: stepIdx, seconds: first.seconds, label: first.text };
            finalReply = `${reply} ... Should I start the ${first.text} timer?`;
          }
        }
      }

      finalReply = scaleStepText(finalReply, servingMultiplierRef.current);
      if (finalReply) await speakText(finalReply, { signal: controller.signal });
      
    } catch (err) {
      if (err.name === 'AbortError') {
        // If aborted by our processing timeout, recover to listening
        if (voiceModeActiveRef.current && voiceStateRef.current === VoiceState.PROCESSING) {
          voiceStateRef.current = VoiceState.LISTENING;
          setVoiceState(VoiceState.LISTENING);
          startVADRef.current?.();
        }
        return;
      }
      console.error('❌ Process error:', err);
      setError('Failed to process speech');
      if (voiceModeActiveRef.current) {
        voiceStateRef.current = VoiceState.LISTENING;
        setVoiceState(VoiceState.LISTENING);
        startVADRef.current?.();
      }
    } finally {
      clearTimeout(processingTimeout);
    }
  }, [speakText, applyNavigationIntent, extractStepNumberFromText, handlePendingTimerOffer, handlePendingTimerCompletion]);
  transcribeAndRespondRef.current = transcribeAndRespond;

  // Stop voice mode
  const stopVoiceMode = useCallback(() => {
    console.log('🛑 Stopping voice mode');

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop VAD
    stopVADRef.current?.();

    // Stop any background barge-in recorder
    stopBargeInRecorder();

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    stopPlaybackAnalysis();

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    closePlaybackAudioContext();
    stopThinkingLoop();

    // Clear timer-voice refs
    pendingTimerOfferRef.current = null;
    pendingTimerNotificationRef.current = null;
    pendingTimerCompletionRef.current = false;

    setIsVoiceModeActive(false);
    setVoiceState(VoiceState.IDLE);
    setLastTranscript('');
    setAiCaption('');
  }, [closePlaybackAudioContext, stopPlaybackAnalysis, stopThinkingLoop, stopBargeInRecorder]);

  // Start voice mode
  const setServingMultiplier = useCallback((multiplier) => {
    servingMultiplierRef.current = multiplier;
  }, []);

  const startVoiceMode = useCallback(async (steps, fromIndex = 0, recipeName = '') => {
    console.log('🎙️ Starting voice mode');

    // Store recipe context
    stepsRef.current = steps;
    recipeNameRef.current = recipeName;
    // Reset conversation history for a fresh session
    conversationTurnsRef.current = [];
    // Set index so the converse endpoint knows where we are, but don't auto-read yet
    currentIndexRef.current = fromIndex;
    setCurrentReadingIndex(fromIndex);

    try {
      // Must run in a user gesture call stack to maximize mobile autoplay compatibility
      await unlockAudioPlayback();

      // Initialize audio stream with echo cancellation
      await initAudioStream();

      setIsVoiceModeActive(true);
      setError(null);

      // Greeting depends on where we're starting
      let greeting;
      if (fromIndex === 0) {
        setHasStartedCooking(false);
        greeting = `Alright chef, ${recipeName || 'let\'s do this'}. Say start when you're ready.`;
      } else {
        // Resuming mid-recipe — mark as already started so "yes/go" triggers continue, not step 1
        setHasStartedCooking(true);
        hasStartedCookingRef.current = true;
        greeting = `Would you like to continue from step ${fromIndex + 1}? Say yes to continue.`;
      }

      await speakText(greeting);

    } catch (err) {
      console.error('❌ Failed to start voice mode:', err);
      setError(err.message);
      stopVoiceMode();
    }
  }, [initAudioStream, speakText, stopVoiceMode, unlockAudioPlayback]);

  // Pause voice mode — interrupts audio & VAD but keeps mic stream alive
  // so the user can scroll / interact with the UI and resume quickly
  const pauseVoiceMode = useCallback(() => {
    if (!voiceModeActiveRef.current) return;
    if (voiceStateRef.current === VoiceState.PROCESSING) return;
    console.log('⏸️ Voice mode paused');

    // Abort any in-flight request (prevents streaming audio from resuming)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop current speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    stopPlaybackAnalysis();
    stopThinkingLoop();

    // Stop VAD + recording
    stopVADRef.current?.();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }

    voiceStateRef.current = VoiceState.IDLE;
    setVoiceState(VoiceState.IDLE);
  }, [stopPlaybackAnalysis, stopThinkingLoop]);

  // Resume voice mode from a specific step after user UI interaction
  const resumeVoiceMode = useCallback(async (fromIndex) => {
    if (!voiceModeActiveRef.current) return;
    console.log('▶️ Resuming voice mode from step', fromIndex + 1);

    // Sync ref immediately so speakText callbacks see the correct index
    currentIndexRef.current = fromIndex;
    setCurrentReadingIndex(fromIndex);

    // Re-initialize audio stream if it was closed
    if (!mediaStreamRef.current || !analyserRef.current) {
      try { await initAudioStream(); } catch { /* mic may already be open */ }
    }

    const stepText = stepsRef.current[fromIndex]?.text;
    if (stepText) {
      await speakText(`Step ${fromIndex + 1}. ${scaleStepText(stepText, servingMultiplierRef.current)}`);
    } else {
      // No step text to speak — go straight to listening
      voiceStateRef.current = VoiceState.LISTENING;
      setVoiceState(VoiceState.LISTENING);
      stopVADRef.current?.();
      startVADRef.current?.();
    }
  }, [speakText, initAudioStream]);

  // Manual speak (for non-voice-mode usage)
  const speak = useCallback(async (text) => {
    if (!text) return;
    await speakText(text);
  }, [speakText]);

  // Read a specific step
  const readStep = useCallback(async (index, steps, recipeName = '') => {
    if (index < 0 || index >= steps.length) return;
    
    stepsRef.current = steps;
    recipeNameRef.current = recipeName;
    setCurrentReadingIndex(index);
    
    await speakText(scaleStepText(steps[index].text, servingMultiplierRef.current));
  }, [speakText]);

  // Listen for timer completion events from Directions and speak notifications
  useEffect(() => {
    const handler = async (e) => {
      try {
        const { stepIndex, label, timerId } = e.detail;
        if (!voiceModeActiveRef.current) return; // voice off — alarm sound handles it

        // Clean up bridge state
        delete timerBridge.activeTimers[timerId];

        const currentStep = currentIndexRef.current;
        let message;
        if (currentStep === stepIndex) {
          message = `Time's up! Your ${label} timer is done. Ready for the next step?`;
          pendingTimerCompletionRef.current = true;
        } else {
          message = `Heads up, your ${label} from step ${stepIndex + 1} is done.`;
        }

        const currentVoiceState = voiceStateRef.current;
        if (currentVoiceState === VoiceState.LISTENING) {
          // Interrupt listening to speak the notification
          stopVADRef.current?.();
          await speakText(message);
        } else if (currentVoiceState === VoiceState.SPEAKING || currentVoiceState === VoiceState.PROCESSING) {
          // Queue — will be drained in speakText's onFinished
          pendingTimerNotificationRef.current = message;
        } else {
          // IDLE (paused) — still notify about timer completion
          await speakText(message);
        }
      } catch (err) {
        console.error('❌ Timer completion notification error:', err);
        // Recover state — resume listening if voice mode is still active
        if (voiceModeActiveRef.current) {
          voiceStateRef.current = VoiceState.LISTENING;
          setVoiceState(VoiceState.LISTENING);
          startVADRef.current?.();
        }
      }
    };
    window.addEventListener('yeschef:timer-complete', handler);
    return () => window.removeEventListener('yeschef:timer-complete', handler);
  }, [speakText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopThinkingLoop();
      thinkingSoundRef.current = null;
      if (ttsAudioElementRef.current) {
        try {
          ttsAudioElementRef.current.pause();
          ttsAudioElementRef.current.removeAttribute('src');
          ttsAudioElementRef.current.load();
        } catch {
          // noop
        }
        ttsAudioElementRef.current = null;
      }
      stopVoiceMode();
      closePlaybackAudioContext();
    };
  }, [closePlaybackAudioContext, stopThinkingLoop, stopVoiceMode]);

  const value = {
    // State machine
    voiceState,
    
    // Legacy state properties for backwards compatibility
    isPlaying,
    isPaused,
    isLoading,
    isListening,
    isProcessing,
    currentReadingIndex,
    error,
    lastTranscript,
    aiCaption,
    speechLevel,
    isVoiceModeActive,
    hasStartedCooking,
    
    // Actions
    startVoiceMode,
    stopVoiceMode,
    pauseVoiceMode,
    resumeVoiceMode,
    speak,
    readStep,
    interruptAudio,
    
    // State setters
    setCurrentReadingIndex,
    setHasStartedCooking,
    setServingMultiplier,
    setError
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

export { VoiceState };
