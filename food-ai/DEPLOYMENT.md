# YesChef Production Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd food-ai
vercel --prod

# Add environment variables in Vercel dashboard:
# - REACT_APP_GA_MEASUREMENT_ID (your GA4 ID)
# - OPENAI_API_KEY
# - GOOGLE_API_KEY
# - GOOGLE_SEARCH_ENGINE_ID
# - GOOGLE_PLACES_API_KEY
# - YT_COOKIE
```

### Option 2: Netlify + Railway
```bash
# Frontend: Netlify
npm run build
# Upload ./build folder to Netlify

# Backend: Railway
# Use the existing GitHub Actions workflow
```

## 📊 Analytics Setup

### Google Analytics 4
1. Create GA4 property at analytics.google.com
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to environment variables:
   ```
   REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Cloudflare Analytics
1. Point domain through Cloudflare
2. Enable Web Analytics in dashboard
3. Automatic tracking (no code needed)

## 🌐 Custom Domain Setup

### With Vercel:
1. Add domain in Vercel dashboard
2. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com

   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### With Cloudflare:
1. Add site to Cloudflare
2. Update nameservers at domain registrar
3. Enable orange cloud proxy
4. Configure SSL (automatic)

## 🔧 Environment Variables for Production

```env
# Analytics
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API Keys
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
GOOGLE_PLACES_API_KEY=...
YT_COOKIE=...

# Production Settings
NODE_ENV=production
REACT_APP_API_URL=https://your-backend-domain.com
```

## 🎯 Recommended Stack

**Best for YesChef:**
- **Frontend:** Vercel
- **Backend:** Railway or Vercel Edge Functions
- **Domain:** Cloudflare (registrar + CDN)
- **Analytics:** Google Analytics 4 + Cloudflare Web Analytics
- **Monitoring:** Vercel Analytics + LogRocket

## 📈 Analytics Events to Track

```javascript
// Custom events for YesChef
gtag('event', 'recipe_search', {
  'search_term': query,
  'input_type': 'youtube_url' | 'recipe_url' | 'text'
});

gtag('event', 'recipe_generated', {
  'recipe_name': recipeName,
  'video_duration': duration,
  'steps_count': stepsLength
});

gtag('event', 'timer_started', {
  'step_number': stepIndex,
  'timer_duration': seconds
});
```

## 🚦 Next Steps

1. **Immediate:** Deploy to Vercel for testing
2. **Short-term:** Add custom domain + Cloudflare
3. **Long-term:** Implement custom analytics events
4. **Optional:** Add error tracking (Sentry)

## 💰 Cost Estimate

- **Domain:** $10-15/year
- **Cloudflare:** Free tier sufficient
- **Vercel:** Free tier (Pro $20/month for team features)
- **Railway:** Free tier → $5/month for production
- **Total:** $0-25/month depending on usage