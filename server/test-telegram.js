require('dotenv').config();
const TelegramService = require('./src/services/telegram');

async function testTelegram() {
  const dummyProduct = {
    brand: 'H&M',
    name: 'Slim Fit Cotton Shirt (Test)',
    mrp: 2299,
    currentPrice: 435,
    discountPercent: 81,
    url: 'https://myntra.com',
    productId: 'TEST-123'
  };

  console.log('Sending test Telegram alert...');
  await TelegramService.sendDealAlert(dummyProduct, 56, 96, 999);
  console.log('Test completed.');
  process.exit(0);
}

testTelegram();
