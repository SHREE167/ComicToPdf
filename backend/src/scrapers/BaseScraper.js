const axios = require("axios");
const cheerio = require("cheerio");

class BaseScraper {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async fetchHtml(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            return cheerio.load(response.data);
        } catch (error) {
            console.error(`Error fetching ${url}:`, error.message);
            throw new Error(`Failed to fetch content from ${url}`);
        }
    }

    async getChapters(mangaUrl) {
        throw new Error("Method 'getChapters' must be implemented.");
    }

    async getChapterImages(chapterUrl) {
        throw new Error("Method 'getChapterImages' must be implemented.");
    }

    extractChapterNumber(title) {
        const match = title.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 0;
    }
}

module.exports = BaseScraper;
