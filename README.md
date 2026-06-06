# DealSniper

A production-quality MERN stack fashion deal intelligence platform that automatically detects significant price drops on e-commerce platforms and alerts users via Telegram before deal channels discover them.

## Folder Structure

```
DealSniper/
├── client/                 # Frontend React Application (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers (Auth, Theme)
│   │   ├── hooks/          # Custom React hooks (React Query)
│   │   ├── layouts/        # Page layouts (Sidebar, Navbar)
│   │   ├── pages/          # Main application views (Dashboard, Explorer)
│   │   ├── services/       # API integration layers (Axios)
│   │   ├── utils/          # Helpers and formatters
│   │   ├── App.tsx         # Main Routing
│   │   └── index.css       # Tailwind configuration
│   └── package.json
├── server/                 # Backend Node.js/Express Application
│   ├── src/
│   │   ├── config/         # Database and env configs
│   │   ├── controllers/    # Route controllers
│   │   ├── jobs/           # Node-cron background tasks
│   │   ├── middleware/     # Express middlewares (Auth, Error handling)
│   │   ├── models/         # Mongoose Schemas
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Core business logic (DealEngine, ScraperMock, Telegram)
│   │   ├── utils/          # Helper functions
│   │   └── validators/     # Input validation (Joi/Zod)
│   ├── .env                # Environment Variables
│   ├── server.js           # Application Entry Point
│   └── package.json
└── README.md
```

## Step-by-Step Coding Plan

### Phase 1: Architecture & Setup (Completed)
- [x] Initialize monolithic repository structure.
- [x] Scaffolding backend (Express, Mongoose, nodemon).
- [x] Scaffolding frontend (React, Vite, TypeScript, TailwindCSS).
- [x] Define global styling and theme tokens.

### Phase 2: Database & Core Models (Completed)
- [x] Set up MongoDB connection (`db.js`).
- [x] Create core schemas (`User`, `Product`, `PriceHistory`, `Alert`).
- [x] Implement password hashing and JWT token generation in `User` model.

### Phase 3: The Engine - Business Logic (Completed)
- [x] Create `DealEngine` service to calculate discount percentages, price drops, and "Deal Scores".
- [x] Create `TelegramService` to parse deal details and send formatted markdown alerts via Telegram Bot API.
- [x] Create `ProductMonitor` to orchestrate data ingestion, evaluate deals, check for duplicate alerts (spam prevention), and trigger Telegram notifications.
- [x] Configure `node-cron` to run the monitor automatically every 30 minutes.

### Phase 4: API & Routing (Completed)
- [x] Set up robust error handling middleware.
- [x] Implement `authController` (Register, Login, GetMe).
- [x] Implement `productController` (Get all tracked products, Dashboard aggregated analytics).
- [x] Create Express Routes and bind them to the main `server.js`.

### Phase 5: Frontend Development (Completed)
- [x] Configure React Router (`App.tsx`).
- [x] Build the main `Dashboard` view using TailwindCSS, Lucide Icons, and Recharts.
- [x] Connect Frontend to Backend APIs (Dashboard & Analytics).
- [x] Build the "Product Explorer" page with server-side filtering.
- [ ] Implement user authentication flows (Login/Register forms).

### Phase 6: Scraper Integration (Completed)
- [x] Replace mock data in `cron.js` with a live Myntra Scraper.
- [x] Utilize Axios to directly extract `window.__myx` JSON data to bypass headless browser overhead and anti-bot measures.
- [x] Integrate data ingestion seamlessly into `ProductMonitor`.

## Deployment Setup

### 1. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Database Access** and create a user.
3. Go to **Network Access** and allow IP `0.0.0.0/0` (or specifically your backend IPs).
4. Get the connection string and add it to `MONGO_URI` in the backend `.env`.

### 2. Backend (Render / Railway)
1. Push the repository to GitHub.
2. Sign in to Render or Railway.
3. Create a **New Web Service**.
4. Connect your GitHub repository.
5. Set Root Directory to `server/`.
6. Set Build Command to `npm install`.
7. Set Start Command to `node server.js`.
8. Add all Environment Variables (`MONGO_URI`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, etc.) in the dashboard.
9. Deploy.

### 3. Frontend (Vercel)
1. Sign in to Vercel.
2. Create a **New Project** and import the GitHub repository.
3. Set the Framework Preset to **Vite**.
4. Set the Root Directory to `client/`.
5. Set Environment Variables (e.g., `VITE_API_URL` pointing to your deployed Render URL).
6. Deploy.

## Local Development

**Backend:**
```bash
cd server
npm run dev # Runs nodemon
```

**Frontend:**
```bash
cd client
npm run dev # Runs Vite on localhost:5173
```
