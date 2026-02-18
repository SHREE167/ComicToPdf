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

    async search(query) {
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `${this.baseUrl}/?s=${encodedQuery}&post_type=wp-manga`;
        const $ = await this.fetchHtml(searchUrl);

        // AquaReader results typically appear in generic containers. 
        // Based on analysis, looking for headers with links or specific result containers.
        // Trying a broad selector that usually works for this theme type:
        return $('.c-tabs-item__content h3 a, .post-title h3 a, .row.c-tabs-item__content .col-4 a')
            .map((i, el) => ({
                title: $(el).text().trim(),
                url: $(el).attr("href")
            }))
            .get()
            .filter(item => item.title && item.url);
    }
}

module.exports = AquaReaderScraper;
