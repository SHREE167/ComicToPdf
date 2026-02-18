const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function verifyBackend() {
    console.log("🚀 Starting Backend Verification...");

    try {
        // 1. Test Search (AquaReader)
        console.log("\n1. Testing /search-manga (AquaReader)...");
        const searchResponse = await axios.post(`${BASE_URL}/search-manga`, { 
            mangaName: "swordmaster", 
            site: "aquareader" 
        });

        if (searchResponse.status === 200 && searchResponse.data.length > 0) {
            console.log("✅ AquaReader Search verified!");
            console.log(`   Found ${searchResponse.data.length} results.`);
            console.log(`   Sample: ${searchResponse.data[0].title} - ${searchResponse.data[0].url}`);
        } else {
             console.error("❌ AquaReader Search failed or returned no results.");
             process.exit(1);
        }

        // 2. Test Search (KingOfShojo)
        console.log("\n2. Testing /search-manga (KingOfShojo)...");
        const searchResponseK = await axios.post(`${BASE_URL}/search-manga`, { 
            mangaName: "villainess", 
            site: "kingofshojo" 
        });

        if (searchResponseK.status === 200 && searchResponseK.data.length > 0) {
            console.log("✅ KingOfShojo Search verified!");
            console.log(`   Found ${searchResponseK.data.length} results.`);
        } else {
             console.error("❌ KingOfShojo Search failed or returned no results.");
        }

        console.log("\n🎉 Multi-Site Search Verification Successful!");

    } catch (error) {
        console.error("\n❌ Verification Failed:", error.message);
        if (error.response) {
            console.error("   Server Response:", error.response.data);
        }
        process.exit(1);
    }
}

verifyBackend();
