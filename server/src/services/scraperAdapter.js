/**
 * Base Scraper Adapter Interface
 */
class ScraperAdapter {
    constructor(storeName) {
        this.storeName = storeName;
    }

    /**
     * Main method to scrape multiple products
     * @param {Array<string>} brands 
     * @param {number} maxPages 
     */
    async scrapeProducts(brands, maxPages) {
        throw new Error('Method scrapeProducts() must be implemented');
    }

    /**
     * Health check for the specific store
     */
    async healthCheck() {
        throw new Error('Method healthCheck() must be implemented');
    }

    /**
     * Helper to generate slugs
     */
    generateSlug(brand) {
        return brand.toLowerCase().replace(/\s+/g, '-');
    }
}

module.exports = ScraperAdapter;
