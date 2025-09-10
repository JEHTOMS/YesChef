#!/usr/bin/env python3
"""
Simple YouTube transcript fetcher using youtube-transcript-api
Much more reliable than our custom Node.js implementation
"""

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import JSONFormatter
import sys
import json

def get_transcript(video_id, languages=['en', 'en-US', 'en-GB']):
    """
    Get transcript for a YouTube video using the proper API
    """
    try:
        # Initialize the API
        ytt_api = YouTubeTranscriptApi()
        
        # Fetch transcript with preferred languages
        transcript = ytt_api.fetch(video_id, languages=languages)
        
        # Convert to the format our Node.js server expects
        result = []
        for snippet in transcript:
            result.append({
                'text': snippet.text,
                'start': snippet.start,
                'duration': snippet.duration
            })
        
        return {
            'success': True,
            'video_id': video_id,
            'language': transcript.language,
            'language_code': transcript.language_code,
            'is_generated': transcript.is_generated,
            'transcript': result
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'video_id': video_id
        }

def list_available_transcripts(video_id):
    """
    List all available transcripts for a video
    """
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)
        
        transcripts = []
        for transcript in transcript_list:
            transcripts.append({
                'language': transcript.language,
                'language_code': transcript.language_code,
                'is_generated': transcript.is_generated,
                'is_translatable': transcript.is_translatable
            })
        
        return {
            'success': True,
            'video_id': video_id,
            'available_transcripts': transcripts
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'video_id': video_id
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Video ID required'}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else 'transcript'
    
    if command == 'list':
        result = list_available_transcripts(video_id)
    else:
        result = get_transcript(video_id)
    
    print(json.dumps(result))
