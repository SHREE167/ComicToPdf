import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, BookOpen, Loader, CheckCircle, AlertTriangle, List } from "lucide-react";

function App() {
  const [mangaUrl, setMangaUrl] = useState("");
  const [chapters, setChapters] = useState([]);
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [siteType, setSiteType] = useState(null);

  const backendUrl = "https://comictopdf-production.up.railway.app"; // ✅ Base URL

// Fetch chapters based on URL
const fetchChapters = async () => {
  setStatus({ type: "", message: "" });

  try {
    setLoading(true);
    const response = await fetch(`${backendUrl}/get-chapters`, {  // ✅ Correct endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mangaUrl }),
    });

    if (!response.ok) throw new Error("Failed to fetch chapters");

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    setChapters(data.chapters);
    setSelectedStart(data.chapters[0]?.title || "");
    setSelectedEnd(data.chapters[data.chapters.length - 1]?.title || "");
    setSiteType(data.siteType);
    setStatus({ type: "success", message: "Chapters loaded successfully!" });
  } catch (err) {
    setStatus({ type: "error", message: err.message || "Failed to fetch chapters" });
  } finally {
    setLoading(false);
  }
};

// Handle PDF download
const handleDownload = async (e) => {
  e.preventDefault();
  setStatus({ type: "", message: "" });

  try {
    setLoading(true);
    const response = await fetch(`${backendUrl}/scrape-comic`, {  // ✅ Correct endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        mangaUrl, 
        startChapter: selectedStart, 
        endChapter: selectedEnd 
      }),
    });

    if (!response.ok) throw new Error("Failed to fetch PDF");

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "comic.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatus({ type: "success", message: "PDF downloaded successfully!" });
  } catch (err) {
    setStatus({ type: "error", message: "Failed to process the comic. Please try again." });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-xl w-full bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            className="text-3xl font-bold text-blue-400 mb-2"
          >
            📖 Comic to PDF Converter
          </motion.h1>
          <p className="text-gray-400">Download any comic as PDFs.</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Enter Manga URL</label>
            <input
              type="url"
              value={mangaUrl}
              onChange={(e) => setMangaUrl(e.target.value)}
              placeholder="Enter the novel interface URL Example: https://kingofshojo.com/manga/solo-leveling/"
              className="block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <button
            type="button"
            onClick={fetchChapters}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin h-5 w-5" /> : <List className="h-5 w-5" />}
            {loading ? "Loading Chapters..." : "Fetch Chapters"}
          </button>

          {chapters.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <select
                value={selectedStart}
                onChange={(e) => setSelectedStart(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                {chapters.map((chapter) => (
                  <option key={chapter.title} value={chapter.title}>{chapter.title}</option>
                ))}
              </select>
              <select
                value={selectedEnd}
                onChange={(e) => setSelectedEnd(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                {chapters.map((chapter) => (
                  <option key={chapter.title} value={chapter.title}>{chapter.title}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            onClick={handleDownload}
            disabled={loading || chapters.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
            {loading ? "Converting..." : "Download PDF"}
          </button>
        </form>

        <div className="mt-6 text-gray-400 text-sm text-center">
          <p>1️⃣ Paste the comic, manhwa, or manhua link above and fetch the chapter.</p>
          <p>2️⃣ Select the start and end chapters, download the PDF, and enjoy reading! 📖</p>
          <p>3️⃣ Currently supports URLs from aquareader.net and kingofshojo.com.</p>
        </div>
      </motion.div>
    </div>
  );
}

export default App;