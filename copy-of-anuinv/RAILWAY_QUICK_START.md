# Quick Start: Deploy to Railway

## Fastest Method (GitHub + Railway)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Ready for Railway"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app → New Project → Deploy from GitHub
   - Select your repository
   - Railway auto-detects the project

3. **Add API Key**
   - In Railway dashboard → Variables tab
   - Add: `GEMINI_API_KEY` = `your_api_key_here`

4. **Done!** Railway will build and deploy automatically.

## What Was Configured

✅ `package.json` - Added `start` script for Railway
✅ `start.js` - Handles PORT environment variable
✅ `vite.config.ts` - Updated for production environment variables
✅ `railway.json` - Railway configuration file

## Build Process

- **Build**: `npm run build` (creates `dist/` folder)
- **Start**: `npm start` (serves built files on Railway's PORT)

## Important Notes

- Railway automatically sets the `PORT` environment variable
- Your app will be available at a Railway-provided URL
- AI features require `GEMINI_API_KEY` to be set
- Check Railway logs if deployment fails

For detailed instructions, see `DEPLOYMENT.md`

