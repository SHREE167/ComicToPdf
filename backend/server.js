const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");
const cors = require("cors");

// Use puppeteer-extra with stealth plugin
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

// Use Railway-compatible Chromium
const chromium = require("@sparticuz/chromium");

const app = express();
app.use(cors({
  origin: [
    "https://comic-to-pdf.vercel.app",
    "https://comictopdf-production.up.railway.app"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Async function to launch Puppeteer with our custom Chromium
async function launchBrowser() {
  const execPath = await chromium.executablePath();
  console.log("Chromium executable path:", execPath);
  if (!execPath) {
    throw new Error("Could not determine Chromium executable path");
  }
  return await puppeteerExtra.launch({
    headless: "new",
    executablePath: execPath,
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: chromium.defaultViewport,
  });
}

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
    console.log(`🔍 [get-chapters] Fetching from: ${mangaUrl} (${siteType})`);
    const browser = await launchBrowser();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
    );
    // Disable built-in timeout (set timeout: 0) and rely on waitForSelector timeout
    await page.goto(mangaUrl, { waitUntil: "domcontentloaded", timeout: 0 });
    
    // Wait for chapter elements to load (adjust selector based on site)
    if (siteType === "aquareader") {
      await page.waitForSelector("ul.sub-chap-list li.wp-manga-chapter a", { timeout: 120000 });
    } else {
      await page.waitForSelector("div.eph-num a", { timeout: 120000 });
    }
    
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

    console.log(`✅ [get-chapters] Found ${chapters.length} chapters`);
    return res.json({ chapters, siteType });
  } catch (error) {
    console.error("🚨 [get-chapters] Error:", error);
    res.status(500).json({ error: "Failed to fetch chapters" });
  }
});

/**
 * API to scrape images from selected chapters and generate a PDF.
 */
app.post("/scrape-comic", async (req, res) => {
  const { mangaUrl, startChapter, endChapter } = req.body;
  if (!mangaUrl) {
    return res.status(400).json({ error: "Manga URL is required!" });
  }

  try {
    console.log(`📥 [scrape-comic] Request: ${mangaUrl} | Chapters: ${startChapter} to ${endChapter}`);
    const browser = await launchBrowser();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
    );
    await page.goto(mangaUrl, { waitUntil: "domcontentloaded", timeout: 0 });
    await page.waitForSelector("ul.sub-chap-list li.wp-manga-chapter a", { timeout: 120000 });
    const allChapters = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("ul.sub-chap-list li.wp-manga-chapter a"))
        .map(link => ({
          title: link.innerText.trim(),
          url: link.href,
        }))
        .reverse();
    });
    await browser.close();

    if (allChapters.length === 0) {
      return res.status(400).json({ error: "No chapters found!" });
    }
    console.log(`✅ [scrape-comic] Found ${allChapters.length} chapters`);

    // Filter chapters by range (assumes startChapter and endChapter are chapter titles)
    const parseChapterNumber = (title) => parseInt(title.replace(/[^0-9]/g, ""), 10) || 0;
    const numericStart = parseChapterNumber(startChapter);
    const numericEnd = parseChapterNumber(endChapter);
    const selectedChapters = allChapters.filter(ch => {
      const num = parseChapterNumber(ch.title);
      return num >= numericStart && num <= numericEnd;
    });
    if (selectedChapters.length === 0) {
      return res.status(400).json({ error: "Invalid chapter range selected." });
    }
    console.log("✅ [scrape-comic] Selected Chapter URLs:", selectedChapters.map(ch => ch.url));

    // Prepare PDF response
    res.setHeader("Content-Disposition", "attachment; filename=comic.pdf");
    res.setHeader("Content-Type", "application/pdf");
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(res);

    // Launch one browser for scraping all selected chapters
    const chapterBrowser = await launchBrowser();
    for (const chapter of selectedChapters) {
      console.log(`📖 [scrape-comic] Scraping chapter: ${chapter.title}`);
      const chapterPage = await chapterBrowser.newPage();
      chapterPage.setDefaultNavigationTimeout(120000);
      await chapterPage.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
      );
      await chapterPage.goto(chapter.url, { waitUntil: "domcontentloaded", timeout: 0 });
      await chapterPage.waitForSelector("img.wp-manga-chapter-img", { timeout: 120000 });
      const imageUrls = await chapterPage.evaluate(() => {
        return Array.from(document.querySelectorAll("img.wp-manga-chapter-img"))
          .map(img => img.dataset.src || img.src);
      });
      console.log(`✅ [scrape-comic] Found ${imageUrls.length} images for ${chapter.title}`);
      if (imageUrls.length === 0) {
        doc.addPage().fontSize(16).text(`⚠️ No images found for ${chapter.title}`);
      } else {
        for (const imageUrl of imageUrls) {
          console.log(`📥 [scrape-comic] Downloading image: ${imageUrl}`);
          try {
            const response = await axios({ url: imageUrl, responseType: "arraybuffer" });
            let imageBuffer;
            try {
              imageBuffer = await sharp(response.data).toFormat("png").toBuffer();
            } catch (imgProcessingError) {
              console.warn(`⚠️ [scrape-comic] Image processing failed for ${imageUrl}, using raw image.`);
              imageBuffer = response.data;
            }
            const img = doc.openImage(imageBuffer);
            doc.addPage({ size: [img.width, img.height] });
            doc.image(img, 0, 0, { width: img.width, height: img.height });
          } catch (imgError) {
            console.error(`🚨 [scrape-comic] Error processing image ${imageUrl}:`, imgError);
          }
        }
      }
      await chapterPage.close();
      // Blank page between chapters
      doc.addPage();
    }
    await chapterBrowser.close();
    doc.end();
    console.log("✅ [scrape-comic] PDF generation completed!");
  } catch (error) {
    console.error("🚨 [scrape-comic] Error:", error);
    res.status(500).json({ error: "Failed to process the comic. Please try again." });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
