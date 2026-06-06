const UserAgent = require('user-agents');

class StealthUtils {
    constructor() {
        this.userAgentGenerator = new UserAgent({ deviceCategory: 'desktop' });
    }

    /**
     * Generate a random realistic User-Agent
     */
    getUserAgent() {
        return this.userAgentGenerator.toString();
    }

    /**
     * Generate dynamic headers for Myntra
     */
    getHeaders(customHeaders = {}) {
        const ua = this.getUserAgent();
        return {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            ...customHeaders
        };
    }

    /**
     * Randomized delay between requests (jitter)
     * @param {number} min - Minimum delay in ms
     * @param {number} max - Maximum delay in ms
     */
    async jitter(min = 2000, max = 5000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Detect blocking from HTML or Response
     * @param {string} html 
     * @param {number} status 
     */
    detectBlock(html, status) {
        if (!html) return 'EMPTY_RESPONSE';
        
        const lowerHtml = html.toLowerCase();
        if (status === 403 || lowerHtml.includes('access denied')) return 'ACCESS_DENIED';
        if (lowerHtml.includes('akamai') && lowerHtml.includes('maintenance')) return 'AKAMAI_BLOCK';
        if (lowerHtml.includes('cloudflare') && lowerHtml.includes('captcha')) return 'CLOUDFLARE_CAPTCHA';
        if (lowerHtml.includes('verify you are human')) return 'CAPTCHA';
        
        return null;
    }
}

module.exports = new StealthUtils();
