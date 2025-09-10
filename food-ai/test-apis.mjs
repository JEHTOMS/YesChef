// Quick API test script
import fetch from 'node-fetch';

const YOUTUBE_API_KEY = 'AIzaSyB2SsDlzBDTJqqAsjgCVUd-yG4bLg6UOio';
const GOOGLE_API_KEY = 'AIzaSyB2SsDlzBDTJqqAsjgCVUd-yG4bLg6UOio';
const SEARCH_ENGINE_ID = 'c1907527cde4b4c5b';

console.log('Testing YouTube API...');
const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=pasta%20recipe&maxResults=1&type=video&key=${YOUTUBE_API_KEY}`;

try {
  const response = await fetch(youtubeUrl);
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ YouTube API works!');
    console.log('First video:', data.items?.[0]?.snippet?.title);
  } else {
    console.log('❌ YouTube API error:', response.status);
    console.log('Error details:', data);
  }
} catch (error) {
  console.log('❌ YouTube API fetch error:', error.message);
}

console.log('\nTesting Google Custom Search API...');
const customSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=pasta%20food&searchType=image&num=1`;

try {
  const response = await fetch(customSearchUrl);
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Custom Search API works!');
    console.log('First image:', data.items?.[0]?.link);
  } else {
    console.log('❌ Custom Search API error:', response.status);
    console.log('Error details:', data);
  }
} catch (error) {
  console.log('❌ Custom Search API fetch error:', error.message);
}
