require('dotenv').config();
const axios = require('axios');

async function debugMyntra() {
    const targetUrl = 'https://www.myntra.com/h-m?f=Brand%3AH%26M';
    console.log(`--- [DEBUG_START] ${new Date().toISOString()} ---`);
    console.log(`Target: ${targetUrl}`);

    try {
        // Step 1: Homepage Handshake
        console.log('\n[STEP 1] Fetching Homepage...');
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
        
        console.log(`Status: ${homeRes.status}`);
        console.log(`Cookies Received: ${cookies.length}`);
        console.log(`Title: ${homeRes.data.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title'}`);

        // Step 2: Target Fetch
        console.log('\n[STEP 2] Fetching Target URL...');
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
        console.log(`Status: ${targetRes.status}`);
        console.log(`Final URL: ${targetRes.request.res.responseUrl || targetUrl}`);
        console.log(`Content-Type: ${targetRes.headers['content-type']}`);
        console.log(`Title: ${data.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title'}`);
        
        console.log('\n[RESPONSE_BODY_PREVIEW]');
        const bodySnippet = typeof data === 'string' ? data.substring(0, 3000).replace(/\s+/g, ' ') : 'Not a string';
        console.log(bodySnippet);
        
        // Block Detection
        let blockType = 'Unknown';
        const bodyStr = String(data).toLowerCase();
        if (bodyStr.includes('cloudflare')) blockType = 'Cloudflare';
        else if (bodyStr.includes('akamai')) blockType = 'Akamai';
        else if (bodyStr.includes('access denied')) blockType = 'Access Denied';
        else if (bodyStr.includes('captcha')) blockType = 'Captcha';
        else if (bodyStr.includes('maintenance')) blockType = 'Site Maintenance';
        
        console.log(`\nDetected Block: ${blockType}`);
        console.log(`--- [DEBUG_END] ---`);

        process.exit(0);
    } catch (error) {
        console.error(`\n[FATAL_ERROR] ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

debugMyntra();
