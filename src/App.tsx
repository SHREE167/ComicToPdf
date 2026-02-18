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
    <div className="min-h-screen bg-cyber-black text-neon-silver flex flex-col items-center justify-center p-6 space-y-6 font-rajdhani relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-cyber-black to-cyber-black"></div>

      {readingChapterUrl && (
        <ComicReader chapterUrl={readingChapterUrl} siteType={siteType} onClose={() => setReadingChapterUrl(null)} />
      )}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-xl w-full bg-cyber-gray/80 backdrop-blur-md rounded-xl shadow-neon-blue border border-neon-blue/30 p-8 z-10"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, textShadow: "0 0 10px #00f3ff" }}
            transition={{ duration: 1.5 }}
            className="text-4xl font-bold font-orbitron text-neon-blue mb-2 tracking-wider"
          >
            COMIC TO PDF
          </motion.h1>
          <p className="text-gray-400 font-rajdhani text-lg">Cyber-Enhanced Manga Archival System</p>
        </div>

        <SearchBar
          onSelectUrl={(url) => setMangaUrl(url)}
          onError={(msg) => setStatus({ type: 'error', message: msg })}
        />

        <form className="space-y-6" onSubmit={handleDownload}>
          <div>
            <label htmlFor="manga-url" className="block text-sm font-bold text-neon-silver mb-2 font-orbitron tracking-wide">
              MANGA URL
            </label>
            <input
              type="url"
              id="manga-url"
              value={mangaUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMangaUrl(e.target.value)}
              placeholder="Enter direct URL..."
              className="block w-full px-4 py-3 bg-cyber-dark text-neon-silver border border-gray-700 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:shadow-neon-blue transition-all duration-300 placeholder-gray-600 font-mono"
              required
            />
          </div>

          <button
            type="button"
            onClick={fetchChapters}
            disabled={loading || !mangaUrl.trim()}
            className="w-full group relative flex items-center justify-center gap-2 py-3 px-4 bg-transparent border border-neon-blue text-neon-blue rounded-lg overflow-hidden transition-all duration-300 hover:bg-neon-blue hover:text-cyber-black hover:shadow-neon-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-2 font-bold font-orbitron">
              {loading ? <Loader className="animate-spin h-5 w-5" /> : <List className="h-5 w-5" />}
              {loading ? "INITIALIZING..." : "FETCH CHAPTERS"}
            </span>
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
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neon-purple/10 border border-neon-purple text-neon-purple rounded-lg hover:bg-neon-purple hover:text-white hover:shadow-neon-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2 font-bold font-orbitron">
              {loading ? <Loader className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
              {loading ? "PROCESSING..." : "DOWNLOAD PDF"}
            </span>
          </button>
        </form>

        <StatusMessage status={status} />

        <div className="mt-8 text-gray-500 text-xs text-center font-mono border-t border-gray-800 pt-4">
          <p>SYSTEM STATUS: ONLINE</p>
          <p>SUPPORTED PROTOCOLS: AQUAREADER // KINGOFSHOJO</p>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
