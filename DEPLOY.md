# Deployment Guide

There are two ways to deploy your changes to Vercel.

## 1. Automatic Deployment (Recommended)
Since you have a GitHub repository (`origin`), the best way is to connect it to Vercel.
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the `interview-os` project.
3. Go to **Settings** > **Git**.
4. Connect your GitHub repository (`vvknyn/interview-os`).

**Once connected:**
- simply run `git push origin main`
- Vercel will automatically build and deploy your new changes.

## 2. Manual Deployment (CLI)
You can manually deploy from your terminal at any time.

**To deploy to Production (Live):**
```bash
npx vercel --prod
```

**To deploy a Preview (Test URL):**
```bash
npx vercel
```

## Troubleshooting
If a build fails:
- Check the logs in your terminal or on the Vercel dashboard.
- Ensure all environment variables are set in Vercel Project Settings if you added new ones.
