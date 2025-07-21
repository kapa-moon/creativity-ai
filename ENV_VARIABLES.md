# Environment Variables

This file documents the environment variables used in this project.

## Development Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Copy and paste these into your .env.local file

# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com

# Database (if using)
DATABASE_URL=your_database_url_here

# Authentication (if using NextAuth.js)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Third-party services
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Analytics (if using)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

## Production Deployment (Vercel)

Add these environment variables in your Vercel dashboard:

1. Go to your project in Vercel
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate values for production

## Environment Variable Types

- **NEXT_PUBLIC_*** - Available on both client and server
- **Regular variables** - Only available on the server side

## Security Notes

- Never commit `.env.local` to version control
- Use different values for development and production
- Keep sensitive keys secure and rotate them regularly 