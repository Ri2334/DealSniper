const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/myntra', async (req, res) => {
    const targetUrl = req.query.url || 'https://www.myntra.com/h-m?f=Brand%3AH%26M';
    const results = {
        timestamp: new Date().toISOString(),
        targetUrl,
        steps: []
    };

    try {
        // Step 1: Homepage Handshake
        results.steps.push({ name: 'Home Handshake' });
        const homeRes = await axios.get('https://www.myntra.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
            },
            timeout: 10000,
            validateStatus: false
        });
        
        const cookies = homeRes.headers['set-cookie'] || [];
        const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
        
        results.steps[0].status = homeRes.status;
        results.steps[0].cookieCount = cookies.length;
        results.steps[0].title = homeRes.data.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title';

        // Step 2: Target Fetch
        results.steps.push({ name: 'Target Fetch', url: targetUrl });
        const targetRes = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
                'Cookie': cookieHeader,
                'Referer': 'https://www.myntra.com/'
            },
            timeout: 15000,
            validateStatus: false,
            maxRedirects: 5
        });

        const data = targetRes.data;
        results.steps[1].status = targetRes.status;
        results.steps[1].finalUrl = targetRes.request.res.responseUrl || targetUrl;
        results.steps[1].contentType = targetRes.headers['content-type'];
        results.steps[1].headers = targetRes.headers;
        results.steps[1].title = data.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title';
        results.steps[1].bodySnippet = typeof data === 'string' ? data.substring(0, 3000).replace(/\s+/g, ' ') : 'Not a string';
        
        // Block Detection
        let blockType = 'Unknown';
        const bodyStr = String(data).toLowerCase();
        if (bodyStr.includes('cloudflare')) blockType = 'Cloudflare';
        else if (bodyStr.includes('akamai')) blockType = 'Akamai';
        else if (bodyStr.includes('access denied')) blockType = 'Access Denied';
        else if (bodyStr.includes('captcha')) blockType = 'Captcha';
        else if (bodyStr.includes('maintenance')) blockType = 'Site Maintenance';
        else if (results.steps[1].title === 'Site Maintenance') blockType = 'Site Maintenance (Title Match)';
        
        results.blockType = blockType;

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: error.stack,
            results 
        });
    }
});

module.exports = router;
