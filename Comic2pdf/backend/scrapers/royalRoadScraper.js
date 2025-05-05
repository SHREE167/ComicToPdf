const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeRoyalRoad(novelUrl, startChapter, endChapter) {
    try {
        console.log(`🔍 Fetching Table of Contents: ${novelUrl}`);
        const { data } = await axios.get(novelUrl);
        const $ = cheerio.load(data);

        // ✅ Extract chapter links
        let chapterLinks = [];
        $('tr.chapter-row a').each((i, el) => {
            const text = $(el).text().trim();
            const url = new URL($(el).attr('href'), 'https://www.royalroad.com').href; // ✅ Convert to absolute URL

            if (text.match(/^\d+\./)) { // ✅ Ensure it's a valid chapter (starts with a number)
                chapterLinks.push({ text, url });
            }
        });

        console.log(`✅ Found ${chapterLinks.length} valid chapters`);

        if (chapterLinks.length === 0) {
            return { error: 'No valid chapters found. Check the website structure.' };
        }

        // ✅ Sort and select chapters
        chapterLinks.sort((a, b) => {
            const numA = parseInt(a.text.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.text.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });

        const selectedChapters = chapterLinks.slice(startChapter - 1, endChapter);
        if (selectedChapters.length === 0) {
            return { error: 'Invalid chapter range' };
        }

        return await scrapeChapters(selectedChapters);
    } catch (error) {
        console.error('🚨 RoyalRoad Scraping Error:', error);
        return { error: 'Failed to scrape RoyalRoad' };
    }
}

async function scrapeChapters(chapters) {
    let scrapedData = [];

    for (const chapter of chapters) {
        const { data } = await axios.get(chapter.url);
        const $ = cheerio.load(data);

        // ✅ Extract the main content from the chapter page
        const content = $('.chapter-content').text().trim();
        if (content.length > 0) {
            scrapedData.push({ title: chapter.text, content });
        } else {
            console.error(`⚠️ No content found for ${chapter.text}!`);
        }
    }

    return scrapedData;
}

module.exports = scrapeRoyalRoad;
