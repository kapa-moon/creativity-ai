# Vercel Deployment Guide

This guide will help you deploy your Next.js app to Vercel with optimal configuration.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/creativity-ai)

## Manual Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket):

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/creativity-ai.git
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Automatic Deployment via Dashboard

1. Go to [vercel.com](https://vercel.com/)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it's a Next.js project
5. Configure environment variables (if needed)
6. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - follow prompts)
vercel

# Deploy to production
vercel --prod
```

### 3. Environment Variables

In the Vercel dashboard:

1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add variables based on `ENV_VARIABLES.md`
4. Set appropriate environment (Development/Production)

### 4. Custom Domain (Optional)

1. In project settings, go to "Domains"
2. Add your custom domain
3. Configure DNS records as instructed

## 📋 Pre-deployment Checklist

- [ ] Code builds successfully (`npm run build`)
- [ ] All environment variables documented
- [ ] Security headers configured (✅ included in `vercel.json`)
- [ ] Performance optimizations enabled (✅ included in `next.config.ts`)
- [ ] Error pages customized (optional)
- [ ] Analytics configured (optional)

## 🔧 Vercel Configuration

This project includes optimized `vercel.json` configuration:

- **Framework Detection**: Automatic Next.js detection
- **Build Settings**: Optimized build commands
- **Function Settings**: 30-second timeout for serverless functions
- **Security Headers**: X-Frame-Options, CSP, and more
- **Regional Deployment**: Optimized for global CDN

## 🏗️ Build Settings

Vercel automatically detects these settings, but you can override them:

- **Build Command**: `npm run build`
- **Output Directory**: `.next` (automatic)
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## 🌍 Environment-Specific Deployments

### Preview Deployments
- Automatically created for every push to non-main branches
- Perfect for testing features before merging

### Production Deployments
- Triggered by pushes to the main branch
- Uses production environment variables

## 📊 Monitoring & Analytics

### Built-in Analytics
- Enable Vercel Analytics in project settings
- Get insights into Core Web Vitals and performance

### Custom Analytics
- Configure Google Analytics or other providers
- Add tracking IDs to environment variables

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Test locally first
   npm run build
   ```

2. **Environment Variables Missing**
   - Check Vercel dashboard settings
   - Ensure correct environment (Development/Production)

3. **Function Timeout**
   - Check `vercel.json` function configuration
   - Optimize slow API routes

4. **Domain Issues**
   - Verify DNS configuration
   - Check domain ownership

### Debugging

1. Check Vercel Function logs in dashboard
2. Use `vercel logs` command for real-time logs
3. Enable debug mode: `DEBUG=1 vercel`

## 🔄 Continuous Deployment

Your app is now configured for continuous deployment:

1. **Push to main branch** → Production deployment
2. **Push to feature branch** → Preview deployment
3. **Pull request** → Automatic preview deployment

## 📈 Performance Optimization

This project includes:

- ✅ Image optimization with `next/image`
- ✅ Bundle optimization and compression
- ✅ Static generation where possible
- ✅ Optimized loading strategies
- ✅ Security headers
- ✅ CDN distribution via Vercel Edge Network

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables) 