# Admin Spam Detection Testing Guide

## How to Test Admin Bypass

### Regular User Testing (4-Post Limit)
1. Open the app normally
2. Create 4 posts quickly across any pages (Home, Daily Spill, Community, etc.)
3. On the 5th post attempt, you should see: "You've shared 4 posts recently! Take a 5-minute break to let others join the conversation."
4. Wait 5 minutes and you can post again

### Admin Testing (No Limits)
To test admin bypass in development:

1. **Option 1: Dev Admin Session**
   - Open browser developer tools
   - Go to Application > Storage > Session Storage
   - Add key: `dev_admin` with any value
   - This session will bypass all spam detection

2. **Option 2: Admin Session Prefix**
   - Any session that starts with `admin_` bypasses spam detection
   - This is automatically handled by the system

3. **Option 3: Environment Variables (Production)**
   - Set ADMIN_SESSION_1, ADMIN_SESSION_2, ADMIN_SESSION_3 environment variables
   - Sessions matching these exact values bypass spam detection

### Expected Behavior
- **Regular users**: 4 posts max, then 5-minute cooldown
- **Admin users**: Unlimited posts, no cooldowns, no restrictions
- **Cooldown message**: Friendly, Tfess-branded tone
- **Cross-page tracking**: Limit applies across all pages (Home, Daily Spill, Community, Feedback)

### Test Results Log
- [ ] Regular user hits 4-post limit ✓
- [ ] Friendly cooldown message appears ✓  
- [ ] Admin user posts unlimited times ✓
- [ ] No admin cooldowns ✓
- [ ] Cross-page limit tracking ✓