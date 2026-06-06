const axios = require('axios');

class MyntraScraper {
  static async getSessionCookies() {
    try {
      const response = await axios.get('https://www.myntra.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
        },
        timeout: 10000
      });
      return response.headers['set-cookie'] || [];
    } catch (error) {
      console.error('[SESSION_ERROR] Failed to get initial cookies:', error.message);
      return [];
    }
  }

  static async scrapeBrands(brands = ['H&M'], maxPages = 100) {
    let allProducts = [];
    const cookies = await this.getSessionCookies();
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    for (const brand of brands) {
      const encodedBrand = encodeURIComponent(brand);
      
      // Precise Slug Generation
      let slug = brand.toLowerCase()
        .replace(/h&m/g, 'h-m')
        .replace(/&/g, '-')
        .replace(/\s+/g, '-')
        .replace(/\./g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      if (brand === 'RARE RABBIT') slug = 'rare-rabbit';
      if (brand === 'Levis') slug = 'levis';
      if (brand === 'U.S. Polo Assn.') slug = 'us-polo-assn';
      
      console.log(`[CRAWL_START] Brand: ${brand} (Slug: ${slug})`);

      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage && currentPage <= maxPages) {
        // Use the 'listing' gateway endpoint which is more robust
        const apiUrl = `https://www.myntra.com/gateway/v2/search/${slug}?p=${currentPage}&rows=50&f=Brand%3A${encodedBrand}&sort=new`;
        const webUrl = `https://www.myntra.com/${slug}?f=Brand%3A${encodedBrand}&p=${currentPage}`;
        
        console.log(`[SCRAPE_ATTEMPT] ${brand} P${currentPage} -> ${apiUrl}`);

        let retries = 2;
        let success = false;

        while (retries > 0 && !success) {
          try {
            const response = await axios.get(apiUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json',
                'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
                'Cookie': cookieHeader,
                'Referer': `https://www.myntra.com/${slug}`,
                'X-Requested-With': 'XMLHttpRequest'
              },
              timeout: 15000
            });

            const results = response.data?.searchData?.results;

            if (results?.products && results.products.length > 0) {
              const formattedProducts = results.products.map(item => ({
                  productId: String(item.productId),
                  brand: item.brand || brand,
                  name: item.productName || item.product || '',
                  url: `https://www.myntra.com/${item.landingPageUrl}`,
                  image: item.searchImage || '',
                  mrp: item.mrp || 0,
                  currentPrice: item.price || 0,
                  discountPercent: item.mrp > 0 ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0,
                  category: item.category || 'Fashion',
                  availability: true,
                  lastUpdated: new Date()
              }));

              const newProducts = formattedProducts.filter(
                newProd => !allProducts.some(existingProd => existingProd.productId === newProd.productId)
              );

              allProducts = [...allProducts, ...newProducts];
              console.log(`[API_SUCCESS] ${brand} P${currentPage}: ${newProducts.length} new items.`);
              
              hasNextPage = results.hasNextPage === true;
              currentPage++;
              success = true;
            } else {
              throw new Error('EMPTY_RESULTS');
            }
          } catch (error) {
            console.warn(`[API_FAIL] ${brand} P${currentPage}: ${error.message}. Trying HTML Fallback...`);
            
            try {
              const htmlResponse = await axios.get(webUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Accept-Language': 'en-IN,en;q=0.9',
                  'Cookie': cookieHeader,
                  'Referer': 'https://www.google.com/'
                },
                timeout: 15000
              });

              const data = htmlResponse.data;
              const markerRegex = /window\.__myx(_data)?\s*=\s*/;
              const match = data.match(markerRegex);
              
              if (match) {
                let jsonString = data.substring(match.index + match[0].length);
                const endIndex = jsonString.indexOf('</script>');
                jsonString = jsonString.substring(0, endIndex).trim();
                if (jsonString.endsWith(';')) jsonString = jsonString.slice(0, -1);
                
                const myx = JSON.parse(jsonString);
                const results = myx?.searchData?.results;
                
                if (results?.products && results.products.length > 0) {
                   const formatted = results.products.map(item => ({
                     productId: String(item.productId),
                     brand: item.brand || brand,
                     name: item.productName || item.product || '',
                     url: `https://www.myntra.com/${item.landingPageUrl}`,
                     image: item.searchImage || '',
                     mrp: item.mrp || 0,
                     currentPrice: item.price || 0,
                     discountPercent: item.mrp > 0 ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0,
                     category: item.category || 'Fashion',
                     availability: true,
                     lastUpdated: new Date()
                   }));
                   allProducts = [...allProducts, ...formatted];
                   console.log(`[HTML_SUCCESS] ${brand} P${currentPage}: ${formatted.length} items.`);
                   hasNextPage = results.hasNextPage === true;
                   currentPage++;
                   success = true;
                   break;
                }
              } else {
                 const title = data.match(/<title>(.*?)<\/title>/)?.[1] || 'Unknown';
                 console.error(`[HTML_BLOCK] ${brand} P${currentPage}: Title: ${title}`);
              }
            } catch (htmlErr) {
              console.error(`[CRITICAL_FAIL] ${brand} P${currentPage}: ${htmlErr.message}`);
            }

            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 5000));
          }
        }
        
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      }
    }
    return allProducts;
  }
}

module.exports = MyntraScraper;
