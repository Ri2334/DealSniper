const { Telegraf, Markup } = require('telegraf');
const TelegramSubscriber = require('../models/TelegramSubscriber');
const SystemStatus = require('../models/SystemStatus');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const CATEGORIES = [
  'Shirts', 'Polo T-Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Cargo Trousers', 'Shorts', 'Jackets', 
  'Hoodies', 'Sweatshirts', 'Sweaters', 'Shoes', 'Sneakers', 'Casual Shoes', 'Watches', 'Fragrance', 
  'Sunglasses', 'Belts', 'Wallets', 'Bags', 'Ethnic Wear', 
  'Formal Wear', 'Innerwear', 'Socks', 'Activewear', 'Other'
];
const BRANDS = ['H&M', 'Levis', 'RARE RABBIT', 'U.S. Polo Assn.', 'Van Heusen', 'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Arrow', 'Louis Philippe', 'Jack & Jones', 'Wrogn', 'Roadster', 'HRX by Hrithik Roshan', 'Puma', 'Adidas', 'Nike', 'Flying Machine', 'Pepe Jeans', 'Celio'];

// Bot Commands for Subscriptions
bot.command('start', async (ctx) => {
  try {
    await TelegramSubscriber.findOneAndUpdate(
       { chatId: ctx.chat.id.toString() },
       { 
         firstName: ctx.chat.first_name,
         username: ctx.chat.username,
         isActive: true 
       },
       { upsert: true, new: true }
    );
    ctx.reply('Welcome to DealSniper! \n\nYou can subscribe to specific alerts using:\n/categories - Select product categories\n/brands - Select preferred brands');
  } catch(e) {
    console.error('Bot start error', e);
  }
});

bot.command('categories', async (ctx) => {
   const sub = await TelegramSubscriber.findOne({ chatId: ctx.chat.id.toString() });
   if (!sub) return ctx.reply('Please send /start first.');
   
   const buttons = CATEGORIES.map(c => 
     Markup.button.callback(`${sub.categories.includes(c) ? '✅' : '❌'} ${c}`, `cat_${c}`)
   );
   
   const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });
   ctx.reply('Select categories to toggle subscription (If none selected, you receive ALL):', keyboard);
});

bot.command('brands', async (ctx) => {
   const sub = await TelegramSubscriber.findOne({ chatId: ctx.chat.id.toString() });
   if (!sub) return ctx.reply('Please send /start first.');
   
   const buttons = BRANDS.map(b => 
     Markup.button.callback(`${sub.brands.includes(b) ? '✅' : '❌'} ${b}`, `brand_${b}`)
   );
   
   const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });
   ctx.reply('Select brands to toggle subscription (If none selected, you receive ALL):', keyboard);
});

bot.action(/cat_(.+)/, async (ctx) => {
   const cat = ctx.match[1];
   const sub = await TelegramSubscriber.findOne({ chatId: ctx.chat.id.toString() });
   if (!sub) return;
   
   if (sub.categories.includes(cat)) {
       sub.categories = sub.categories.filter(c => c !== cat);
   } else {
       sub.categories.push(cat);
   }
   await sub.save();
   
   const buttons = CATEGORIES.map(c => 
     Markup.button.callback(`${sub.categories.includes(c) ? '✅' : '❌'} ${c}`, `cat_${c}`)
   );
   const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });
   await ctx.editMessageReplyMarkup(keyboard.reply_markup).catch(() => {});
   ctx.answerCbQuery(`${cat} toggled!`);
});

bot.action(/brand_(.+)/, async (ctx) => {
   const brand = ctx.match[1];
   const sub = await TelegramSubscriber.findOne({ chatId: ctx.chat.id.toString() });
   if (!sub) return;
   
   if (sub.brands.includes(brand)) {
       sub.brands = sub.brands.filter(b => b !== brand);
   } else {
       sub.brands.push(brand);
   }
   await sub.save();
   
   const buttons = BRANDS.map(b => 
     Markup.button.callback(`${sub.brands.includes(b) ? '✅' : '❌'} ${b}`, `brand_${b}`)
   );
   const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });
   await ctx.editMessageReplyMarkup(keyboard.reply_markup).catch(() => {});
   ctx.answerCbQuery(`${brand} toggled!`);
});

class TelegramService {
  static async sendDealAlert(product, dropPercent, score, previousPrice, isLowestPrice) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;

    const lowestPriceStatus = isLowestPrice ? '✅ YES' : 'NO';

    const message = `
🚨 *DEAL ALERT*

*Deal Score:* ${score}/100
*Price Drop:* ${dropPercent}%
*Discount:* ${product.discountPercent}%
*Lowest Price Ever:* ${lowestPriceStatus}

*Brand:* ${product.brand}
*Product:* ${product.name}
*Category:* ${product.category}

*Current Price:* ₹${product.currentPrice}
*Previous Price:* ₹${previousPrice || product.mrp}
*MRP:* ₹${product.mrp}

[Buy Now on Myntra](${product.url})

_Intelligence Engine v3.0_
    `;

    let alertSent = false;

    // 1. Send to Global Channel if defined
    if (channelId) {
      try {
        await bot.telegram.sendMessage(channelId, message, { parse_mode: 'Markdown' });
        alertSent = true;
      } catch (error) {
        console.error(`Failed to send Telegram channel alert: ${error.message}`);
      }
    }

    // 2. Send to Individual Subscribers matching criteria
    try {
      const subscribers = await TelegramSubscriber.find({ isActive: true });
      for (const sub of subscribers) {
         const catMatch = sub.categories.length === 0 || sub.categories.includes(product.category);
         const brandMatch = sub.brands.length === 0 || sub.brands.includes(product.brand);
         
         if (catMatch && brandMatch) {
            await bot.telegram.sendMessage(sub.chatId, message, { parse_mode: 'Markdown' }).then(() => {
                alertSent = true;
            }).catch(e => {
               if(e.code === 403) {
                  // User blocked bot
                  sub.isActive = false;
                  sub.save();
               }
            });
         }
      }
    } catch(err) {
      console.error('Error dispatching to subscribers', err);
    }

    if (alertSent) {
      await SystemStatus.findOneAndUpdate(
        { key: 'main_status' },
        { 
          $set: { lastTelegramAlertSent: new Date() },
          $inc: { totalAlertsSent: 1 }
        },
        { upsert: true }
      );
    }
  }

  static async sendSystemAlert(title, message) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !channelId) return;

    const alertMessage = `
⚠️ *SYSTEM ALERT*

*${title}*
${message}

_Timestamp: ${new Date().toISOString()}_
    `;

    try {
      await bot.telegram.sendMessage(channelId, alertMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error(`Failed to send Telegram system alert: ${error.message}`);
    }
  }
}

let isBotLaunched = false;

const launchBot = (delayMs = 5000) => {
  if (process.env.TELEGRAM_BOT_TOKEN && !isBotLaunched) {
    console.log(`Telegram bot launch scheduled with ${delayMs}ms delay...`);
    setTimeout(() => {
      if (isBotLaunched) return;
      bot.launch()
        .then(() => {
          isBotLaunched = true;
          console.log('Telegram Bot Polling started.');
          // Notify on restart
          TelegramService.sendSystemAlert('Backend Restarted', 'The DealSniper server has been restarted and bot is active.');
        })
        .catch(err => {
          if (err.response && err.response.error_code === 409) {
            console.warn('Telegram bot conflict (409). Another instance is likely polling. Skipping polling for this process.');
          } else {
            console.error('Telegram bot failed to launch', err);
          }
          isBotLaunched = false;
        });
    }, delayMs);
  }
};

// Cleanup on exit
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { 
  sendDealAlert: TelegramService.sendDealAlert, 
  sendSystemAlert: TelegramService.sendSystemAlert,
  launchBot 
};
