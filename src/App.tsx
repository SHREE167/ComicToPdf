import { useState, FormEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Download, Loader, List } from "lucide-react";
import ComicReader from "./ComicReader";
import SearchBar from "./components/SearchBar";
import ChapterSelectors, { Chapter } from "./components/ChapterSelectors";
import StatusMessage from "./components/StatusMessage";

function App() {
  const [mangaUrl, setMangaUrl] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: string, message: string }>({ type: "", message: "" });
  const [siteType, setSiteType] = useState<string | null>(null);
  const [readingChapterUrl, setReadingChapterUrl] = useState<string | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred.';
  };

  const fetchChapters = async () => {
    setStatus({ type: "", message: "" });

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/get-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaUrl }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorBody || response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (!Array.isArray(data.chapters)) {
        throw new Error("Invalid response format: chapters not found or not an array.");
      }

      setChapters(data.chapters as Chapter[]);
      setSelectedStart(data.chapters[0]?.title || "");
      setSelectedEnd(data.chapters[data.chapters.length - 1]?.title || "");
      setSiteType(data.siteType || null);
      setStatus({ type: "success", message: "Chapters loaded successfully!" });
    } catch (err: unknown) {
      setStatus({ type: "error", message: getErrorMessage(err) || "Failed to fetch chapters" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: FormEvent) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/scrape-comic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaUrl, startChapter: selectedStart, endChapter: selectedEnd }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorBody || response.statusText}`);
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "comic.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      setStatus({ type: "success", message: "PDF downloaded successfully!" });
    } catch (err: unknown) {
      setStatus({ type: "error", message: getErrorMessage(err) || "Failed to process the comic. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-6">
      {readingChapterUrl && (
        <ComicReader chapterUrl={readingChapterUrl} siteType={siteType} onClose={() => setReadingChapterUrl(null)} />
      )}
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
          <p className="text-gray-400">Search for manga or enter a URL to download chapters as PDFs.</p>
        </div>

        <SearchBar
          onSelectUrl={(url) => setMangaUrl(url)}
          onError={(msg) => setStatus({ type: 'error', message: msg })}
        />

        <form className="space-y-6" onSubmit={handleDownload}>
          <div>
            <label htmlFor="manga-url" className="block text-sm font-medium text-gray-300 mb-2">
              Enter Manga URL (or select from search results)
            </label>
            <input
              type="url"
              id="manga-url"
              value={mangaUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMangaUrl(e.target.value)}
              placeholder="Enter the comic interface URL or use search above"
              className="block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <button
            type="button"
            onClick={fetchChapters}
            disabled={loading || !mangaUrl.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin h-5 w-5" /> : <List className="h-5 w-5" />}
            {loading ? "Loading Chapters..." : "Fetch Chapters"}
          </button>

          {chapters.length > 0 && (
            <ChapterSelectors
              chapters={chapters}
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              onStartChange={setSelectedStart}
              onEndChange={setSelectedEnd}
              onReadOnline={setReadingChapterUrl}
              loading={loading}
            />
          )}

          <button
            type="submit"
            disabled={loading || chapters.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
            {loading ? "Converting..." : "Download PDF"}
          </button>
        </form>

        <StatusMessage status={status} />

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
