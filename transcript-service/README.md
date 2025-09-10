# Transcript Service (FastAPI)

A tiny local microservice that uses `youtube-transcript-api` to fetch YouTube captions without API keys.

## Setup

```bash
# macOS (zsh)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 5055 --reload
```

## Endpoints
- GET `/health` -> `{ ok: true }`
- GET `/transcript/{video_id}?languages=en&languages=en-US&languages=en-GB`

Returns:
```
{
  "success": true,
  "videoId": "...",
  "transcript": [ { text, start, duration }, ... ]
}
```

## Notes
- No API keys required.
- Falls back across preferred languages automatically.
- Run this alongside the Node server. Node will call it first before scraping.
