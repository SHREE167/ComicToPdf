const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function verifyBackend() {
    console.log("🚀 Starting Backend Verification...");

    try {
        // 1. Test /get-chapters (KingOfShojo)
        console.log("\n1. Testing /get-chapters (KingOfShojo)...");
        const mangaUrl = "https://kingofshojo.com/manga/i-became-the-male-leads-adopted-daughter/";
        const chaptersResponse = await axios.post(`${BASE_URL}/get-chapters`, { mangaUrl });
        
        if (chaptersResponse.status === 200 && chaptersResponse.data.chapters.length > 0) {
            console.log("✅ /get-chapters verified!");
            console.log(`   Found ${chaptersResponse.data.chapters.length} chapters.`);
            
            // 2. Test /get-chapter-images using the first chapter found
            const firstChapter = chaptersResponse.data.chapters[0];
            console.log(`\n2. Testing /get-chapter-images for: ${firstChapter.title}...`);
            const imagesResponse = await axios.post(`${BASE_URL}/get-chapter-images`, { 
                chapterUrl: firstChapter.url 
            });

            if (imagesResponse.status === 200 && imagesResponse.data.imageUrls.length > 0) {
                console.log("✅ /get-chapter-images verified!");
                console.log(`   Found ${imagesResponse.data.imageUrls.length} images.`);
            } else {
                console.error("❌ /get-chapter-images failed or returned no images.");
                 process.exit(1);
            }

        } else {
            console.error("❌ /get-chapters failed or returned no chapters.");
            process.exit(1);
        }

        console.log("\n🎉 Backend Verification Successful!");

    } catch (error) {
        console.error("\n❌ Verification Failed:", error.message);
        if (error.response) {
            console.error("   Server Response:", error.response.data);
        }
        process.exit(1);
    }
}

verifyBackend();
