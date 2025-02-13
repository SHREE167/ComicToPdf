const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * API to fetch available chapter links from either AquaReader or KingOfShojo.
 */
app.post("/get-chapters", async (req, res) => {
    const { mangaUrl } = req.body;

    if (!mangaUrl) {
        return res.status(400).json({ error: "Manga URL is required!" });
    }

    let siteType;
    if (mangaUrl.includes("aquareader.net/manga/")) {
        siteType = "aquareader";
    } else if (mangaUrl.includes("kingofshojo.com/manga/")) {
        siteType = "kingofshojo";
    } else {
        return res.status(400).json({ error: "Invalid manga URL! Only AquaReader and KingOfShojo are supported." });
    }

    try {
        console.log(`🔍 Fetching chapters from: ${mangaUrl} (${siteType})`);

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(mangaUrl, { waitUntil: "domcontentloaded" });

        let chapters = [];

        if (siteType === "aquareader") {
            chapters = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("ul.sub-chap-list li.wp-manga-chapter a"))
                    .map(link => ({
                        title: link.innerText.trim(),
                        url: link.href,
                    }))
                    .reverse();
            });
        } else if (siteType === "kingofshojo") {
            chapters = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("div.eph-num a"))
                    .map(link => ({
                        title: link.innerText.trim(),
                        url: link.href,
                    }))
                    .reverse();
            });
        }

        await browser.close();

        if (chapters.length === 0) {
            return res.status(400).json({ error: "No chapters found! The website structure may have changed." });
        }

        console.log(`✅ Found ${chapters.length} chapters`);
        return res.json({ chapters, siteType });
    } catch (error) {
        console.error("🚨 Error fetching chapters:", error);
        res.status(500).json({ error: "Failed to fetch chapters" });
    }
});

/**
 * Helper function: Extract chapter number from title.
 */
function extractChapterNumber(title) {
    return parseInt(title.replace(/[^0-9]/g, ""), 10) || 0;
}

/**
 * API to scrape images from selected chapters and generate a PDF.
 */
app.post("/scrape-comic", async (req, res) => {
    const { mangaUrl, startChapter, endChapter } = req.body;

    if (!mangaUrl) {
        return res.status(400).json({ error: "Manga URL is required!" });
    }

    let siteType;
    if (mangaUrl.includes("aquareader.net/manga/")) {
        siteType = "aquareader";
    } else if (mangaUrl.includes("kingofshojo.com/manga/")) {
        siteType = "kingofshojo";
    } else {
        return res.status(400).json({ error: "Invalid manga URL! Only AquaReader and KingOfShojo are supported." });
    }

    try {
        console.log(`📥 Request: ${mangaUrl} | Chapters: ${startChapter} to ${endChapter} (${siteType})`);
        console.log(`🔍 Fetching chapter links...`);

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(mangaUrl, { waitUntil: "domcontentloaded" });

        let allChapters = [];

        if (siteType === "aquareader") {
            allChapters = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("ul.sub-chap-list li.wp-manga-chapter a"))
                    .map(link => ({
                        title: link.innerText.trim(),
                        url: link.href,
                    }))
                    .reverse();
            });
        } else if (siteType === "kingofshojo") {
            allChapters = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("div.eph-num a"))
                    .map(link => ({
                        title: link.innerText.trim(),
                        url: link.href,
                    }))
                    .reverse();
            });
        }

        await browser.close();

        if (allChapters.length === 0) {
            return res.status(400).json({ error: "No chapters found!" });
        }

        console.log(`✅ Found ${allChapters.length} chapters`);

        const numericStart = extractChapterNumber(startChapter);
        const numericEnd = extractChapterNumber(endChapter);
        console.log(`🔍 Parsed chapter range: ${numericStart} to ${numericEnd}`);

        const selectedChapters = allChapters.filter(ch => {
            const num = extractChapterNumber(ch.title);
            return num >= numericStart && num <= numericEnd;
        });

        if (selectedChapters.length === 0) {
            return res.status(400).json({ error: "Invalid chapter range selected." });
        }

        console.log("✅ Selected Chapter URLs:", selectedChapters.map(ch => ch.url));

        // ✅ Prepare PDF response
        res.setHeader("Content-Disposition", "attachment; filename=comic.pdf");
        res.setHeader("Content-Type", "application/pdf");
        const doc = new PDFDocument({ autoFirstPage: false });
        doc.pipe(res);

        const chapterBrowser = await puppeteer.launch({ headless: "new" });

        for (const chapter of selectedChapters) {
            console.log(`📖 Scraping: ${chapter.title}`);
            const chapterPage = await chapterBrowser.newPage();
            await chapterPage.goto(chapter.url, { waitUntil: "domcontentloaded" });

            let imageSelector = siteType === "aquareader" ? "img.wp-manga-chapter-img" : "img[src]";
            let imageFilter = siteType === "kingofshojo" ? "kingofshojo.com/wp-content/uploads/manga/" : "";

            const imageUrls = await chapterPage.evaluate((imageSelector, imageFilter) => {
                return Array.from(document.querySelectorAll(imageSelector))
                    .map(img => img.dataset.src || img.src)
                    .filter(url => imageFilter ? url.includes(imageFilter) : true);
            }, imageSelector, imageFilter);

            console.log(`✅ Found ${imageUrls.length} images for ${chapter.title}`);

            if (imageUrls.length === 0) {
                doc.addPage().fontSize(16).text(`⚠️ No images found for ${chapter.title}`);
            } else {
                for (let i = 0; i < imageUrls.length; i++) {
                    const imageUrl = imageUrls[i];
                    console.log(`📥 Downloading: ${imageUrl}`);

                    try {
                        const response = await axios({ url: imageUrl, responseType: "arraybuffer" });
                        const imageBuffer = await sharp(response.data).toFormat("png").toBuffer();

                        const img = doc.openImage(imageBuffer);
                        doc.addPage({ size: [img.width, img.height] });
                        doc.image(img, 0, 0, { width: img.width, height: img.height });

                    } catch (imgError) {
                        console.error(`🚨 Error processing image ${imageUrl}:`, imgError);
                    }
                }
            }

            await chapterPage.close();
            doc.addPage();
        }

        await chapterBrowser.close();
        doc.end();
        console.log("✅ PDF generation completed!");

    } catch (error) {
        console.error("🚨 Scraping Error:", error);
        res.status(500).json({ error: "Failed to process the comic. Please try again." });
    }
});

app.listen(5000, () => console.log("✅ Server running on port 5000"));
