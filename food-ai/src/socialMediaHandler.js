// Social media video transcription handler using VidNavigator API
// Supports Instagram, TikTok, Facebook, Twitter/X and other social platforms

import { VidNavigatorClient, VidNavigatorError } from 'vidnavigator';

const socialMediaHandler = async (body) => {
  try {
    const { videoInput, lang = 'en' } = body;

    if (!videoInput) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Video URL is required'
        }),
      };
    }

    // Validate API key
    if (!process.env.VIDNAVIGATOR_API_KEY) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'VidNavigator API key not configured'
        }),
      };
    }

    const platform = detectSocialPlatform(videoInput);
    console.log(`Extracting transcript from ${platform} video: ${videoInput}`);
    
    const transcriptData = await fetchSocialMediaTranscript(videoInput, lang);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true, 
        data: {
          ...transcriptData,
          platform,
          originalUrl: videoInput
        }
      }),
    };
  } catch (error) {
    console.error('Social media transcript extraction error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = error.message || 'Failed to fetch video transcript';
    
    if (error instanceof VidNavigatorError) {
      errorMessage = `VidNavigator API error: ${error.message}`;
    } else if (error.message.includes('private') || error.message.includes('unavailable')) {
      errorMessage = 'This video is private or unavailable. Please use a public video URL.';
    } else if (error.message.includes('invalid') || error.message.includes('not found')) {
      errorMessage = 'Invalid video URL. Please check the link and try again.';
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      errorMessage = 'Too many requests. Please try again in a few moments.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    return {
      statusCode: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        platform: detectSocialPlatform(body.videoInput)
      }),
    };
  }
};

// Detect which social media platform the URL is from
const detectSocialPlatform = (url) => {
  if (!url || typeof url !== 'string') return 'Unknown';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
    return 'Instagram';
  } else if (urlLower.includes('tiktok.com')) {
    return 'TikTok';
  } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch') || urlLower.includes('fb.com')) {
    return 'Facebook';
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'Twitter';
  } else if (urlLower.includes('snapchat.com')) {
    return 'Snapchat';
  } else if (urlLower.includes('pinterest.com')) {
    return 'Pinterest';
  } else if (urlLower.includes('vimeo.com')) {
    return 'Vimeo';
  } else if (urlLower.includes('dailymotion.com')) {
    return 'Dailymotion';
  }
  
  return 'Social Media';
};

// Check if URL is from a supported social media platform
const isSocialMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const urlLower = url.toLowerCase();
  const socialPlatforms = [
    'instagram.com',
    'instagr.am',
    'tiktok.com',
    'facebook.com',
    'fb.watch',
    'fb.com',
    'twitter.com',
    'x.com',
    'snapchat.com',
    'pinterest.com',
    'vimeo.com',
    'dailymotion.com'
  ];
  
  return socialPlatforms.some(platform => urlLower.includes(platform));
};

// Fetch transcript from VidNavigator API using the official SDK
const fetchSocialMediaTranscript = async (videoUrl, lang = 'en') => {
  try {
    console.log(`Calling VidNavigator SDK for video: ${videoUrl}`);
    console.log('VidNavigator API Key present:', !!process.env.VIDNAVIGATOR_API_KEY);
    
    // Initialize VidNavigator client
    const client = new VidNavigatorClient({
      apiKey: process.env.VIDNAVIGATOR_API_KEY,
    });

    // Call the SDK to transcribe the video
    const { video_info, transcript } = await client.transcribeVideo({
      video_url: videoUrl,
      language: lang
    });

    console.log(`✅ VidNavigator success: ${transcript.length} transcript segments`);
    console.log('Video Title:', video_info.title);
    
    // Transform to our internal subtitle format
    const subtitles = transcript.map(segment => ({
      start: segment.start.toString(),
      dur: (segment.end - segment.start).toString(),
      text: segment.text
    }));
    
    return {
      title: video_info.title || `Social Media Recipe Video`,
      description: video_info.description || 'Extracted via VidNavigator',
      subtitles: subtitles,
      duration: video_info.duration || null,
      thumbnail: video_info.thumbnail || null
    };
    
  } catch (error) {
    if (error instanceof VidNavigatorError) {
      console.error('VidNavigator SDK error:', error.message);
    } else {
      console.error('VidNavigator API call failed:', error);
    }
    throw error;
  }
};

export {
  socialMediaHandler,
  isSocialMediaUrl,
  detectSocialPlatform
};
