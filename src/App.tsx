import React, { useState, ChangeEvent, FormEvent } from "react"; // Import ChangeEvent and FormEvent types
import { motion } from "framer-motion";
import { Download, BookOpen, Loader, CheckCircle, AlertTriangle, List } from "lucide-react";

// Define an interface for your chapter data structure
interface Chapter {
  title: string;
  // Add other properties if your chapter objects have them (e.g., url: string;)
  // id: string | number; // It's generally better to use a stable ID for keys if available
}


function App() {
  const [mangaUrl, setMangaUrl] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]); // <-- Type the state variable
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: string, message: string }>({ type: "", message: "" }); // <-- Type the status state
  const [siteType, setSiteType] = useState<string | null>(null); // <-- Type the siteType state

  // Helper function to get error message from unknown type
  const getErrorMessage = (error: unknown): string => {
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
          <p className="text-gray-400">Download any comic as PDFs.</p>
        </div>

        <form className="space-y-6" onSubmit={handleDownload}> {/* Add onSubmit to form */}
          <div>
            <label htmlFor="manga-url" className="block text-sm font-medium text-gray-300 mb-2">Enter Manga URL</label> {/* Added htmlFor */}
            <input
              type="url"
              id="manga-url" // Added id
              value={mangaUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMangaUrl(e.target.value)} // <-- Type the event
              placeholder="Enter the comic interface URL Example: https://kingofshojo.com/manga/solo-leveling/"
              className="block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <button
            type="button" // Keep type="button" if you don't want this to submit the form normally
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
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedStart(e.target.value)} // <-- Type the event
                className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                {/* Ensure chapter is typed as Chapter */}
                {chapters.map((chapter: Chapter) => (
                  // Using title as key - ideally use a unique ID if available in your data
                  <option key={chapter.title} value={chapter.title}>{chapter.title}</option>
                ))}
              </select>
              <select
                value={selectedEnd}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedEnd(e.target.value)} // <-- Type the event
                className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                 {/* Ensure chapter is typed as Chapter */}
                {chapters.map((chapter: Chapter) => (
                   // Using title as key - ideally use a unique ID if available in your data
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
            {loading ? <Loader className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
            {loading ? "Converting..." : "Download PDF"}
          </button>
        </form>

        {/* Display Status Messages */}
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
