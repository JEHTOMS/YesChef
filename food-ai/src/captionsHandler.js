// Hybrid caption extraction handler using multiple methods for maximum compatibility
import { fetchTranscript } from 'youtube-transcript-plus';
let YoutubeTranscript;
try {
  const mod = await import('@danielxceron/youtube-transcript');
  YoutubeTranscript = mod.YoutubeTranscript;
} catch (e) {
  console.warn('⚠️ @danielxceron/youtube-transcript not available:', e.message);
}
import { getVideoDetails } from 'youtube-caption-extractor';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Random user agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const captionsHandler = async (body) => {
  try {
    const { videoInput, lang = 'en' } = body;

    if (!videoInput) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Video URL or ID is required'
        }),
      };
    }

    const videoId = extractVideoId(videoInput);
    console.log(`Extracting transcript for video: ${videoId} (lang: ${lang})`);
    
    const videoDetails = await fetchVideoTranscriptHybrid(videoId, lang);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true, 
        data: {
          ...videoDetails,
          videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        }
      }),
    };
  } catch (error) {
    console.error('Caption extraction error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch video captions',
      }),
    };
  }
};

const extractVideoId = (input) => {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = input.match(youtubeRegex);

  if (match && match[1]) {
    return match[1];
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim();
  }

  throw new Error('Invalid YouTube URL or video ID');
};

// Custom transcript fetcher with cookie support
const fetchTranscriptWithCookies = async (videoID, lang, cookie) => {
  // First, get the video page to find caption tracks
  const videoUrl = `https://www.youtube.com/watch?v=${videoID}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  if (cookie) {
    headers['Cookie'] = cookie;
  }

  const response = await fetch(videoUrl, { headers });
  const html = await response.text();

  // Extract caption track URL from the page
  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) {
    throw new Error('No caption tracks found in video page');
  }

  const captionTracks = JSON.parse(captionMatch[1]);

  // Find the best matching caption track
  let track = captionTracks.find(t => t.languageCode === lang);
  if (!track) {
    track = captionTracks.find(t => t.languageCode === 'en');
  }
  if (!track) {
    track = captionTracks[0];
  }

  if (!track || !track.baseUrl) {
    throw new Error('No suitable caption track found');
  }

  // Fetch the actual captions
  const captionResponse = await fetch(track.baseUrl, { headers });
  const captionXml = await captionResponse.text();

  // Parse XML captions
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(captionXml);

  if (!parsed.transcript || !parsed.transcript.text) {
    throw new Error('Invalid caption format');
  }

  const texts = Array.isArray(parsed.transcript.text) ? parsed.transcript.text : [parsed.transcript.text];

  const subtitles = texts.map(t => ({
    start: t['@_start'] || '0',
    dur: t['@_dur'] || '1',
    text: (typeof t === 'string' ? t : t['#text'] || '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  }));

  // Extract title from page
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : `Video ${videoID}`;

  return { title, subtitles };
};

// Lightweight title fetcher - scrapes the actual YouTube video title from the page
const fetchYouTubeTitle = async (videoID) => {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoID}`, {
      headers: { 'User-Agent': getRandomUserAgent(), 'Accept-Language': 'en-US,en;q=0.9' }
    });
    const html = await response.text();
    // Try og:title meta tag first (most reliable)
    const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogMatch) return ogMatch[1];
    // Fallback to <title> tag
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) return titleMatch[1].replace(' - YouTube', '').trim();
  } catch (e) {
    console.log('⚠️ Could not fetch YouTube title:', e.message);
  }
  return null;
};

const fetchVideoTranscriptHybrid = async (videoID, lang = 'en') => {
  console.log(`Attempting transcript extraction for video ID: ${videoID} using multiple methods...`);

  // Get YouTube cookie from environment variable for authenticated requests
  const ytCookie = process.env.YT_COOKIE;
  if (ytCookie) {
    console.log('Using YT_COOKIE for authenticated requests');
  }

  // Method 0: VidNavigator API (PRIMARY — uses residential proxies, most reliable)
  const vidnavApiKey = process.env.VIDNAVIGATOR_API_KEY;
  if (vidnavApiKey) {
    try {
      console.log('Trying VidNavigator API (primary)...');
      const videoUrl = `https://www.youtube.com/watch?v=${videoID}`;

      const response = await fetch('https://api.vidnavigator.com/v1/transcript/youtube', {
        method: 'POST',
        headers: {
          'X-API-Key': vidnavApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_url: videoUrl,
          language: lang,
        })
      });

      const result = await response.json();

      if (result.status === 'success' && result.data?.transcript?.length > 0) {
        const subtitles = result.data.transcript.map(t => ({
          start: t.start?.toString() || '0',
          dur: ((t.end || 0) - (t.start || 0)).toString() || '1',
          text: t.text || ''
        }));

        console.log('✅ VidNavigator success:', {
          title: result.data.video_info?.title?.substring(0, 50),
          subtitlesCount: subtitles.length
        });

        return {
          title: result.data.video_info?.title || `Video ${videoID}`,
          description: result.data.video_info?.description || 'Extracted via VidNavigator',
          subtitles: subtitles
        };
      }
    } catch (error) {
      console.log('❌ VidNavigator failed:', error.message);
    }
  }

  // Method 1: Try Python youtube-transcript-api (free fallback — no cookies needed)
  try {
    console.log('Trying Python youtube-transcript-api...');
    const scriptPath = join(__dirname, '..', 'transcript_fetcher.py');
    const { stdout, stderr } = await execFileAsync('python3', [scriptPath, videoID], {
      timeout: 30000,
      cwd: join(__dirname, '..')
    });

    if (stderr) console.warn('Python stderr:', stderr);
    
    const result = JSON.parse(stdout);
    
    if (result.success && result.transcript && result.transcript.length > 0) {
      const subtitles = result.transcript.map(t => ({
        start: t.start?.toString() || '0',
        dur: t.duration?.toString() || '1',
        text: t.text || ''
      }));

      console.log('✅ Python youtube-transcript-api success:', {
        language: result.language_code,
        subtitlesCount: subtitles.length,
        isGenerated: result.is_generated
      });

      return {
        title: `Video ${videoID}`,
        description: `Extracted via youtube-transcript-api (${result.language || 'English'})`,
        subtitles: subtitles
      };
    }
  } catch (error) {
    console.log('❌ Python youtube-transcript-api failed:', error.message);
  }

  // Method 1: Try youtube-transcript-plus (best JS library with custom user-agent support)
  try {
    console.log('Trying youtube-transcript-plus library...');
    const userAgent = getRandomUserAgent();

    const transcript = await fetchTranscript(videoID, {
      lang: lang,
      userAgent: userAgent
    });

    if (transcript && transcript.length > 0) {
      const subtitles = transcript.map(entry => ({
        start: entry.offset ? (entry.offset / 1000).toString() : "0",
        dur: entry.duration ? (entry.duration / 1000).toString() : "1",
        text: entry.text || ""
      }));

      console.log('✅ youtube-transcript-plus success:', {
        subtitlesCount: subtitles.length,
        totalChars: subtitles.map(s => s.text).join(' ').length
      });

      return {
        title: `Video ${videoID}`,
        description: 'Extracted via youtube-transcript-plus',
        subtitles: subtitles
      };
    }
  } catch (error) {
    console.log('❌ youtube-transcript-plus failed:', error.message);
  }

  // Method 2: Try custom fetch with cookies (reliable when cookies are available)
  if (ytCookie) {
    try {
      console.log('Trying custom fetch with cookies...');
      const result = await fetchTranscriptWithCookies(videoID, lang, ytCookie);

      if (result.subtitles && result.subtitles.length > 0) {
        console.log('✅ Custom fetch with cookies success:', {
          title: result.title?.substring(0, 50),
          subtitlesCount: result.subtitles.length
        });

        return {
          title: result.title,
          description: 'Extracted with authenticated request',
          subtitles: result.subtitles
        };
      }
    } catch (error) {
      console.log('❌ Custom fetch with cookies failed:', error.message);
    }
  }

  // Method 3: Try youtube-transcript (fallback)
  try {
    console.log('Trying youtube-transcript library...');
    const config = {
      lang: lang,
      country: 'US'
    };

    const transcript = await YoutubeTranscript.fetchTranscript(videoID, config);

    if (transcript && transcript.length > 0) {
      const subtitles = transcript.map(entry => ({
        start: entry.offset ? (entry.offset / 1000).toString() : "0",
        dur: entry.duration ? (entry.duration / 1000).toString() : "1", 
        text: entry.text || ""
      }));

      console.log('✅ youtube-transcript success:', { 
        subtitlesCount: subtitles.length,
        totalChars: subtitles.map(s => s.text).join(' ').length
      });
      
      return {
        title: `Video ${videoID}`,
        description: 'Extracted via youtube-transcript',
        subtitles: subtitles
      };
    }
  } catch (error) {
    console.log('❌ youtube-transcript failed:', error.message);
  }

  // Method 4: Try youtube-caption-extractor (fallback for manual captions)
  try {
    console.log('Trying youtube-caption-extractor as fallback...');
    const details = await getVideoDetails({ videoID, lang });

    if (details && details.subtitles && details.subtitles.length > 0) {
      console.log('✅ youtube-caption-extractor success:', {
        title: details.title?.substring(0, 50) + '...',
        subtitlesCount: details.subtitles?.length
      });

      return {
        title: details.title || `Video ${videoID}`,
        description: details.description || 'Extracted via youtube-caption-extractor',
        subtitles: details.subtitles || []
      };
    }
  } catch (error) {
    console.log('❌ youtube-caption-extractor failed:', error.message);
  }

  // If all methods fail, at least get the real video title
  console.log('⚠️ No transcripts available from any source — fetching video title...');
  const realTitle = await fetchYouTubeTitle(videoID);
  console.log(realTitle ? `📝 Got real title: "${realTitle}"` : '⚠️ Could not fetch title either');
  return {
    title: realTitle || `Video ${videoID}`,
    description: 'No transcript available - transcripts may be disabled for this video',
    subtitles: []
  };
};

export {
  captionsHandler
};
