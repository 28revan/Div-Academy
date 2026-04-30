# Deployment Guide for Div Academy TİS

This application is ready to be deployed to any modern web hosting platform (Railway, Google Cloud Run, Heroku, etc.).

## 1. Local Build & Test
```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Start the server (Production mode)
npm start
```

## 2. Environment Variables
You must set the following environment variables in your hosting provider's dashboard:
- `NODE_ENV`: `production`
- `PORT`: Usually handled by the platform, but defaults to `3000`.
- `JWT_SECRET`: A long, random string for security.
- `GEMINI_API_KEY`: Your Google Gemini API Key.

## 3. Database Persistence
Currently, the app uses a `db.json` file for storage. 
- **VPS / Docker with Volume**: If you deploy to a server with a persistent disk, it will work as-is.
- **Serverless (Vercel/Netlify)**: The `db.json` will reset on every deploy. 
- **Recommendation**: For a production-grade app, switch the `server/dataService.js` logic to use a remote database like **Firebase Firestore** or **MongoDB Atlas**.

## 4. Custom Domain
After deploying to a service like Cloud Run or Vercel, you can point your domain (e.g., `tis.div.edu.az`) to the provided app URL using CNAME or A records in your DNS provider.

---
*Built with Google AI Studio*
