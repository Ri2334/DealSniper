/**
 * ProxyManager handles different proxy configurations for outgoing requests.
 * Supported modes: DIRECT, ROTATING, RESIDENTIAL
 */
class ProxyManager {
    constructor() {
        this.mode = process.env.PROXY_MODE || 'DIRECT';
        this.proxyUrl = process.env.PROXY_URL; // e.g., http://user:pass@host:port
    }

    /**
     * Get proxy configuration for Axios
     * @returns {Object|null}
     */
    getAxiosConfig() {
        if (this.mode === 'DIRECT' || !this.proxyUrl) {
            return null;
        }

        try {
            const url = new URL(this.proxyUrl);
            return {
                proxy: {
                    protocol: url.protocol.replace(':', ''),
                    host: url.hostname,
                    port: parseInt(url.port),
                    auth: url.username ? {
                        username: decodeURIComponent(url.username),
                        password: decodeURIComponent(url.password)
                    } : undefined
                }
            };
        } catch (error) {
            console.error('[PROXY_ERROR] Invalid PROXY_URL:', error.message);
            return null;
        }
    }

    /**
     * Get proxy configuration for Playwright
     * @returns {Object|null}
     */
    getPlaywrightConfig() {
        if (this.mode === 'DIRECT' || !this.proxyUrl) {
            return null;
        }

        return {
            server: this.proxyUrl
        };
    }

    /**
     * Returns true if proxying is enabled
     */
    isEnabled() {
        return this.mode !== 'DIRECT' && !!this.proxyUrl;
    }

    getMode() {
        return this.mode;
    }
}

module.exports = new ProxyManager();
