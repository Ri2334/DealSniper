const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const channelId = process.env.TELEGRAM_CHANNEL_ID;

class TelegramService {
  static async sendDealAlert(product, dropPercent, score, previousPrice, isLowestPrice) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL_ID) {
      console.warn('Telegram bot not configured. Skipping alert.');
      return;
    }

    const lowestPriceStatus = isLowestPrice ? '✅ YES' : 'NO';

    const message = `
🚨 *DEAL ALERT*

*Deal Score:* ${score}/100
*Price Drop:* ${dropPercent}%
*Discount:* ${product.discountPercent}%
*Lowest Price Ever:* ${lowestPriceStatus}

*Brand:* ${product.brand}
*Product:* ${product.name}

*Current Price:* ₹${product.currentPrice}
*Previous Price:* ₹${previousPrice || product.mrp}
*MRP:* ₹${product.mrp}

[Buy Now on Myntra](${product.url})

_Intelligence Engine v2.0_
    `;

    try {
      await bot.telegram.sendMessage(channelId, message, { parse_mode: 'Markdown' });
      console.log(`Telegram alert sent for ${product.productId}`);
    } catch (error) {
      console.error(`Failed to send Telegram alert: ${error.message}`);
    }
  }
}

module.exports = TelegramService;
