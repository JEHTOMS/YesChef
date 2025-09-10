// Hybrid caption extraction handler using multiple methods for maximum compatibility
import { YoutubeTranscript } from 'youtube-transcript';
import { getVideoDetails } from 'youtube-caption-extractor';

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
          videoId
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

const fetchVideoTranscriptHybrid = async (videoID, lang = 'en') => {
  console.log(`Attempting transcript extraction for video ID: ${videoID} using multiple methods...`);
  
  // Method 1: Try youtube-transcript (most reliable for auto-generated captions)
  try {
    console.log('Trying youtube-transcript library...');
    const transcript = await YoutubeTranscript.fetchTranscript(videoID, {
      lang: lang,
      country: 'US'
    });

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

  // Method 2: Try youtube-caption-extractor (fallback for manual captions)
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

  // If all methods fail, return empty but successful response
  console.log('⚠️ No transcripts available from any source');
  return {
    title: `Video ${videoID}`,
    description: 'No transcript available - transcripts may be disabled for this video',
    subtitles: []
  };
};

export {
  captionsHandler
};
