require('dotenv').config();
const mongoose = require('mongoose');
const SystemStatus = require('./src/models/SystemStatus');

async function resetState() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await SystemStatus.findOneAndUpdate(
      { key: 'main_status' },
      { 
        isCrawling: false, 
        currentBrand: null,
        lastError: 'Manual Reset for Diagnostics'
      },
      { upsert: true, new: true }
    );

    console.log('System state reset successfully:');
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
}

resetState();
