import { logger } from '../utils/logger';

/**
 * Image Scraper Service
 * Attempts to find a product image using DuckDuckGo image search.
 * Uses DuckDuckGo's HTML page scraping (no API key required).
 */

/**
 * Build a search query string from product description and brand.
 */
function buildSearchQuery(description: string, brand: string): string {
    const parts: string[] = [];
    if (brand) parts.push(brand.trim());
    if (description) parts.push(description.trim());
    return parts.join(' ');
}

/**
 * Scrape an image URL from DuckDuckGo Images HTML page.
 * Parses the vqd token then fetches the JSON results endpoint.
 */
async function searchDuckDuckGo(query: string): Promise<string | null> {
    try {
        // Step 1: Get the vqd token from the DuckDuckGo search page
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
        const htmlRes = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            },
            signal: AbortSignal.timeout(10_000),
        });

        if (!htmlRes.ok) {
            logger.warn(`[ImageScraper] DuckDuckGo HTML fetch failed: ${htmlRes.status}`);
            return null;
        }

        const html = await htmlRes.text();

        // Extract the vqd token (format: vqd='4-xxxxxxxx' or vqd="4-xxxxxxxx")
        const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
        if (!vqdMatch) {
            logger.warn('[ImageScraper] Could not extract vqd token from DuckDuckGo response');
            return null;
        }
        const vqd = vqdMatch[1];

        // Step 2: Fetch the image results JSON endpoint
        const imageApiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&f=,,,,,&p=1&v7exp=a`;
        const jsonRes = await fetch(imageApiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://duckduckgo.com/',
                'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10_000),
        });

        if (!jsonRes.ok) {
            logger.warn(`[ImageScraper] DuckDuckGo image API failed: ${jsonRes.status}`);
            return null;
        }

        const json = await jsonRes.json() as { results?: Array<{ image: string }> };
        const results = json?.results;

        if (!Array.isArray(results) || results.length === 0) {
            logger.warn('[ImageScraper] DuckDuckGo returned no image results');
            return null;
        }

        // Return the first image URL that starts with http/https
        for (const item of results) {
            const url = item?.image;
            if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
                return url;
            }
        }

        return null;
    } catch (error: any) {
        logger.warn(`[ImageScraper] DuckDuckGo search error: ${error.message}`);
        return null;
    }
}

/**
 * Fetch an image URL and return its buffer.
 */
export async function fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
    try {
        const res = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok || !res.body) {
            logger.warn(`[ImageScraper] Failed to download image from ${imageUrl}: ${res.status}`);
            return null;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            logger.warn(`[ImageScraper] URL did not return image content-type: ${contentType}`);
            return null;
        }

        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error: any) {
        logger.warn(`[ImageScraper] Error downloading image: ${error.message}`);
        return null;
    }
}

/**
 * Main entry point: search for a product image using DuckDuckGo,
 * then return the image buffer and source URL if found.
 */
export async function scrapeProductImage(
    description: string,
    brand: string
): Promise<{ buffer: Buffer; sourceUrl: string } | null> {
    const query = buildSearchQuery(description, brand);
    if (!query) return null;

    logger.info(`[ImageScraper] Searching image for: "${query}"`);

    const imageUrl = await searchDuckDuckGo(query);
    if (!imageUrl) {
        logger.info(`[ImageScraper] No image found for: "${query}"`);
        return null;
    }

    logger.info(`[ImageScraper] Found image URL: ${imageUrl}`);

    const buffer = await fetchImageBuffer(imageUrl);
    if (!buffer) return null;

    return { buffer, sourceUrl: imageUrl };
}
