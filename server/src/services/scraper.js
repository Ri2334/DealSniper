const axios = require('axios');

class MyntraScraper {
  static async scrapeBrands(brands = ['H&M'], maxPages = 100) {
    let allProducts = [];

    for (const brand of brands) {
      const encodedBrand = encodeURIComponent(brand);
      
      // Robust Slug Generation
      let slug = brand.toLowerCase()
        .replace(/h&m/g, 'h-m')
        .replace(/&/g, '-')
        .replace(/\s+/g, '-')
        .replace(/\./g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      // Special cases
      if (brand === 'RARE RABBIT') slug = 'rare-rabbit';
      if (brand === 'Levis') slug = 'levis';
      
      console.log(`Starting crawl for brand: ${brand} (Slug: ${slug})`);

      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage && currentPage <= maxPages) {
        // Try Gateway API first (Cleaner, less likely to be geoblocked than HTML)
        const apiUrl = `https://www.myntra.com/gateway/v2/search/${slug}?p=${currentPage}&rows=50&f=Brand:${encodedBrand}`;
        const webUrl = currentPage === 1 ? `https://www.myntra.com/${slug}?f=Brand%3A${encodedBrand}` : `https://www.myntra.com/${slug}?f=Brand%3A${encodedBrand}&p=${currentPage}`;
        
        console.log(`Scraping ${brand} - Page ${currentPage}: ${apiUrl}`);

        let retries = 2;
        let success = false;

        while (retries > 0 && !success) {
          try {
            // Use Mobile Headers and Indian Locale to bypass Geoblock
            const response = await axios.get(apiUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json',
                'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': `https://www.myntra.com/${slug}`,
                'X-Requested-With': 'XMLHttpRequest'
              },
              timeout: 15000
            });

            const results = response.data?.searchData?.results;

            if (results?.products && results.products.length > 0) {
              const formattedProducts = results.products.map(item => {
                const mrp = item.mrp || 0;
                const currentPrice = item.price || 0;
                const discountPercent = mrp > 0 ? Math.round(((mrp - currentPrice) / mrp) * 100) : 0;
                
                return {
                  productId: String(item.productId),
                  brand: item.brand || brand,
                  name: item.productName || item.product || '',
                  url: `https://www.myntra.com/${item.landingPageUrl}`,
                  image: item.searchImage || '',
                  mrp,
                  currentPrice,
                  discountPercent,
                  category: item.category || 'Fashion',
                  availability: true,
                  lastUpdated: new Date()
                };
              });

              const newProducts = formattedProducts.filter(
                newProd => !allProducts.some(existingProd => existingProd.productId === newProd.productId)
              );

              allProducts = [...allProducts, ...newProducts];
              console.log(`[API_SUCCESS] Parsed ${newProducts.length} unique products from ${brand} page ${currentPage}`);
              
              hasNextPage = results.hasNextPage === true;
              currentPage++;
              success = true;
            } else {
              // If API returns no products, try fallback to HTML strategy once
              console.log(`[API_EMPTY] No products for ${brand} via API. Attempting HTML extraction...`);
              throw new Error('API_EMPTY');
            }
          } catch (error) {
            // HTML Fallback Strategy
            try {
              const htmlResponse = await axios.get(webUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Accept-Language': 'en-IN,en;q=0.9',
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
                
                if (results?.products) {
                   // ... parse same as API ...
                   const formatted = results.products.map(item => ({
                     productId: String(item.productId),
                     brand: item.brand || brand,
                     name: item.productName || item.product || '',
                     url: `https://www.myntra.com/${item.landingPageUrl}`,
                     image: item.searchImage || '',
                     mrp: item.mrp,
                     currentPrice: item.price,
                     discountPercent: Math.round(((item.mrp - item.price) / item.mrp) * 100),
                     category: item.category || 'Fashion',
                     availability: true,
                     lastUpdated: new Date()
                   }));
                   allProducts = [...allProducts, ...formatted];
                   console.log(`[HTML_SUCCESS] Parsed ${formatted.length} products for ${brand}`);
                   hasNextPage = results.hasNextPage === true;
                   currentPage++;
                   success = true;
                   break;
                }
              }
            } catch (htmlErr) {
              console.error(`[CRITICAL_FAIL] ${brand} page ${currentPage} blocked on all strategies.`);
            }

            retries--;
            await new Promise(r => setTimeout(r, 5000));
          }
        }
      }
    }

    return allProducts;
  }
}

module.exports = MyntraScraper;
