const BaseScraper = require("./BaseScraper");

class AquaReaderScraper extends BaseScraper {
    constructor() {
        super("https://aquareader.net");
    }

    async getChapters(mangaUrl) {
        const $ = await this.fetchHtml(mangaUrl);
        return $("ul.sub-chap-list li.wp-manga-chapter a")
            .map((i, el) => ({
                title: $(el).text().trim(),
                url: $(el).attr("href"),
                number: this.extractChapterNumber($(el).text().trim())
            }))
            .get()
            .reverse();
    }

    async getChapterImages(chapterUrl) {
        const $ = await this.fetchHtml(chapterUrl);
        return $("img.wp-manga-chapter-img")
            .map((i, el) => $(el).attr("data-src") || $(el).attr("src")) // Prioritize data-src for lazy loading
            .get()
            .filter(url => url); // Remove null/undefined
    }
}

module.exports = AquaReaderScraper;
