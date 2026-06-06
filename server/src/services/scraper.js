const axios = require('axios');

class MyntraScraper {
  static async scrapeBrands(brands = ['H&M'], maxPages = 100) {
    let allProducts = [];

    for (const brand of brands) {
      const encodedBrand = encodeURIComponent(brand);
      // Generate slug: lowercase, replace spaces with hyphen, remove other special chars
      const slug = brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      let baseUrl = `https://www.myntra.com/${slug}?f=Brand%3A${encodedBrand}`;
      
      console.log(`Starting full crawl for brand: ${brand} (Slug: ${slug})`);

      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage && currentPage <= maxPages) {
        const url = currentPage === 1 ? baseUrl : `${baseUrl}&p=${currentPage}`;
        console.log(`Scraping ${brand} - Page ${currentPage}: ${url}`);

        let retries = 3;
        let success = false;

        while (retries > 0 && !success) {
          try {
            const { data } = await axios.get(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
              },
              timeout: 20000
            });

            const markerRegex = /window\.__myx(_data)?\s*=\s*/;
            const match = data.match(markerRegex);
            
            if (!match) {
              console.error(`Page ${currentPage}: Could not find window.__myx marker. Title: ${data.match(/<title>(.*?)<\/title>/)?.[1] || 'Unknown'}`);
              // If we fail, let's log a bit of the body to see if it's a bot check
              if (data.includes('checking your browser') || data.includes('Access Denied')) {
                console.error('Bot detection triggered on Myntra.');
              }
              retries--;
              await new Promise(r => setTimeout(r, 3000));
              continue;
            }

            const startIndex = match.index;
            const markerLength = match[0].length;
            let jsonString = data.substring(startIndex + markerLength);
            const endIndex = jsonString.indexOf('</script>');
            if (endIndex === -1) {
                 retries--;
                 continue;
            }
            jsonString = jsonString.substring(0, endIndex).trim();
            if (jsonString.endsWith(';')) jsonString = jsonString.slice(0, -1);

            const myx = JSON.parse(jsonString);
            const results = myx?.searchData?.results;

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

              // Enhanced Deduplication (ID, URL, Image)
              const newProducts = formattedProducts.filter(
                newProd => !allProducts.some(existingProd => 
                  existingProd.productId === newProd.productId || 
                  existingProd.url === newProd.url ||
                  (existingProd.image && existingProd.image === newProd.image)
                )
              );

              allProducts = [...allProducts, ...newProducts];
              console.log(`Parsed ${newProducts.length} new unique products from ${brand} page ${currentPage} (Ignored ${formattedProducts.length - newProducts.length} duplicates)`);
              
              hasNextPage = results.hasNextPage === true;
              currentPage++;
              success = true;
            } else {
              hasNextPage = false;
              success = true;
            }

            // Polite delay
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

          } catch (error) {
            console.error(`Error scraping ${brand} page ${currentPage}:`, error.message);
            retries--;
            if (retries > 0) {
              console.log(`Retrying... (${retries} attempts left)`);
              await new Promise(r => setTimeout(r, 3000));
            } else {
              hasNextPage = false; // Stop on persistent error for this brand
            }
          }
        }
      }
    }

    return allProducts;
  }
}

module.exports = MyntraScraper;
