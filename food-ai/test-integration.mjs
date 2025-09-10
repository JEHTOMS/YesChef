#!/usr/bin/env node
// Quick test of youtube-caption-extractor integration

import { getVideoDetails } from 'youtube-caption-extractor';

console.log('Testing youtube-caption-extractor library...');

async function testLibrary() {
  try {
    const videoId = 'dQw4w9WgXcQ'; // Rick Roll video - should have captions
    console.log(`Testing with video ID: ${videoId}`);
    
    const details = await getVideoDetails({ videoID: videoId, lang: 'en' });
    console.log('✅ Library works!');
    console.log('Title:', details.title);
    console.log('Subtitle count:', details?.subtitles?.length || 0);
    
    if (details.subtitles && details.subtitles.length > 0) {
      console.log('Sample subtitle:', details.subtitles[0]);
    }
    
  } catch (error) {
    console.error('❌ Library failed:', error.message);
  }
}

testLibrary();
