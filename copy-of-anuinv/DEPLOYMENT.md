# Railway Deployment Guide

This guide will help you deploy AnuInv to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. A GitHub account (if deploying from Git)
3. Your Gemini API key (for AI features)

## Deployment Steps

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect Railway to GitHub**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect it's a Node.js/Vite project

3. **Configure Environment Variables**
   - In your Railway project dashboard, go to "Variables"
   - Add the following variable:
     - `GEMINI_API_KEY`: Your Google Gemini API key
   - Railway will automatically rebuild when you add variables

4. **Deploy**
   - Railway will automatically build and deploy your app
   - The build command is: `npm run build`
   - The start command is: `npm start`
   - Railway will provide a public URL for your app

### Option 2: Deploy using Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway in your project**
   ```bash
   railway init
   ```

4. **Set environment variables**
   ```bash
   railway variables set GEMINI_API_KEY=your_api_key_here
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Option 3: Deploy from Railway Dashboard

1. **Create a new project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Empty Project"

2. **Connect your repository**
   - Click "Add Service"
   - Select "GitHub Repo"
   - Choose your repository
   - Railway will auto-detect the project type

3. **Configure build settings**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Root Directory: `/` (default)

4. **Add environment variables**
   - Go to "Variables" tab
   - Add `GEMINI_API_KEY` with your API key value

5. **Deploy**
   - Railway will automatically deploy
   - Check the "Deployments" tab for status

## Environment Variables

Required environment variable:
- `GEMINI_API_KEY`: Your Google Gemini API key (get it from https://ai.google.dev/)

Optional (Railway sets these automatically):
- `PORT`: Railway will set this automatically
- `NODE_ENV`: Set to "production" automatically

## Build Configuration

The project uses:
- **Build Command**: `npm run build` - Creates optimized production build in `dist/` folder
- **Start Command**: `npm start` - Serves the built files using Vite preview server
- **Node Version**: Railway will auto-detect (recommended: Node.js 18+)

## Post-Deployment

1. **Verify deployment**
   - Visit the Railway-provided URL
   - Check that the app loads correctly
   - Test AI features (if API key is set)

2. **Custom Domain (Optional)**
   - Go to your Railway project settings
   - Click "Generate Domain" or add a custom domain
   - Update DNS settings if using custom domain

3. **Monitor**
   - Check Railway dashboard for logs
   - Monitor resource usage
   - Set up alerts if needed

## Troubleshooting

### Build fails
- Check Railway logs for error messages
- Ensure `package.json` has correct scripts
- Verify Node.js version compatibility

### App doesn't start
- Check that `npm start` command works locally
- Verify PORT environment variable is set (Railway sets this automatically)
- Check Railway logs for errors

### AI features not working
- Verify `GEMINI_API_KEY` is set in Railway variables
- Check browser console for API errors
- Ensure API key is valid and has credits

### 404 errors on refresh
- This is normal for SPAs - Railway should handle this automatically
- If issues persist, you may need to configure a `_redirects` file or use Railway's static file serving

## Railway Configuration Files

- `railway.json`: Railway-specific configuration (optional)
- `package.json`: Contains build and start scripts
- `vite.config.ts`: Vite configuration for production builds

## Cost Considerations

Railway offers:
- Free tier: $5 credit per month
- Pay-as-you-go pricing
- Check Railway pricing page for current rates

## Additional Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Vite Deployment Guide: https://vitejs.dev/guide/static-deploy.html

