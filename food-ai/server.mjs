import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import { getVideoDetails } from 'youtube-caption-extractor';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { OPENAI_CONFIG } from './src/config.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables with absolute path
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 5001;
const YT_COOKIE = process.env.YT_COOKIE || '';
const YT_COOKIES_FILE = process.env.YT_COOKIES_FILE || '';
// Simple in-memory cache for transcripts (videoId -> { data, ts })
const transcriptCache = new Map();
const TRANSCRIPT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Debug environment variables
console.log('Environment check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (starts with ' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : 'Not set');
console.log('YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? 'Set (starts with ' + process.env.YOUTUBE_API_KEY.substring(0, 10) + '...)' : 'Not set');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Set (starts with ' + process.env.GOOGLE_API_KEY.substring(0, 10) + '...)' : 'Not set');
console.log('GOOGLE_SEARCH_ENGINE_ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? 'Set (' + process.env.GOOGLE_SEARCH_ENGINE_ID + ')' : 'Not set');

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Optional: load Cookie header for youtube.com (reduce 429s)
function loadYouTubeCookie() {
  if (YT_COOKIE) return YT_COOKIE.trim();
  if (YT_COOKIES_FILE) {
    try {
      const raw = fs.readFileSync(YT_COOKIES_FILE, 'utf8');
      const pairs = [];
      for (const line of raw.split(/\r?\n/)) {
        if (!line || line.startsWith('#')) continue;
        const parts = line.split(/\t/);
        if (parts.length < 7) continue;
        const domain = parts[0];
        const name = parts[5];
        const value = parts[6];
        if (!name || !value) continue;
        if (domain.includes('youtube.com')) pairs.push(`${name}=${value}`.trim());
      }
      if (pairs.length) return pairs.join('; ');
    } catch {}
  }
  return '';
}
const YT_COOKIE_HEADER = loadYouTubeCookie();

async function searchYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set');
  // Prefer videos with closed captions first to increase transcript success rate
  const base = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' recipe cooking tutorial')}&maxResults=10&type=video&videoEmbeddable=true&key=${apiKey}`;
  const withCaptionsUrl = `${base}&videoCaption=closedCaption`;
  const fallbackUrl = base;
  const tryUrls = [withCaptionsUrl, fallbackUrl];
  for (const url of tryUrls) {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`YouTube API ${response.status} error:`, errorData);
      // Try next URL if available
      continue;
    }
    const data = await response.json();
    if (data.items && data.items.length) return data.items;
  }
  return [];
}

async function getVideoTranscript(videoId, opts = {}) {
  const { requireHuman = false, preferredLangs = ['en', 'en-US', 'en-GB'] } = opts;
  // Cache hit
  const cached = transcriptCache.get(videoId);
  if (cached && Date.now() - cached.ts < TRANSCRIPT_TTL_MS) {
    return cached.data;
  }
  // 1) Try official library first
  try {
    const lang = preferredLangs?.[0] || 'en';
    const details = await getVideoDetails({ videoID: videoId, lang });
    const subs = details?.subtitles || [];
    const transcript = subs.map(s => ({
      text: s.text || '',
      start: parseFloat(s.start || '0'),
      duration: parseFloat(s.dur || '0'),
    })).filter(t => t.text && !Number.isNaN(t.start));
    if (transcript.length) {
      transcriptCache.set(videoId, { data: transcript, ts: Date.now() });
      return transcript;
    }
  } catch (e) {
    console.warn(`Library transcript fetch failed for ${videoId}:`, e?.message || e);
  }

  // 2) Fallback to direct YouTube transcript scraping
  try {
    const transcript = await fetchTranscriptDirect(videoId, { requireHuman, preferredLangs });
    if (transcript && transcript.length) return transcript;
  } catch (e) {
    console.warn(`Direct transcript fetch failed for ${videoId}:`, e.message);
  }
  
  return null;
}

// Fetch available caption tracks and then download transcript via YouTube timedtext endpoint
// Direct YouTube transcript scraping (like jdepoix/youtube-transcript-api)
async function fetchTranscriptDirect(videoId, { requireHuman = false, preferredLangs = ['en', 'en-US', 'en-GB'] } = {}) {
  // Step 1: Get the video page to extract player response
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      ...(YT_COOKIE_HEADER ? { 'Cookie': YT_COOKIE_HEADER } : {})
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch video page: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Extract captions from player response
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (!playerResponseMatch) {
    throw new Error('Could not find ytInitialPlayerResponse');
  }
  
  let playerResponse;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch (e) {
    throw new Error('Failed to parse player response JSON');
  }
  
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captions || !captions.length) {
    throw new Error('No captions found');
  }
  
  // Filter and select the best caption track
  let selectedTrack = null;
  
  // Prefer manual captions over auto-generated
  const manualTracks = captions.filter(track => !track.kind || track.kind !== 'asr');
  const autoTracks = captions.filter(track => track.kind === 'asr');
  
  const findByLang = (tracks) => {
    for (const lang of preferredLangs) {
      const track = tracks.find(t => t.languageCode?.toLowerCase().startsWith(lang.toLowerCase()));
      if (track) return track;
    }
    return tracks[0];
  };
  
  if (requireHuman && manualTracks.length > 0) {
    selectedTrack = findByLang(manualTracks);
  } else if (manualTracks.length > 0) {
    selectedTrack = findByLang(manualTracks);
  } else if (autoTracks.length > 0) {
    selectedTrack = findByLang(autoTracks);
  }
  
  if (!selectedTrack) {
    throw new Error('No suitable caption track found');
  }
  
  console.log(`Selected caption track for ${videoId}: ${selectedTrack.languageCode || 'unknown'} (${selectedTrack.kind || 'manual'})`);
  
  // Fetch the transcript
  const transcriptUrl = selectedTrack.baseUrl;
  let transcriptXml = '';
  let ok = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const transcriptResponse = await fetch(transcriptUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(YT_COOKIE_HEADER ? { 'Cookie': YT_COOKIE_HEADER } : {})
      }
    });
    if (transcriptResponse.ok) {
      transcriptXml = await transcriptResponse.text();
      ok = true;
      break;
    }
    if (transcriptResponse.status === 429 || transcriptResponse.status >= 500) {
      await new Promise(r => setTimeout(r, 350 * attempt));
      continue;
    }
    throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
  }
  if (!ok) throw new Error('Failed to fetch transcript after retries');
  
  // Debug: Log raw XML (first 500 chars)
  console.log(`Raw transcript XML for ${videoId}:`, transcriptXml.substring(0, 500) + '...');
  
  // Parse the XML transcript
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true
  });
  
  const parsed = parser.parse(transcriptXml);
  console.log(`Parsed transcript structure for ${videoId}:`, JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
  
  const textElements = parsed?.transcript?.text;
  
  if (!textElements) {
  throw new Error('No transcript text found in XML');
  }
  
  const texts = Array.isArray(textElements) ? textElements : [textElements];
  
  const out = texts.map(item => ({
    text: (item['#text'] || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
    start: parseFloat(item['@_start'] || 0),
    duration: parseFloat(item['@_dur'] || 0)
  })).filter(item => item.text.trim());
  if (out.length) transcriptCache.set(videoId, { data: out, ts: Date.now() });
  return out;
}

async function parseTranscriptToSteps(transcript, recipeName) {
  const transcriptText = transcript.map(t => `[${t.start}s] ${t.text}`).join(' ');
  const prompt = `You are a professional recipe analyzer. Parse this YouTube cooking video transcript for "${recipeName}" and extract ONLY the cooking steps.\n\nTranscript: ${transcriptText}\n\nReturn a JSON object with a steps array. Each step:\n- text: instruction\n- heat: low|medium|high|null\n- time: number minutes or null\n- timestamp: integer seconds\nMax 12 steps.`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: OPENAI_CONFIG.TEMPERATURE,
    response_format: { type: 'json_object' }
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);
    return result.steps || [];
  } catch {
    return [];
  }
}

async function extractIngredients(transcript, recipeName) {
  const transcriptText = transcript.map(t => t.text).join(' ');
  const prompt = `Extract ingredients from this cooking video transcript for "${recipeName}".\n\nTranscript: ${transcriptText}\n\nReturn JSON with an \"ingredients\" array of objects {name, quantity}.`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: OPENAI_CONFIG.TEMPERATURE,
    response_format: { type: 'json_object' }
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);
    return result.ingredients || [];
  } catch {
    return [];
  }
}

async function getToolsAndAllergens(recipeName, ingredients) {
  const ingredientsList = ingredients.map(i => i.name).join(', ');
  const prompt = `For the recipe \"${recipeName}\" with ingredients: ${ingredientsList}\nReturn JSON with \"tools\" (uncommon only) and \"allergens\" arrays.`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: OPENAI_CONFIG.TEMPERATURE,
    response_format: { type: 'json_object' }
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);
    return { tools: result.tools || [], allergens: result.allergens || [] };
  } catch {
    return { tools: [], allergens: [] };
  }
}

async function getFoodImage(recipeName) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) return null;
  const query = `${recipeName} food photography high resolution`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&imgSize=large&imgType=photo&num=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.link || null;
  } catch {
    return null;
  }
}

app.post('/api/recipe', async (req, res) => {
  try {
    const { recipeName } = req.body || {};
    if (!recipeName) return res.status(400).json({ success: false, error: 'Recipe name is required' });

  const youtubeResults = await searchYouTube(recipeName);
    let selectedVideo = null;
    let transcript = null;

    const tried = [];
    for (const video of youtubeResults.slice(0, 5)) {
      const vid = video?.id?.videoId;
      if (!vid) continue;
      tried.push(vid);
      const tr = await getVideoTranscript(vid, { requireHuman: false });
      if (tr && tr.length) { selectedVideo = video; transcript = tr; break; }
      // Backoff to reduce 429s
      await new Promise(r => setTimeout(r, 1200 + Math.floor(Math.random() * 600)));
    }

    if (!selectedVideo || !transcript) {
      return res.status(404).json({
        success: false,
        error: 'Unable to find any recipe videos with transcripts',
        debug: { triedVideoIds: tried }
      });
    }

    const [steps, ingredients, image] = await Promise.all([
      parseTranscriptToSteps(transcript, recipeName),
      extractIngredients(transcript, recipeName),
      getFoodImage(recipeName)
    ]);

    const { tools, allergens } = await getToolsAndAllergens(recipeName, ingredients);

    const data = {
      name: recipeName,
      videoId: selectedVideo.id.videoId,
      videoTitle: selectedVideo.snippet.title,
      videoLink: `https://www.youtube.com/watch?v=${selectedVideo.id.videoId}`,
      image,
      ingredients,
      steps: steps.map((step, i) => ({
        id: i + 1,
        text: step.text,
        heat: step.heat || null,
        time: step.time ?? null,
        timestamp: step.timestamp,
        videoLink: `https://www.youtube.com/watch?v=${selectedVideo.id.videoId}&t=${step.timestamp}s`
      })),
      tools,
      allergens
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error('Recipe API error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Debug endpoint: search only and return video ids and titles
// Removed unused debug endpoints: /api/debug/search and /api/debug/transcript

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
