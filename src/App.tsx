import React, { useState, ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import { Download, Loader, List, Search } from "lucide-react"; // Added Search icon

// Define an interface for your chapter data structure
interface Chapter {
  title: string;
  // url: string; // Example: if you also store URLs directly with chapters
}

// Define an interface for search results
interface SearchResult {
  title: string;
  url: string;
}

function App() {
  const [mangaUrl, setMangaUrl] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");
  const [loading, setLoading] = useState(false); // Used for chapter fetching & PDF generation
  const [status, setStatus] = useState<{ type: string, message: string }>({ type: "", message: "" });
  const [siteType, setSiteType] = useState<string | null>(null);

  // New state variables for manga search
  const [mangaName, setMangaName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false); // To track if a search has been made

  // Helper function to get error message from unknown type
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred.';
  };

  // Function to handle manga search
  const handleSearchManga = async () => {
    if (mangaName.trim() === "") return;

    setIsSearching(true);
    setSearchResults([]);
    setSearchAttempted(true); // Mark that a search has been attempted
    setStatus({ type: "", message: "" }); // Clear previous general statuses

    try {
      // Assuming backend is running on localhost:5000
      const response = await fetch("http://localhost:5000/search-manga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaName, site: "kingofshojo" }), // Site is fixed for now
      });

      if (!response.ok) {
        const errorBody = await response.json(); // Assuming server sends JSON error
        throw new Error(errorBody.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      // data.error should ideally be caught by !response.ok if the server correctly sets status codes for JSON error responses.
      // However, an explicit check can be a fallback.
      if (data.error) {
        throw new Error(data.error);
      }

      setSearchResults(data as SearchResult[]); // Assuming data is SearchResult[]
      if (data.length === 0) {
        // Optional: set a status if needed, though "No results found" is handled by conditional rendering
        // setStatus({ type: "info", message: "No manga found matching your search." });
      }
      // No specific status message for successful search, results display is the feedback

    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setStatus({ type: "error", message: `Search failed: ${message}` });
      setSearchResults([]); // Clear results on error
    } finally {
      setIsSearching(false);
    }
  };
      if (error instanceof Error) {
          return error.message;
      }
      // You could add more checks here if you expect other error shapes
      return 'An unknown error occurred.';
  };


  // Fetch chapters based on URL
  const fetchChapters = async () => {
    setStatus({ type: "", message: "" });

    try {
      setLoading(true);
      // Note: Using http://localhost:5000. Remember to update this to your
      // Firebase Function URL or other backend URL when deploying.
      const response = await fetch("http://localhost:5000/get-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaUrl }),
      });

      // Check if the response itself was not ok (e.g., 404, 500 status)
      if (!response.ok) {
         // Attempt to read error from body if possible, or use status text
         const errorBody = await response.text(); // or .json() if your server sends JSON errors
         throw new Error(`Server responded with status ${response.status}: ${errorBody || response.statusText}`);
      }


      const data = await response.json();
      // Assuming your backend sends { error: string } for business logic errors
      if (data.error) {
          throw new Error(data.error);
      }

      // Assuming data.chapters is an array matching the Chapter interface
      if (!Array.isArray(data.chapters)) {
           throw new Error("Invalid response format: chapters not found or not an array.");
      }
      // You might add further checks here to ensure chapters match the Chapter interface structure

      setChapters(data.chapters as Chapter[]); // Cast if necessary based on how precise you checked above
      setSelectedStart(data.chapters[0]?.title || "");
      setSelectedEnd(data.chapters[data.chapters.length - 1]?.title || "");
      setSiteType(data.siteType || null); // Ensure siteType is string or null
      setStatus({ type: "success", message: "Chapters loaded successfully!" });
    } catch (err: unknown) { // <-- Type the catch variable as unknown
      setStatus({ type: "error", message: getErrorMessage(err) || "Failed to fetch chapters" }); // <-- Use the helper function
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF download
  const handleDownload = async (e: FormEvent) => { // <-- Type the event parameter
    e.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      setLoading(true);
      // Note: Using http://localhost:5000. Remember to update this to your
      // Firebase Function URL or other backend URL when deploying.
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
      // Clean up the blob URL after use
      window.URL.revokeObjectURL(link.href);

      setStatus({ type: "success", message: "PDF downloaded successfully!" });
    } catch (err: unknown) { // <-- Type the catch variable as unknown
      setStatus({ type: "error", message: getErrorMessage(err) || "Failed to process the comic. Please try again." }); // <-- Use the helper function
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
          <p className="text-gray-400">Search for manga or enter a URL to download chapters as PDFs.</p>
        </div>

        {/* Manga Search Section */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="manga-name-search" className="block text-sm font-medium text-gray-300 mb-2">
              Search Manga Name (KingofShojo only)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="manga-name-search"
                value={mangaName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setMangaName(e.target.value);
                  setSearchAttempted(false); // Reset search attempted when user types
                  setSearchResults([]); // Clear previous results when user types
                }}
                placeholder="E.g., My Happy Marriage"
                className="block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={handleSearchManga}
                disabled={isSearching || mangaName.trim() === ""}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                style={{ minWidth: '120px' }} // Ensure button width is consistent
              >
                {isSearching ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" /> Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" /> Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Display Search Results */}
          {isSearching && searchResults.length === 0 && (
             <div className="text-center text-gray-400">Searching for manga...</div>
          )}
          {!isSearching && searchAttempted && searchResults.length === 0 && (
            <div className="text-center text-gray-400 bg-gray-700 p-3 rounded-lg">No results found for "{mangaName}". Try a different name.</div>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-2 bg-gray-750 p-4 rounded-lg max-h-60 overflow-y-auto">
              <h3 className="text-md font-semibold text-gray-200 mb-2">Search Results:</h3>
              {searchResults.map((result) => (
                <div key={result.url} className="p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                  <p className="font-medium text-blue-300">{result.title}</p>
                  <button
                    onClick={() => {
                      setMangaUrl(result.url);
                      setSearchResults([]); // Clear results
                      setMangaName(""); // Clear search input
                      setSearchAttempted(false);
                      // Optionally, trigger fetchChapters directly or let user click "Fetch Chapters"
                      // fetchChapters(); // If you want to auto-fetch after selection
                    }}
                    className="text-sm text-purple-400 hover:text-purple-300 mt-1"
                  >
                    Use this URL
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* End Manga Search Section */}

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
            disabled={loading || !mangaUrl.trim()} // Also disable if mangaUrl is empty
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading && !isSearching ? <Loader className="animate-spin h-5 w-5" /> : <List className="h-5 w-5" />}
            {loading && !isSearching ? "Loading Chapters..." : "Fetch Chapters"}
          </button>

          {chapters.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <select
                value={selectedStart}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedStart(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                {chapters.map((chapter) => (
                  <option key={chapter.title} value={chapter.title}>{chapter.title}</option>
                ))}
              </select>
              <select
                value={selectedEnd}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedEnd(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                {chapters.map((chapter) => (
                  <option key={chapter.title} value={chapter.title}>{chapter.title}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit" // Keep type="submit" as the form has an onSubmit handler
            disabled={loading || chapters.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading && !isSearching ? <Loader className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
            {loading && !isSearching ? "Converting..." : "Download PDF"}
          </button>
        </form>

        {/* Display Status Messages - including search status */}
         {status.message && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`mt-4 p-3 rounded-lg text-sm text-center ${
                   status.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                }`}
             >
               {status.message}
             </motion.div>
         )}


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
