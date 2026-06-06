const axios = require('axios');

async function testFetch() {
    const url = 'https://www.myntra.com/h-m?f=Brand%3AH%26M';
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            }
        });

        const markerRegex = /window\.__myx(_data)?\s*=\s*/;
        const match = data.match(markerRegex);
        
        if (!match) {
            console.log('FAILED to find window.__myx via regex');
        } else {
            console.log('SUCCESS: Found marker:', match[0], 'at index', match.index);
            let jsonString = data.substring(match.index + match[0].length);
            const endIndex = jsonString.indexOf('</script>');
            jsonString = jsonString.substring(0, endIndex).trim();
            if (jsonString.endsWith(';')) jsonString = jsonString.slice(0, -1);
            
            try {
                const myx = JSON.parse(jsonString);
                console.log('Successfully parsed JSON. Products count:', myx?.searchData?.results?.products?.length);
            } catch (e) {
                console.log('Failed to parse JSON:', e.message);
                console.log('JSON start:', jsonString.substring(0, 100));
                console.log('JSON end:', jsonString.substring(jsonString.length - 100));
            }
        }

    } catch (error) {
        console.error('Fetch failed:', error.message);
    }
}

testFetch();
