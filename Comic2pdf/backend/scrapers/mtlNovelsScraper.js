const express = require('express');
const axios = require('axios'); // ✅ Fetch HTML
const cheerio = require('cheerio'); // ✅ Parse HTML
const puppeteer = require('puppeteer'); // ✅ Scrape chapter content
const PDFDocument = require('pdfkit');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/scrape-multiple', async (req, res) => {
    let { novelUrl, startChapter, endChapter } = req.body;

    if (!novelUrl.includes('mtlnovels.com')) {
        return res.status(400).json({ error: 'Invalid MTL Novels URL' });
    }

    try {
        // ✅ Step 1: Convert "Main Novel Page" to "Chapter List Page" if needed
        if (!novelUrl.endsWith('/chapter-list/')) {
            console.log('🔄 Detected Main Novel Page, Finding Chapter List URL...');
            const { data } = await axios.get(novelUrl);
            const $ = cheerio.load(data);

            // ✅ Find the Table of Contents (TOC) link
            const tocLink = $('a.toc, a[href*="/chapter-list/"]').attr('href');
            if (tocLink) {
                novelUrl = new URL(tocLink, novelUrl).href; // Convert relative to absolute URL
                console.log(`✅ Redirected to TOC: ${novelUrl}`);
            } else {
                return res.status(400).json({ error: 'Chapter List page not found!' });
            }
        }

        // ✅ Step 2: Fetch the Table of Contents page
        console.log(`🔍 Fetching Table of Contents: ${novelUrl}`);
        const { data } = await axios.get(novelUrl);
        const $ = cheerio.load(data);

        // ✅ Step 3: Extract only actual chapter links
        let chapterLinks = [];
        $('a[href*="/chapter-"]').each((i, el) => {
            const text = $(el).text().trim();
            const url = $(el).attr('href');

            // ✅ Keep only real chapters (ignore translations, "Start Reading," etc.)
            if (text.match(/Chapter \d+/) && url) {
                chapterLinks.push({ text, url });
            }
        });

        console.log(`✅ Found ${chapterLinks.length} valid chapters`);

        if (chapterLinks.length === 0) {
            return res.status(400).json({ error: 'No valid chapters found. Check the website structure.' });
        }

        // ✅ Step 4: Sort and select the correct chapters
        chapterLinks.sort((a, b) => {
            const numA = parseInt(a.text.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.text.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });

        const selectedChapters = chapterLinks.slice(startChapter - 1, endChapter);

        if (selectedChapters.length === 0) {
            return res.status(400).json({ error: 'Invalid chapter range' });
        }

        console.log(`✅ Downloading chapters ${startChapter} to ${endChapter}`);

        // ✅ Step 5: Start Puppeteer for Scraping Content
        const browser = await puppeteer.launch({ headless: true });
        const doc = new PDFDocument();
        res.setHeader('Content-Disposition', 'attachment; filename=novel.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        for (const chapter of selectedChapters) {
            const chapterPage = await browser.newPage();
            await chapterPage.goto(chapter.url, { waitUntil: 'domcontentloaded' });

            const content = await chapterPage.evaluate(async () => {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for dynamic content

                let selectors = ['.par.fontsize-16', '.chapter-content p', '.entry-content p', '.text-left p'];
                for (let selector of selectors) {
                    let paragraphs = document.querySelectorAll(selector);
                    let extractedText = Array.from(paragraphs)
                        .map(p => p.innerText.trim())
                        .filter(text => text.length > 0)
                        .join('\n\n');

                    if (extractedText.length > 0) {
                        return extractedText;
                    }
                }

                return ''; // Return empty if nothing was found
            });

            console.log(`✅ Scraped content for ${chapter.text}:`, content.substring(0, 100)); // Debugging

            if (!content || content.trim().length === 0) {
                console.error(`⚠️ No content found for ${chapter.text}!`);
                doc.addPage().fontSize(14).text(`⚠️ Failed to load ${chapter.text}\n`);
            } else {
                doc.addPage().fontSize(14).text(`Chapter: ${chapter.text}\n\n${content}`);
            }

            await chapterPage.close();
        }

        await browser.close();
        doc.end();
        console.log('✅ PDF generation completed!');

    } catch (error) {
        console.error('🚨 Scraping Error:', error);
        res.status(500).json({ error: 'Failed to scrape novel' });
    }
});

const PORT = process.env.PORT || 5000; // ✅ Auto-assign port
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

