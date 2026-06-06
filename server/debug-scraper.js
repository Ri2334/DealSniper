const axios = require('axios');

async function debugFetch() {
    const url = 'https://www.myntra.com/h-m?f=Brand%3AH%26M';
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000
        });

        console.log('--- DEBUG INFO ---');
        console.log('Data Length:', data.length);
        console.log('Title:', data.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title Found');
        console.log('--- FIRST 500 CHARACTERS ---');
        console.log(data.substring(0, 500));
        console.log('--- END DEBUG INFO ---');

    } catch (error) {
        console.error('Fetch failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data Sample:', error.response.data.substring(0, 500));
        }
    }
}

debugFetch();
