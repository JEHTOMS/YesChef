// Clean Express server following DmitrySadovnikov architecture
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
// @google-cloud/speech and multer are lazy-loaded in the STT endpoint to avoid
// crashing on startup when credentials aren't configured

import { ROUTES, CORS_CONFIG, PORT } from './src/config.js';
import { captionsHandler } from './src/captionsHandler.js';
import { socialMediaHandler } from './src/socialMediaHandler.js';
import { recipeHandler, clearRecipeCache } from './src/recipeHandler.js';
import { storesHandler } from './src/storesHandler.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables with absolute path - only if file exists
const envPath = join(__dirname, '.env.local');
try {
    dotenv.config({ path: envPath });
    console.log('🔧 Loaded local environment variables');
} catch (err) {
    console.log('⚙️ Using system environment variables (production mode)');
}

const app = express();

// Stripe + Supabase Admin (for payment processing & webhook writes)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Use Railway's PORT or fallback to config PORT
const serverPort = process.env.PORT || PORT;

console.log('🚀 Starting YesChef Backend...');
console.log(`📊 Node version: ${process.version}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📡 Port: ${serverPort}`);
console.log(`🔑 Environment variables loaded:`, {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
    GOOGLE_SEARCH_ENGINE_ID: !!process.env.GOOGLE_SEARCH_ENGINE_ID,
    GOOGLE_PLACES_API_KEY: !!process.env.GOOGLE_PLACES_API_KEY,
    VIDNAVIGATOR_API_KEY: !!process.env.VIDNAVIGATOR_API_KEY,
    YT_COOKIE: !!process.env.YT_COOKIE,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

// Middleware
app.use(cors(CORS_CONFIG));
// Conditional body parsing: Stripe webhook needs raw body for signature verification
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.static('build')); // Serve React build

// Environment check
console.log('\n🔧 Environment Status:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('GOOGLE_SEARCH_ENGINE_ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅ Configured' : '❌ Missing');
console.log('GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('VIDNAVIGATOR_API_KEY:', process.env.VIDNAVIGATOR_API_KEY ? '✅ Configured' : '❌ Missing');
console.log();

// Helper function to send handler responses
const sendHandlerResponse = (res, handlerResult) => {
  res.status(handlerResult.statusCode);

  if (handlerResult.headers) {
    Object.entries(handlerResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.send(handlerResult.body);
};

// API Routes
app.post(ROUTES.CAPTIONS, async (req, res) => {
  const result = await captionsHandler(req.body);
  sendHandlerResponse(res, result);
});

app.post(ROUTES.RECIPE, async (req, res) => {
  const result = await recipeHandler(req.body);
  sendHandlerResponse(res, result);
});

app.post(ROUTES.STORES, async (req, res) => {
  const result = await storesHandler(req.body);
  sendHandlerResponse(res, result);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      openai: !!process.env.OPENAI_API_KEY,
      google: !!process.env.GOOGLE_API_KEY && !!process.env.GOOGLE_SEARCH_ENGINE_ID,
      ytCookie: !!process.env.YT_COOKIE
    }
  });
});

// Clear recipe cache (useful for debugging)
app.post('/api/clear-cache', (req, res) => {
  const cleared = clearRecipeCache();
  res.json({
    success: true,
    message: `Cleared ${cleared} cached recipes`,
    timestamp: new Date().toISOString()
  });
});

// Text-to-Speech endpoint using OpenAI TTS
app.post('/api/speech/tts', async (req, res) => {
  try {
    const { text, voice = 'alloy' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      response_format: 'mp3'
    });

    // Stream the audio to the client so playback can start before full download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    const nodeStream = response.body;
    if (nodeStream && typeof nodeStream.pipe === 'function') {
      nodeStream.pipe(res);
    } else {
      // Fallback: send full buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    }

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech', details: error.message });
  }
});

// Speech-to-Text endpoint using Google Cloud Speech (lazy-loaded)
let _multer = null;
let _speech = null;
let _speechClient = null;

async function getMulter() {
  if (!_multer) {
    const m = await import('multer');
    _multer = m.default;
  }
  return _multer;
}

async function getSpeechClient() {
  if (!_speechClient) {
    if (!_speech) {
      const s = await import('@google-cloud/speech');
      _speech = s.default;
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      _speechClient = new _speech.SpeechClient({ credentials });
      console.log('🎤 Google Speech client initialized from JSON credentials');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      _speechClient = new _speech.SpeechClient();
      console.log('🎤 Google Speech client initialized from file credentials');
    } else {
      throw new Error('Google Cloud credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS');
    }
  }
  return _speechClient;
}

app.post('/api/speech/stt', async (req, res) => {
  try {
    // Lazy-load multer and Google Speech
    const multer = await getMulter();
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

    // Process the upload
    await new Promise((resolve, reject) => {
      upload.single('audio')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const client = await getSpeechClient();

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioBytes = req.file.buffer.toString('base64');

    // Detect encoding from mimetype
    let encoding = 'WEBM_OPUS';
    const mimeType = req.file.mimetype || '';
    if (mimeType.includes('wav')) {
      encoding = 'LINEAR16';
    } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
      encoding = 'MP3';
    } else if (mimeType.includes('ogg')) {
      encoding = 'OGG_OPUS';
    } else if (mimeType.includes('flac')) {
      encoding = 'FLAC';
    }

    // Build speech context phrases — navigation commands + optional recipe-specific hints
    const basePhrases = [
      'next step', 'previous step', 'go back', 'repeat', 'say that again',
      'step 1', 'step 2', 'step 3', 'step 4', 'step 5', 'step 6', 'step 7', 'step 8', 'step 9', 'step 10',
      'go to step', 'skip to step', 'jump to step',
      'what\'s next', 'move on', 'continue', 'done', 'finished',
      'how long', 'how much', 'what temperature',
      'stop', 'pause', 'wait', 'hold on'
    ];

    // Add recipe-specific hints if provided (ingredient names, recipe name, etc.)
    let extraHints = [];
    try {
      const hintsRaw = req.body.hints;
      if (hintsRaw) {
        extraHints = JSON.parse(hintsRaw);
        if (!Array.isArray(extraHints)) extraHints = [];
      }
    } catch {}

    const phrases = [...basePhrases, ...extraHints].slice(0, 500); // Google limit

    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: encoding,
        sampleRateHertz: req.body.sampleRate ? parseInt(req.body.sampleRate) : 48000,
        languageCode: 'en-GB',
        enableAutomaticPunctuation: true,
        model: 'latest_short',
        useEnhanced: true,
        speechContexts: [{ phrases, boost: 15 }],
      },
    };

    console.log('🎤 Transcribing audio:', {
      size: req.file.size,
      mimeType: req.file.mimetype,
      encoding
    });

    const [response] = await client.recognize(request);
    const transcript = response.results
      .map(result => result.alternatives[0]?.transcript || '')
      .join(' ')
      .trim();

    console.log('📝 Transcript:', transcript || '(empty)');

    res.json({ transcript, confidence: response.results[0]?.alternatives[0]?.confidence || 0 });

  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  }
});

// Combined STT + Converse endpoint — single round-trip from client
// Accepts audio FormData, transcribes via Google STT, then runs converse, returns text immediately
app.post('/api/speech/process', async (req, res) => {
  try {
    const multer = await getMulter();
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
    await new Promise((resolve, reject) => {
      upload.single('audio')(req, res, (err) => err ? reject(err) : resolve());
    });

    const client = await getSpeechClient();
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    // --- STT phase ---
    const audioBytes = req.file.buffer.toString('base64');
    let encoding = 'WEBM_OPUS';
    const mimeType = req.file.mimetype || '';
    if (mimeType.includes('wav')) encoding = 'LINEAR16';
    else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) encoding = 'MP3';
    else if (mimeType.includes('ogg')) encoding = 'OGG_OPUS';
    else if (mimeType.includes('flac')) encoding = 'FLAC';

    const basePhrases = [
      'next step', 'previous step', 'go back', 'repeat', 'say that again',
      'step 1', 'step 2', 'step 3', 'step 4', 'step 5', 'step 6', 'step 7', 'step 8', 'step 9', 'step 10',
      'go to step', 'skip to step', 'jump to step', 'start', 'yes', 'begin', 'ready',
      'what\'s next', 'move on', 'continue', 'done', 'finished',
      'how long', 'how much', 'what temperature',
      'stop', 'pause', 'wait', 'hold on'
    ];
    let extraHints = [];
    try { const h = req.body.hints; if (h) { extraHints = JSON.parse(h); if (!Array.isArray(extraHints)) extraHints = []; } } catch {}
    const phrases = [...basePhrases, ...extraHints].slice(0, 500);

    const sttRequest = {
      audio: { content: audioBytes },
      config: {
        encoding,
        sampleRateHertz: req.body.sampleRate ? parseInt(req.body.sampleRate) : 48000,
        languageCode: 'en-GB',
        enableAutomaticPunctuation: true,
        model: 'latest_short',
        useEnhanced: true,
        speechContexts: [{ phrases, boost: 15 }],
      },
    };

    console.log('🎤 [process] Transcribing audio:', { size: req.file.size, encoding });
    const [sttResponse] = await client.recognize(sttRequest);
    const transcript = sttResponse.results
      .map(r => r.alternatives[0]?.transcript || '')
      .join(' ').trim();
    const confidence = sttResponse.results[0]?.alternatives[0]?.confidence || 0;
    console.log('📝 [process] Transcript:', transcript || '(empty)', 'conf:', confidence.toFixed(2));

    if (!transcript) {
      return res.json({ transcript: '', reply: '', intent: 'chat', stepNumber: null, confidence });
    }

    // --- Converse phase (runs immediately on the server, no extra round-trip) ---
    const currentStep = parseInt(req.body.currentStep, 10) || 0;
    let steps = [];
    try { steps = JSON.parse(req.body.steps || '[]'); } catch { steps = []; }
    const recipeName = req.body.recipeName || '';

    // (fall through to shared converse logic below)
    req._processedTranscript = transcript;
    req._processedConfidence = confidence;
    req._processedCurrentStep = currentStep;
    req._processedSteps = steps;
    req._processedRecipeName = recipeName;
    req._processedVoice = req.body.voice || 'alloy';
    req._processedHasStarted = req.body.hasStarted === 'true';
    req._isCombined = true;

    // Call the shared converse handler
    return handleConverse(req, res);
  } catch (error) {
    console.error('[process] Error:', error);
    res.status(500).json({ error: 'Failed to process speech', details: error.message });
  }
});

// ─── Deterministic intent classifier ───────────────────────────────────────
// Matches clear navigation commands BEFORE sending to GPT.
// Returns { intent, stepNumber (1-indexed) } or null if ambiguous → GPT.
function classifyIntent(transcript, currentStep, totalSteps, hasStarted) {
  const t = transcript.toLowerCase().trim().replace(/[.,!?]/g, '');

  // Start / begin cooking (only when user hasn't started yet)
  if (!hasStarted && /^(start|yes|yeah|yep|yup|sure|go|ready|begin|let'?s\s*(go|cook|do\s*(it|this))|let\s+us\s*(go|cook|do\s*(it|this)|begin|start)|ok(ay)?|alright|i'?m\s+ready|let'?s\s+do\s+it)$/i.test(t)) {
    return { intent: 'start', stepNumber: currentStep + 1 }; // read current step (usually step 1)
  }

  // Next step
  if (/^(next(\s+step)?|move\s+on|continue|done|finished|i'?m\s+done|what'?s\s+next|okay\s+next(\s+one)?|keep\s+going|next\s+one)$/i.test(t)) {
    const nextIdx = Math.min(currentStep + 1, totalSteps - 1);
    return { intent: 'next', stepNumber: nextIdx + 1 };
  }

  // Previous step
  if (/^(previous(\s+step)?|go\s+back|back|last\s+step|wait\s+go\s+back)$/i.test(t)) {
    const prevIdx = Math.max(currentStep - 1, 0);
    return { intent: 'previous', stepNumber: prevIdx + 1 };
  }

  // Repeat current step
  if (/^(repeat|say\s+that\s+again|again|what\s+was\s+that|one\s+more\s+time|come\s+again|huh|what|pardon|sorry)$/i.test(t)) {
    return { intent: 'repeat', stepNumber: currentStep + 1 };
  }

  // Confirmation to continue from current step (after re-activation mid-recipe)
  if (hasStarted && /^(yes|yeah|yep|yup|sure|go|ok(ay)?|alright|continue|go\s+ahead|let'?s\s+go|ready)$/i.test(t)) {
    return { intent: 'repeat', stepNumber: currentStep + 1 };
  }

  // Go to step N
  const gotoMatch = t.match(/(?:go\s+(?:to|back\s+to)|skip\s+to|jump\s+to|take\s+me\s+to)?\s*step\s+(\d+)/i);
  if (gotoMatch) {
    const n = parseInt(gotoMatch[1], 10);
    if (n >= 1 && n <= totalSteps) {
      return { intent: 'goto', stepNumber: n };
    }
  }

  // Pause
  if (/^(stop|pause|wait|hold\s+on|one\s+moment|give\s+me\s+a\s+sec)$/i.test(t)) {
    return { intent: 'pause', stepNumber: null };
  }

  return null; // ambiguous → send to GPT
}

// Shared converse logic used by both /api/speech/process and /api/speech/converse
async function handleConverse(req, res) {
  try {
    let transcript, currentStep, steps, recipeName, hasStarted;

    if (req._isCombined) {
      transcript = req._processedTranscript;
      currentStep = req._processedCurrentStep;
      steps = req._processedSteps;
      recipeName = req._processedRecipeName;
      hasStarted = req._processedHasStarted;
    } else {
      ({ transcript, currentStep, steps, recipeName } = req.body);
      hasStarted = req.body.hasStarted === true || req.body.hasStarted === 'true';
    }

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const totalSteps = steps?.length || 0;

    // ── 1. Try deterministic classification first (instant, reliable) ──
    const classified = classifyIntent(transcript, currentStep, totalSteps, hasStarted);

    let intent, stepNumber, reply;

    if (classified) {
      intent = classified.intent;
      stepNumber = classified.stepNumber;

      // Build a clean direct reply — no GPT needed
      if (intent === 'pause') {
        reply = 'Got it, pausing.';
      } else if (stepNumber != null) {
        const idx = stepNumber - 1;
        const text = (steps?.[idx]?.text || steps?.[idx]?.instruction || '').trim();
        reply = text ? `Step ${stepNumber}. ${text}` : `Step ${stepNumber}.`;
      } else {
        reply = '';
      }
      console.log(`⚡ [deterministic] intent=${intent} step=${stepNumber} for "${transcript}"`);

    } else {
      // ── 2. Fall through to GPT for chat / ambiguous commands ──
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const currentStepText = steps?.[currentStep]?.text || steps?.[currentStep]?.instruction || '';
      const stepsListStr = (steps || []).map((s, i) => {
        const txt = (s.text || s.instruction || '').substring(0, 200);
        return `  Step ${i + 1}: ${txt}`;
      }).join('\n');

      const systemPrompt = `You are YesChef — a sharp, no-nonsense chef guiding someone through "${recipeName || 'a recipe'}".
Answer cooking questions in 1 SHORT sentence. End every reply with [INTENT: action].

INTENT RULES:
- "chat" = answering a question, giving advice, or any conversational reply. USE THIS MOST OF THE TIME.
- "pause" = ONLY when the user explicitly says "stop", "pause", or "hold on". NEVER use pause for answering questions.
- "next" / "previous" / "repeat" = navigation commands from the user.
- "goto:N" = user asks to jump to step N.

ALL STEPS:\n${stepsListStr}\nCurrent: Step ${currentStep + 1} of ${totalSteps} — "${currentStepText}"`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        temperature: 0.5,
        max_tokens: 150
      });

      const rawReply = response.choices[0].message.content;
      console.log(`🤖 [GPT] Raw reply: "${rawReply}"`);
      intent = 'chat';
      stepNumber = null;
      reply = rawReply;

      const intentMatch = rawReply.match(/\[INTENT:\s*(\S+?)\s*\]/i);
      if (intentMatch) {
        const intentStr = intentMatch[1].toLowerCase();
        reply = rawReply.replace(/\s*\[INTENT:\s*\S+?\s*\]/i, '').trim();

        if (intentStr.startsWith('goto:')) {
          intent = 'goto';
          stepNumber = parseInt(intentStr.split(':')[1], 10);
          if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > totalSteps) {
            intent = 'chat';
            stepNumber = null;
          }
        } else if (['start', 'next', 'previous', 'repeat', 'pause', 'chat'].includes(intentStr)) {
          intent = intentStr;
        }
      }

      // For nav intents from GPT, resolve the target step
      let targetStepIdx = null;
      if (intent === 'start')    targetStepIdx = currentStep;
      if (intent === 'next')     targetStepIdx = Math.min(currentStep + 1, totalSteps - 1);
      if (intent === 'previous') targetStepIdx = Math.max(currentStep - 1, 0);
      if (intent === 'repeat')   targetStepIdx = currentStep;
      if (intent === 'goto' && stepNumber != null) targetStepIdx = stepNumber - 1;

      if (targetStepIdx != null && targetStepIdx >= 0 && targetStepIdx < totalSteps) {
        stepNumber = targetStepIdx + 1;
        const targetText = (steps[targetStepIdx]?.text || steps[targetStepIdx]?.instruction || '').trim();
        const alreadyHasTarget = targetText && reply.includes(targetText.substring(0, Math.min(30, targetText.length)));
        if (targetText && !alreadyHasTarget) {
          reply = `Step ${targetStepIdx + 1}. ${targetText}`;
        }
      }
    }

    console.log(`📣 [converse] intent=${intent} step=${stepNumber} reply="${(reply || '').substring(0, 80)}"`);

    // For combined endpoint: stream TTS audio directly (eliminates extra round-trip)
    if (req._isCombined && reply && intent !== 'pause' && process.env.OPENAI_API_KEY) {
      try {
        const voice = req._processedVoice || 'alloy';
        const ttsClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const ttsResponse = await ttsClient.audio.speech.create({
          model: 'tts-1',
          voice,
          input: reply,
          response_format: 'mp3'
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('X-Transcript', encodeURIComponent(transcript));
        res.setHeader('X-Reply', encodeURIComponent(reply));
        res.setHeader('X-Intent', intent);
        if (stepNumber != null) res.setHeader('X-Step-Number', String(stepNumber));

        const nodeStream = ttsResponse.body;
        if (nodeStream && typeof nodeStream.pipe === 'function') {
          nodeStream.pipe(res);
        } else {
          const buffer = Buffer.from(await ttsResponse.arrayBuffer());
          res.send(buffer);
        }
        return;
      } catch (ttsErr) {
        console.error('TTS streaming failed, falling back to JSON:', ttsErr.message);
      }
    }

    const result = { reply, intent, stepNumber, transcript };
    if (req._isCombined) {
      result.confidence = req._processedConfidence;
    }
    res.json(result);

  } catch (error) {
    console.error('Converse Error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
}

// Standalone converse endpoint (kept for backwards compat)
app.post('/api/speech/converse', (req, res) => handleConverse(req, res));

// YouTube transcript extraction using Python youtube-transcript-api
// This is more reliable than the Node.js libraries for production
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

app.post('/api/transcript', async (req, res) => {
  try {
    const { videoId, languages } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    console.log(`📺 Fetching transcript for: ${videoId}`);

    const args = [join(__dirname, 'transcript_fetcher.py'), videoId];
    if (languages) args.push('transcript');

    const { stdout, stderr } = await execFileAsync('python3', args, {
      timeout: 30000,
      cwd: __dirname
    });

    if (stderr) console.warn('Python stderr:', stderr);

    const result = JSON.parse(stdout);

    if (result.success) {
      // Convert to the format captionsHandler expects
      const subtitles = result.transcript.map(t => ({
        start: t.start?.toString() || '0',
        dur: t.duration?.toString() || '1',
        text: t.text || ''
      }));

      console.log(`✅ Python transcript success: ${subtitles.length} segments`);
      res.json({
        success: true,
        data: {
          videoId,
          title: `Video ${videoId}`,
          description: `Extracted via youtube-transcript-api (${result.language || 'en'})`,
          subtitles,
          language: result.language_code,
          isGenerated: result.is_generated
        }
      });
    } else {
      throw new Error(result.error || 'Python transcript fetch failed');
    }

  } catch (error) {
    console.error('Transcript Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch transcript',
      details: error.message
    });
  }
});

// ── Stripe Payment Endpoints ─────────────────────────────────────────────────

// Create a Stripe Checkout session (credits or subscription)
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe || !supabaseAdmin) {
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  try {
    const { type, billingPeriod, credits, userId, email } = req.body;

    if (!userId || !email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || '';

    let sessionConfig = {
      customer: customerId,
      success_url: `${origin}/plans?success=true`,
      cancel_url: `${origin}/plans?canceled=true`,
      metadata: { supabase_user_id: userId },
    };

    if (type === 'credits') {
      const creditAmount = parseInt(credits, 10);
      if (!creditAmount || creditAmount < 10 || creditAmount % 10 !== 0) {
        return res.status(400).json({ error: 'Invalid credit amount (min 10, increments of 10)' });
      }
      const unitAmountCents = creditAmount * 20; // 10 credits = $2.00 = 200 cents

      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${creditAmount} YesChef Credits` },
          unit_amount: unitAmountCents,
        },
        quantity: 1,
      }];
      sessionConfig.metadata.type = 'credits';
      sessionConfig.metadata.credit_amount = String(creditAmount);

    } else if (type === 'subscription') {
      const priceMap = {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
        lifetime: process.env.STRIPE_PRO_LIFETIME_PRICE_ID,
      };

      const priceId = priceMap[billingPeriod];
      if (!priceId) {
        return res.status(400).json({ error: 'Invalid billing period' });
      }

      sessionConfig.mode = billingPeriod === 'lifetime' ? 'payment' : 'subscription';
      sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
      sessionConfig.metadata.type = 'subscription';
      sessionConfig.metadata.billing_period = billingPeriod;
    } else {
      return res.status(400).json({ error: 'Invalid checkout type' });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('💳 Checkout session created:', { type, sessionId: session.id });
    res.json({ url: session.url });

  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook — processes payment confirmations
app.post('/api/stripe/webhook', async (req, res) => {
  if (!stripe || !supabaseAdmin) {
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔔 Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.supabase_user_id;
        const type = session.metadata.type;

        if (type === 'credits') {
          const creditAmount = parseInt(session.metadata.credit_amount, 10);

          // Duplicate guard: check if we already processed this session
          const { data: existing } = await supabaseAdmin
            .from('credit_transactions')
            .select('id')
            .eq('stripe_session_id', session.id)
            .maybeSingle();

          if (existing) {
            console.log('⏭️ Duplicate webhook, skipping:', session.id);
            break;
          }

          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

          const newBalance = (profile?.credits || 0) + creditAmount;

          await supabaseAdmin
            .from('profiles')
            .update({ credits: newBalance })
            .eq('id', userId);

          await supabaseAdmin
            .from('credit_transactions')
            .insert({
              user_id: userId,
              amount: creditAmount,
              balance_after: newBalance,
              type: 'purchase',
              stripe_session_id: session.id,
            });

          console.log(`💰 Added ${creditAmount} credits to user ${userId}. New balance: ${newBalance}`);

        } else if (type === 'subscription') {
          const billingPeriod = session.metadata.billing_period;

          if (billingPeriod === 'lifetime') {
            await supabaseAdmin
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_tier: 'lifetime',
                subscription_id: null,
                subscription_current_period_end: null,
              })
              .eq('id', userId);
            console.log(`👑 Lifetime subscription activated for user ${userId}`);
          }
          // Monthly/annual handled by customer.subscription.created
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const status = subscription.status === 'active' ? 'active'
            : subscription.status === 'past_due' ? 'past_due'
            : 'canceled';

          const priceId = subscription.items.data[0]?.price?.id;
          let tier = 'monthly';
          if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) tier = 'annual';

          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: status,
              subscription_tier: tier,
              subscription_id: subscription.id,
              subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', profile.id);

          console.log(`📋 Subscription ${event.type}: user ${profile.id}, status=${status}, tier=${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'free',
              subscription_tier: null,
              subscription_id: null,
              subscription_current_period_end: null,
            })
            .eq('id', profile.id);
          console.log(`❌ Subscription canceled for user ${profile.id}`);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── Recipe Save with Credit Deduction ────────────────────────────────────────

app.post('/api/recipes/save', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service not configured' });
  }

  try {
    const { userId, recipeData, originalQuery } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check subscription status and credits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const isPro = profile.subscription_status === 'active';

    if (!isPro && profile.credits < 1) {
      return res.status(403).json({
        error: 'Insufficient credits',
        credits: profile.credits,
        needsUpgrade: true,
      });
    }

    // Build the recipe row
    const recipe = recipeData?.recipe || recipeData;
    const videoId = recipeData?.videoId;
    const thumbnail = recipeData?.thumbnail
      || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)
      || recipe?.image
      || null;

    const newRecipe = {
      user_id: userId,
      recipe_title: recipe?.title || 'Untitled Recipe',
      recipe_image: thumbnail,
      cook_time: recipe?.cookTime || null,
      servings: recipe?.servings || null,
      recipe_data: recipeData,
      video_id: videoId || null,
      original_url: originalQuery || null,
    };

    // Insert the recipe
    const { data: savedRecipe, error: insertError } = await supabaseAdmin
      .from('saved_recipes')
      .insert(newRecipe)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Recipe already saved' });
      }
      throw insertError;
    }

    // Deduct credit (only if not Pro)
    let newBalance = profile.credits;
    if (!isPro) {
      newBalance = profile.credits - 1;
      await supabaseAdmin
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);

      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -1,
          balance_after: newBalance,
          type: 'save_recipe',
          recipe_id: savedRecipe.id,
        });
    }

    console.log(`📌 Recipe saved for user ${userId}. Credits: ${newBalance}${isPro ? ' (Pro)' : ''}`);

    res.json({
      success: true,
      recipe: savedRecipe,
      credits: newBalance,
      isPro,
    });

  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(serverPort, () => {
  console.log(`🚀 Clean Recipe AI server running on http://localhost:${serverPort}`);
  console.log('📋 Available endpoints:');
  console.log(`   POST ${ROUTES.CAPTIONS} - Extract video captions`);
  console.log(`   POST ${ROUTES.RECIPE} - Generate structured recipe`);
  console.log(`   POST ${ROUTES.STORES} - Find nearby grocery stores`);
  console.log(`   GET  /health - Health check`);
  console.log();
});

export default app;
