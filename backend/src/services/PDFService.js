const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");

class PDFService {
    constructor() {
        this.pLimit = null; // Will be initialized dynamically
    }

    async init() {
        // Dynamic import for ESM module
        const { default: pLimit } = await import("p-limit");
        this.pLimit = pLimit;
    }

    async generatePDF(chapters, res) {
        if (!this.pLimit) await this.init();
        const limit = this.pLimit(5); // Concurrency limit: 5

        res.setHeader("Content-Disposition", "attachment; filename=comic.pdf");
        res.setHeader("Content-Type", "application/pdf");

        const doc = new PDFDocument({ autoFirstPage: false });
        doc.pipe(res);

        for (const chapter of chapters) {
            console.log(`📖 Processing Chapter: ${chapter.title}`);
            const scraper = require("./ScraperService").getScraper(chapter.url);
            let imageUrls = [];

            try {
                imageUrls = await scraper.getChapterImages(chapter.url);
            } catch (error) {
                console.error(`Failed to get images for ${chapter.title}:`, error.message);
                doc.addPage().text(`Error loading chapter: ${chapter.title}`);
                continue;
            }

            if (imageUrls.length === 0) {
                doc.addPage().text(`No images found for: ${chapter.title}`);
                continue;
            }

            // Download images in parallel
            const imagePromises = imageUrls.map(url => limit(() => this.downloadAndProcessImage(url)));
            const processedImages = await Promise.allSettled(imagePromises);

            for (const result of processedImages) {
                if (result.status === "fulfilled" && result.value) {
                    try {
                        const img = doc.openImage(result.value);
                        doc.addPage({ size: [img.width, img.height], margin: 0 });
                        doc.image(img, 0, 0, { width: img.width, height: img.height });
                    } catch (pdfError) {
                        console.error("Error adding image to PDF:", pdfError.message);
                    }
                }
            }
        }

        doc.end();
    }

    async downloadAndProcessImage(url) {
        const MAX_RETRIES = 3;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            try {
                const response = await axios.get(url, { 
                    responseType: "arraybuffer",
                    timeout: 10000 // 10s timeout
                });
                
                return await sharp(response.data)
                    .trim({ threshold: 10 })
                    .toFormat("png")
                    .toBuffer();
            } catch (error) {
                attempt++;
                console.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);
                if (attempt >= MAX_RETRIES) return null;
            }
        }
    }
}

module.exports = new PDFService();
