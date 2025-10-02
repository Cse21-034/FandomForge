# Deployment Guide

This application is designed to be deployed with the frontend on Vercel and the backend on Render.

## Backend Deployment (Render)

1. **Prerequisites**
   - Create a [Render](https://render.com) account
   - Have your GitHub repository ready

2. **Deploy to Render**
   - Connect your GitHub repository to Render
   - Render will automatically detect the `render.yaml` file
   - This will create:
     - A web service for the backend API
     - A PostgreSQL database

3. **Environment Variables**
   Set the following environment variables in Render:
   - `DATABASE_URL` - Automatically set by Render's PostgreSQL service
   - `SESSION_SECRET` - Auto-generated or set manually
   - `PAYPAL_CLIENT_ID` - Your PayPal client ID
   - `PAYPAL_CLIENT_SECRET` - Your PayPal client secret
   - `NODE_ENV` - Set to `production`

4. **Database Setup**
   After deployment, run migrations:
   ```bash
   npm run db:push
   ```

## Frontend Deployment (Vercel)

1. **Prerequisites**
   - Create a [Vercel](https://vercel.com) account
   - Have your GitHub repository ready

2. **Deploy to Vercel**
   - Import your project on Vercel
   - Vercel will automatically detect the `vercel.json` configuration
   - The frontend will be built from the `client/` directory

3. **Environment Variables**
   Set the following environment variable in Vercel:
   - `VITE_API_URL` - Your Render backend URL (e.g., `https://creatorhub-backend.onrender.com`)

4. **Update API URL**
   After deploying the backend, update the `vercel.json` file to point to your actual Render backend URL in the rewrites section.

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

## Production Build

To test production builds locally:

**Backend:**
```bash
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

## Notes

- Make sure to update CORS settings in the backend to allow requests from your Vercel frontend domain
- Update the Render backend URL in `vercel.json` after deployment
- PayPal integration will require setting up a PayPal developer account and obtaining API credentials
- The database will be automatically provisioned by Render
