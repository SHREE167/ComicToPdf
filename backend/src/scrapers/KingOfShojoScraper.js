const BaseScraper = require("./BaseScraper");

class KingOfShojoScraper extends BaseScraper {
    constructor() {
        super("https://kingofshojo.com");
    }

    async getChapters(mangaUrl) {
        const $ = await this.fetchHtml(mangaUrl);
        const chapters = $("div.eph-num a")
            .map((i, el) => ({
                title: $(el).text().trim(),
                url: $(el).attr("href"),
                number: this.extractChapterNumber($(el).text().trim())
            }))
            .get()
            .reverse();
            
        if (chapters.length === 0) {
             // Fallback selector check if structure changes
             const fallbackChapters = $("ul.sub-chap-list li.wp-manga-chapter a")
                .map((i, el) => ({
                    title: $(el).text().trim(),
                    url: $(el).attr("href"),
                    number: this.extractChapterNumber($(el).text().trim())
                }))
                .get()
                .reverse();
             return fallbackChapters;
        }

        return chapters;
    }

    async getChapterImages(chapterUrl) {
        const $ = await this.fetchHtml(chapterUrl);
        return $("img[src]")
            .map((i, el) => $(el).attr("src"))
            .get()
            .filter(url => url && url.includes("kingofshojo.com/wp-content/uploads/manga/"));
    }
}

module.exports = KingOfShojoScraper;
