require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const initCronJobs = require('./src/jobs/cron');
const { launchBot } = require('./src/services/telegram');

// Connect Database
connectDB();

// Initialize Cron Jobs
initCronJobs();

// Initialize Telegram Bot Subscriptions
// Deployment Heartbeat: 2026-06-06 16:10 (Playwright Setup Fix)
launchBot();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Basic Route
app.get('/', (req, res) => {
  res.send('DealSniper API is running...');
});

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const systemRoutes = require('./src/routes/systemRoutes');
const debugRoutes = require('./src/routes/debugRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/debug', debugRoutes);


// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
