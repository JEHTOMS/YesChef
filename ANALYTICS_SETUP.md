# 📊 Google Analytics 4 Setup Guide for YesChef

## Quick Setup Steps

### 1. Create Google Analytics Account

1. **Visit**: [analytics.google.com](https://analytics.google.com)
2. **Create Account**:
   - Account name: "YesChef" 
   - Country: Your country
   - Data sharing: Enable recommended settings

3. **Create Property**:
   - Property name: "YesChef - Recipe App"
   - Reporting time zone: Your timezone
   - Currency: Your currency

4. **Set up Data Stream**:
   - Platform: Web
   - Website URL: `https://www.yescheff.co`
   - Stream name: "YesChef Website"

### 2. Get Your Measurement ID

After creating the data stream, you'll see:
- **Measurement ID**: `G-XXXXXXXXXX` (copy this!)
- Stream URL: https://www.yescheff.co
- Enhanced measurement: ON (recommended)

### 3. Configure Your App

1. **Edit `.env.local`** file:
   ```bash
   # Replace G-XXXXXXXXXX with your actual measurement ID
   REACT_APP_GA_MEASUREMENT_ID=G-1234567890
   ```

2. **Test locally**:
   ```bash
   cd food-ai
   npm start
   ```

3. **Deploy to production**:
   ```bash
   git add .
   git commit -m "Add Google Analytics configuration"
   git push origin main
   ```

### 4. Verify Installation

1. **Real-time reports**: Go to GA4 > Reports > Real-time
2. **Visit your site**: Open https://www.yescheff.co
3. **Check activity**: You should see your visit in real-time

## 🎯 Recommended Events to Track

### Default Automatic Events
✅ Already configured:
- Page views
- Scrolls
- Outbound clicks
- Site search
- File downloads

### Custom Events (Implemented)
Your app will automatically track:

#### Recipe Interactions
- `recipe_extraction` - When users extract recipes
- `timer_start` - When cooking timers are started
- `timer_complete` - When timers finish
- `recipe_save` - When recipes are saved
- `step_navigation` - Moving between recipe steps

#### User Engagement
- `feature_usage` - Feature interaction tracking
- `error_tracking` - Technical issues
- `conversion` - Goal completions

### Usage Examples in Your Code

```javascript
import { trackRecipeExtraction, trackTimerUsage } from './utils/analytics';

// Track successful recipe extraction
trackRecipeExtraction('youtube', true);

// Track timer usage
trackTimerUsage('timer_start', 300); // 5 minutes

// Track feature engagement
trackFeatureUsage('recipe_share');
```

## 📈 Key Metrics to Monitor

### 1. User Acquisition
- **Traffic sources**: Where users find YesChef
- **Geographic data**: Which countries use your app
- **Device types**: Mobile vs desktop usage

### 2. User Behavior
- **Popular recipes**: Most extracted content
- **User journey**: How users navigate your app
- **Drop-off points**: Where users leave

### 3. Recipe Performance
- **Extraction success rate**: % of successful extractions
- **Source popularity**: YouTube vs URL vs manual
- **Timer usage**: How often cooking timers are used

### 4. Technical Performance
- **Page load times**: Site speed metrics
- **Error rates**: Failed recipe extractions
- **Browser compatibility**: Technical issues

## 🔧 Advanced Configuration

### Enhanced E-commerce (Optional)
Track recipe "purchases" (saves/completions):

```javascript
// Track recipe completion as conversion
gtag('event', 'purchase', {
  transaction_id: 'recipe_' + Date.now(),
  value: 1,
  currency: 'USD',
  items: [{
    item_id: 'recipe_completion',
    item_name: 'Recipe Completed',
    category: 'Cooking',
    quantity: 1,
    price: 1
  }]
});
```

### Custom Dimensions
Set up in GA4 Admin > Custom Definitions:

1. **Recipe Source** (Event-scoped)
   - Parameter: `recipe_source`
   - Values: youtube, url, manual

2. **User Type** (User-scoped)
   - Parameter: `user_type`
   - Values: new, returning, power_user

3. **Recipe Complexity** (Event-scoped)
   - Parameter: `recipe_complexity`
   - Values: beginner, intermediate, advanced

## 🛡️ Privacy & Compliance

### Cookie Consent (Recommended)
Consider adding a cookie banner:

```html
<!-- Simple cookie notice -->
<div id="cookie-notice" style="position: fixed; bottom: 0; width: 100%; background: #333; color: white; padding: 10px; text-align: center;">
  This site uses cookies to improve your experience. 
  <button onclick="acceptCookies()">Accept</button>
</div>
```

### Data Retention
- Default: 14 months
- Recommended: 26 months for recipe apps
- Configure in: GA4 Admin > Data Settings > Data Retention

## 🌐 Cloudflare Analytics (Backup)

### Why Use Cloudflare Too?
- **Privacy-first**: No cookies needed
- **Server-side**: More accurate than client-side only
- **Basic metrics**: Good for performance monitoring
- **Free tier**: No cost for basic usage

### Setup Steps:
1. **Add domain to Cloudflare** (if not already)
2. **Enable Web Analytics**:
   - Dashboard > Analytics & Logs > Web Analytics
   - Add site: www.yescheff.co
   - Get beacon token

3. **Add to your site**:
   ```html
   <!-- Add before closing </body> tag -->
   <script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
           data-cf-beacon='{"token": "your-token-here"}'></script>
   ```

## 📊 Dashboard Setup

### Essential Reports to Create:

1. **Recipe Performance Dashboard**
   - Recipe extraction success rate
   - Most popular recipe sources
   - Average time per recipe

2. **User Journey Analysis**
   - Entry points → recipe extraction → completion
   - Drop-off analysis
   - Feature usage patterns

3. **Technical Performance**
   - Page load times
   - Error rates by page
   - Browser/device breakdown

## 🎯 Goal Configuration

### Primary Goals:
1. **Recipe Extraction Success** (Conversion)
2. **Timer Usage** (Engagement)
3. **Return Visits** (Retention)
4. **Recipe Completion** (Success)

### Setup in GA4:
Admin > Conversions > Create Conversion Event
- Event name: `recipe_extraction`
- Mark as conversion: ✅

## 🔍 Troubleshooting

### Common Issues:

1. **Not seeing data**:
   - Check measurement ID is correct
   - Verify environment variable is set
   - Check browser dev tools for GA requests

2. **Events not tracking**:
   - Verify gtag function exists
   - Check event names match GA4 requirements
   - Test in GA4 DebugView

3. **Real-time not working**:
   - Clear browser cache
   - Disable ad blockers
   - Check console for errors

### Debug Mode:
Add `?debug_mode=true` to URLs to see detailed GA4 logs

### Test Environment:
Use a separate GA4 property for development:
```bash
# In .env.local for development
REACT_APP_GA_MEASUREMENT_ID=G-DEV1234567
```

## 📞 Next Steps

1. ✅ Set up GA4 account and get measurement ID
2. ✅ Update `.env.local` with your measurement ID
3. ✅ Test locally to verify tracking works
4. ✅ Deploy to production
5. ⏳ Wait 24-48 hours for initial data
6. 📊 Create custom dashboards and reports
7. 🔔 Set up alerts for important metrics

---

**Need help?** Check the [GA4 documentation](https://support.google.com/analytics/answer/9304153) or feel free to ask!