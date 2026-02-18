const NodeCache = require("node-cache");
const ScraperService = require("../services/ScraperService");
const PDFService = require("../services/PDFService");
const axios = require("axios");
const cheerio = require("cheerio");

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

class MangaController {
    /**
     * POST /get-chapters
     */
    static async getChapters(req, res) {
        const { mangaUrl } = req.body;

        if (!mangaUrl) {
            return res.status(400).json({ error: "Manga URL is required!" });
        }

        const cacheKey = `chapters_${mangaUrl}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`⚡ Serving chapters from cache: ${mangaUrl}`);
            return res.json(cachedData);
        }

        try {
            const siteType = ScraperService.getSiteType(mangaUrl);
            if (!siteType) {
                return res.status(400).json({ error: "Invalid manga URL! Only AquaReader and KingOfShojo are supported." });
            }

            console.log(`🔍 Fetching chapters from: ${mangaUrl} (${siteType})`);
            const scraper = ScraperService.getScraper(mangaUrl);
            const chapters = await scraper.getChapters(mangaUrl);

            if (chapters.length === 0) {
                return res.status(400).json({ error: "No chapters found! The website structure may have changed." });
            }

            const responseData = { chapters, siteType };
            cache.set(cacheKey, responseData);

            console.log(`✅ Found ${chapters.length} chapters`);
            return res.json(responseData);
        } catch (error) {
            console.error("🚨 Error fetching chapters:", error.message);
            res.status(500).json({ error: "Failed to fetch chapters" });
        }
    }

    /**
     * POST /get-chapter-images
     */
    static async getChapterImages(req, res) {
        const { chapterUrl } = req.body;

        if (!chapterUrl) {
            return res.status(400).json({ error: "Chapter URL is required!" });
        }

        const cacheKey = `images_${chapterUrl}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`⚡ Serving images from cache: ${chapterUrl}`);
            return res.json(cachedData);
        }

        try {
            console.log(`📖 Scraping images from: ${chapterUrl}`);
            const scraper = ScraperService.getScraper(chapterUrl);
            const imageUrls = await scraper.getChapterImages(chapterUrl);

            const responseData = { imageUrls };
            cache.set(cacheKey, responseData);

            console.log(`✅ Found ${imageUrls.length} images`);
            return res.json(responseData);
        } catch (error) {
            console.error(`🚨 Error scraping chapter images:`, error.message);
            res.status(500).json({ error: "Failed to scrape chapter images." });
        }
    }

    /**
     * POST /scrape-comic (PDF)
     */
    static async scrapeComic(req, res) {
        const { mangaUrl, startChapter, endChapter } = req.body;

        if (!mangaUrl) {
            return res.status(400).json({ error: "Manga URL is required!" });
        }

        try {
            // Check cache for chapters first
            let allChapters;
            const cacheKey = `chapters_${mangaUrl}`;
            const cachedChapters = cache.get(cacheKey);

            if (cachedChapters) {
                 allChapters = cachedChapters.chapters;
            } else {
                 const scraper = ScraperService.getScraper(mangaUrl);
                 allChapters = await scraper.getChapters(mangaUrl);
                 // Cache them for future use
                 if (allChapters.length > 0) {
                     cache.set(cacheKey, { chapters: allChapters, siteType: ScraperService.getSiteType(mangaUrl) });
                 }
            }

            const scraper = ScraperService.getScraper(mangaUrl);
            const numericStart = scraper.extractChapterNumber(startChapter);
            const numericEnd = scraper.extractChapterNumber(endChapter);

            console.log(`🔍 Parsed chapter range: ${numericStart} to ${numericEnd}`);

            const selectedChapters = allChapters.filter(ch => {
                return ch.number >= numericStart && ch.number <= numericEnd;
            });

            if (selectedChapters.length === 0) {
                return res.status(400).json({ error: "Invalid chapter range selected." });
            }

            console.log(`✅ Processing ${selectedChapters.length} chapters...`);
            
            await PDFService.generatePDF(selectedChapters, res);
            console.log("✅ PDF generation completed!");

        } catch (error) {
            console.error("🚨 Scraping Error:", error.message);
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to process the comic. Please try again." });
            }
        }
    }

    /**
     * POST /search-manga
     */
    static async searchManga(req, res) {
        const { mangaName, site } = req.body;

        if (!mangaName || !site) {
            return res.status(400).json({ error: "Manga name and site are required!" });
        }

        if (site !== "kingofshojo") {
            return res.status(400).json({ error: "Currently, only 'kingofshojo' is supported for search." });
        }

        try {
            const encodedMangaName = encodeURIComponent(mangaName);
            const searchUrl = `https://kingofshojo.com/?s=${encodedMangaName}`;

            console.log(`🔍 Searching for "${mangaName}" on ${site} at ${searchUrl}`);

            const response = await axios.get(searchUrl);
            const html = response.data;
            const $ = cheerio.load(html);

            const results = [];
            $('div.bsx > a').each((i, el) => {
                const title = $(el).attr('title');
                const url = $(el).attr('href');
                if (title && url) {
                    results.push({ title, url });
                }
            });

            if (results.length === 0) {
                console.log(`⚠️ No results found for "${mangaName}" on ${site}.`);
            } else {
                console.log(`✅ Found ${results.length} results for "${mangaName}" on ${site}`);
            }

            return res.json(results);

        } catch (error) {
            console.error(`🚨 Error searching for manga "${mangaName}" on ${site}:`, error.message);
            if (error.response) {
                return res.status(error.response.status).json({ error: `Failed to fetch from ${site}. Status: ${error.response.status}` });
            } else {
                 return res.status(500).json({ error: `Failed to search manga on ${site}. Internal server error.` });
            }
        }
    }
}

module.exports = MangaController;
