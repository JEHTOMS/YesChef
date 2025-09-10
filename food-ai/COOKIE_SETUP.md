# YouTube Cookie Setup

Since Chrome encrypts cookie values, here are the easiest ways to get your YouTube cookies:

## Method 1: Browser DevTools (Recommended)

1. **Open YouTube in Chrome/Safari** (make sure you're logged in)
2. **Open DevTools**: 
   - Chrome: `Cmd+Option+I` or View → Developer → Developer Tools
   - Safari: Enable Developer menu first in Preferences → Advanced
3. **Go to Network tab**
4. **Refresh the page** (Cmd+R)
5. **Click on any request** to `youtube.com` or `youtubei.googleapis.com`
6. **Find "Request Headers" section**
7. **Look for "cookie:" line** - right-click and "Copy value"
8. **Add to your .env.local**:
   ```
   YT_COOKIE="paste the entire cookie string here"
   ```

## Method 2: Cookie Export Extension

1. Install "Get cookies.txt LOCALLY" Chrome extension
2. Go to YouTube.com
3. Click the extension icon → Export cookies for this site
4. Save the file (e.g., `~/Downloads/yt-cookies.txt`)
5. **Add to your .env.local**:
   ```
   YT_COOKIES_FILE="/Users/jehtoms/Downloads/yt-cookies.txt"
   ```

## Method 3: Use Without Cookies (Limited)

The app will work without cookies but may hit rate limits more frequently.

---

**After adding cookies, restart your dev servers:**
```bash
cd /Users/jehtoms/Downloads/mern-app/food-ai
npm run dev
```

**Security Note**: Keep cookies private - don't commit .env.local to git!
