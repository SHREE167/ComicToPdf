const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * API to fetch available chapter links using direct HTML parsing.
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
        const response = await axios.get(mangaUrl);
        const html = response.data;
        const $ = cheerio.load(html);
        let chapters = [];

        if (siteType === "aquareader") {
            chapters = $("ul.sub-chap-list li.wp-manga-chapter a")
                .map((i, el) => ({
                    title: $(el).text().trim(),
                    url: $(el).attr("href"),
                }))
                .get()
                .reverse();
        } else if (siteType === "kingofshojo") {
            chapters = $("div.eph-num a")
                .map((i, el) => ({
                    title: $(el).text().trim(),
                    url: $(el).attr("href"),
                }))
                .get()
                .reverse();
        }

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

function extractChapterNumber(title) {
    return parseInt(title.replace(/[^0-9]/g, ""), 10) || 0;
}

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
        const responseMangaPage = await axios.get(mangaUrl);
        const htmlMangaPage = responseMangaPage.data;
        const $manga = cheerio.load(htmlMangaPage);
        let allChapters = [];

        if (siteType === "aquareader") {
            allChapters = $manga("ul.sub-chap-list li.wp-manga-chapter a")
                .map((i, el) => ({
                    title: $manga(el).text().trim(),
                    url: $manga(el).attr("href"),
                }))
                .get()
                .reverse();
        } else if (siteType === "kingofshojo") {
            allChapters = $manga("div.eph-num a")
                .map((i, el) => ({
                    title: $manga(el).text().trim(),
                    url: $manga(el).attr("href"),
                }))
                .get()
                .reverse();
        }

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

        res.setHeader("Content-Disposition", "attachment; filename=comic.pdf");
        res.setHeader("Content-Type", "application/pdf");
        const doc = new PDFDocument({ autoFirstPage: false });
        doc.pipe(res);

        for (const chapter of selectedChapters) {
            console.log(`📖 Scraping images from: ${chapter.title}`);
            try {
                const responseChapterPage = await axios.get(chapter.url);
                const htmlChapterPage = responseChapterPage.data;
                const $chapter = cheerio.load(htmlChapterPage);
                let imageUrls = [];

                if (siteType === "aquareader") {
                    imageUrls = $chapter("img.wp-manga-chapter-img")
                        .map((i, el) => $chapter(el).attr("data-src") || $chapter(el).attr("src"))
                        .get();
                } else if (siteType === "kingofshojo") {
                    imageUrls = $chapter("img[src]")
                        .map((i, el) => $chapter(el).attr("src"))
                        .get()
                        .filter(url => url.includes("kingofshojo.com/wp-content/uploads/manga/"));
                }

                console.log(`✅ Found ${imageUrls.length} images for ${chapter.title}`);

                if (imageUrls.length === 0) {
                    doc.addPage().fontSize(16).text(`⚠️ No images found for ${chapter.title}`);
                } else {
                    for (const imageUrl of imageUrls) {
                        console.log(`📥 Downloading: ${imageUrl}`);
                        try {
                            const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
                            const imageBuffer = await sharp(imageResponse.data).toFormat("png").toBuffer();
                            const img = doc.openImage(imageBuffer);
                            doc.addPage({ size: [img.width, img.height] });
                            doc.image(img, 0, 0, { width: img.width, height: img.height });
                        } catch (imgError) {
                            console.error(`🚨 Error processing image ${imageUrl}:`, imgError);
                        }
                    }
                }
                doc.addPage();
            } catch (chapterError) {
                console.error(`🚨 Error scraping chapter ${chapter.title}:`, chapterError);
                doc.addPage().fontSize(16).text(`⚠️ Error loading chapter ${chapter.title}`);
            }
        }

        doc.end();
        console.log("✅ PDF generation completed!");

    } catch (error) {
        console.error("🚨 Scraping Error:", error);
        res.status(500).json({ error: "Failed to process the comic. Please try again." });
    }
});

// You would deploy this on a Node.js hosting platform like Vercel or Netlify
// (if it stays within their function limits) or a more traditional Node.js host.
// The key change is removing Puppeteer.
app.post("/search-manga", async (req, res) => {
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
        // Based on exploration, search results are in `<a>` tags.
        // For kingofshojo, a relevant selector might be `div.bsx > a` or similar,
        // containing the title and URL.
        $('div.bsx > a').each((i, el) => { // This selector is based on the subtask description.
            const title = $(el).attr('title'); // Or $(el).text().trim();
            const url = $(el).attr('href');
            if (title && url) {
                results.push({ title, url });
            }
        });

        if (results.length === 0) {
            console.log(`⚠️ No results found for "${mangaName}" on ${site}. This could be due to no actual results or a change in website structure.`);
        } else {
            console.log(`✅ Found ${results.length} results for "${mangaName}" on ${site}`);
        }

        return res.json(results); // Return empty array if no results, or the populated array.

    } catch (error) {
        console.error(`🚨 Error searching for manga "${mangaName}" on ${site}:`, error.message);
        // Log more detailed error information
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error Response Data:", error.response.data);
            console.error("Error Response Status:", error.response.status);
            console.error("Error Response Headers:", error.response.headers);
            return res.status(error.response.status).json({ error: `Failed to fetch from ${site}. Site responded with ${error.response.status}` });
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Error Request:", error.request);
            return res.status(500).json({ error: `No response received from ${site} when searching for manga.` });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
            return res.status(500).json({ error: `Failed to search manga on ${site}. An internal error occurred.` });
        }
    }
});

app.post("/get-chapter-images", async (req, res) => {
    const { chapterUrl, siteType } = req.body;

    if (!chapterUrl || !siteType) {
        return res.status(400).json({ error: "Chapter URL and siteType are required!" });
    }

    try {
        console.log(`📖 Scraping images from: ${chapterUrl}`);
        const responseChapterPage = await axios.get(chapterUrl);
        const htmlChapterPage = responseChapterPage.data;
        const $chapter = cheerio.load(htmlChapterPage);
        let imageUrls = [];

        if (siteType === "aquareader") {
            imageUrls = $chapter("img.wp-manga-chapter-img")
                .map((i, el) => $chapter(el).attr("data-src") || $chapter(el).attr("src"))
                .get();
        } else if (siteType === "kingofshojo") {
            imageUrls = $chapter("img[src]")
                .map((i, el) => $chapter(el).attr("src"))
                .get()
                .filter(url => url.includes("kingofshojo.com/wp-content/uploads/manga/"));
        }

        console.log(`✅ Found ${imageUrls.length} images for ${chapterUrl}`);
        return res.json({ imageUrls });
    } catch (error) {
        console.error(`🚨 Error scraping chapter images:`, error);
        res.status(500).json({ error: "Failed to scrape chapter images." });
    }
});

app.listen(5000, () => console.log("✅ Server running on port 5000"));
