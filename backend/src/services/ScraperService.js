const KingOfShojoScraper = require("../scrapers/KingOfShojoScraper");
const AquaReaderScraper = require("../scrapers/AquaReaderScraper");

class ScraperService {
    static getScraper(url) {
        if (url.includes("kingofshojo.com")) {
            return new KingOfShojoScraper();
        } else if (url.includes("aquareader.net")) {
            return new AquaReaderScraper();
        } else {
            throw new Error("Unsupported website. Only KingOfShojo and AquaReader are supported.");
        }
    }

    static getSiteType(url) {
        if (url.includes("kingofshojo.com")) return "kingofshojo";
        if (url.includes("aquareader.net")) return "aquareader";
        return null;
    }

    static getScraperByName(name) {
        const normalized = name.toLowerCase();
        if (normalized === "kingofshojo") {
            return new KingOfShojoScraper();
        } else if (normalized === "aquareader") {
            return new AquaReaderScraper();
        } else {
            throw new Error(`Unsupported site name: ${name}`);
        }
    }
}

module.exports = ScraperService;
