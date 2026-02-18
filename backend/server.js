const express = require("express");
const cors = require("cors");
const PDFService = require("./src/services/PDFService");
const MangaController = require("./src/controllers/MangaController");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Initialize PDF Service (loads async dependencies)
PDFService.init().catch(err => console.error("Failed to init PDF Service:", err));

// Routes
app.post("/get-chapters", MangaController.getChapters);
app.post("/scrape-comic", MangaController.scrapeComic);
app.post("/get-chapter-images", MangaController.getChapterImages);
app.post("/search-manga", MangaController.searchManga);

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
