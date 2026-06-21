# Pokleh Enterprise — Deployment Guide

## Environment Variables

Set these in your deployment platform:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## Vercel

1. Push repository to GitHub
2. Import project in Vercel
3. Vercel auto-detects Vite configuration
4. Add environment variables in Vercel dashboard
5. Deploy

## Netlify

```bash
npm run build
# Deploy dist/ folder to Netlify
```

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`

## Build

```bash
npm run build
# Output in dist/
```

The build produces a standard React SPA that can be hosted on any static hosting service.

## Production Checklist

- [ ] `.env` not committed (use `.env.example`)
- [ ] Environment variables configured in deployment platform
- [ ] Supabase RLS policies active on all tables
- [ ] All 4 migrations applied
- [ ] CORS configured in Supabase dashboard (add production domain)
- [ ] Email confirmation enabled for new user signups
- [ ] Service worker caching verified for offline support
