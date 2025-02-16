const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// ✅ Launch Puppeteer with Chromium
async function launchBrowser() {
  const execPath = await chromium.executablePath();
  console.log("Chromium executable path:", execPath);
  if (!execPath) throw new Error("Could not determine Chromium executable path");

  return await puppeteer.launch({
    headless: "new",
    executablePath: execPath,
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: chromium.defaultViewport,
  });
}

/**
 * ✅ Fetch available chapter links from AquaReader or KingOfShojo.
 */
app.post("/get-chapters", async (req, res) => {
  const { mangaUrl } = req.body;
  if (!mangaUrl) return res.status(400).json({ error: "Manga URL is required!" });

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

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(mangaUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    let chapters = [];
    if (siteType === "aquareader") {
      chapters = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("ul.sub-chap-list li.wp-manga-chapter a")).map(link => ({
          title: link.innerText.trim(),
          url: link.href,
        })).reverse();
      });
    } else if (siteType === "kingofshojo") {
      chapters = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.eph-num a")).map(link => ({
          title: link.innerText.trim(),
          url: link.href,
        })).reverse();
      });
    }

    await browser.close();

    if (chapters.length === 0) return res.status(400).json({ error: "No chapters found! The website structure may have changed." });

    console.log(`✅ Found ${chapters.length} chapters`);
    return res.json({ chapters, siteType });
  } catch (error) {
    console.error("🚨 Error fetching chapters:", error);
    res.status(500).json({ error: "Failed to fetch chapters" });
  }
});

/**
 * ✅ Scrape images and generate a PDF.
 */
app.post("/scrape-comic", async (req, res) => {
  const { mangaUrl, startChapter, endChapter } = req.body;
  if (!mangaUrl) return res.status(400).json({ error: "Manga URL is required!" });

  try {
    console.log(`📥 Processing request: ${mangaUrl} | Chapters: ${startChapter} to ${endChapter}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(mangaUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    let allChapters = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("ul.sub-chap-list li.wp-manga-chapter a")).map(link => ({
        title: link.innerText.trim(),
        url: link.href,
      })).reverse();
    });

    await browser.close();
    if (allChapters.length === 0) return res.status(400).json({ error: "No chapters found!" });

    console.log(`✅ Found ${allChapters.length} chapters`);

    // ✅ Prepare PDF response
    res.setHeader("Content-Disposition", "attachment; filename=comic.pdf");
    res.setHeader("Content-Type", "application/pdf");
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(res);

    const chapterBrowser = await launchBrowser();
    for (const chapter of allChapters) {
      console.log(`📖 Scraping: ${chapter.title}`);
      const chapterPage = await chapterBrowser.newPage();
      await chapterPage.goto(chapter.url, { waitUntil: "domcontentloaded", timeout: 60000 });

      const imageUrls = await chapterPage.evaluate(() => {
        return Array.from(document.querySelectorAll("img.wp-manga-chapter-img")).map(img => img.dataset.src || img.src);
      });

      console.log(`✅ Found ${imageUrls.length} images for ${chapter.title}`);

      if (imageUrls.length === 0) {
        doc.addPage().fontSize(16).text(`⚠️ No images found for ${chapter.title}`);
      } else {
        for (const imageUrl of imageUrls) {
          console.log(`📥 Downloading: ${imageUrl}`);
          try {
            const response = await axios({ url: imageUrl, responseType: "arraybuffer" });
            let imageBuffer;
            try {
              imageBuffer = await sharp(response.data).toFormat("png").toBuffer();
            } catch (imgProcessingError) {
              console.warn(`⚠️ Image processing failed: ${imageUrl}, using raw image.`);
              imageBuffer = response.data;
            }

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

// ✅ Ensure server is running
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
