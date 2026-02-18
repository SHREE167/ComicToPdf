import { useState, ChangeEvent } from 'react';
import { Search, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  title: string;
  url: string;
}

interface SearchBarProps {
  onSelectUrl: (url: string) => void;
  onError: (message: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectUrl, onError }) => {
  const [mangaName, setMangaName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSearchManga = async () => {
    if (mangaName.trim() === "") return;

    setIsSearching(true);
    setSearchResults([]);
    setSearchAttempted(true);

    try {
      const response = await fetch("http://localhost:5000/search-manga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaName, site: "kingofshojo" }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setSearchResults(data as SearchResult[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      onError(`Search failed: ${message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
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
              setSearchAttempted(false);
              setSearchResults([]);
            }}
            placeholder="E.g., My Happy Marriage"
            className="block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={handleSearchManga}
            disabled={isSearching || mangaName.trim() === ""}
            className="flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            style={{ minWidth: '120px' }}
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

      <AnimatePresence>
        {isSearching && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-gray-400"
          >
            Searching for manga...
          </motion.div>
        )}
        {!isSearching && searchAttempted && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-gray-400 bg-gray-700 p-3 rounded-lg"
          >
            No results found for "{mangaName}". Try a different name.
          </motion.div>
        )}
      </AnimatePresence>

      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-2 bg-gray-750 p-4 rounded-lg max-h-60 overflow-y-auto custom-scrollbar"
        >
          <h3 className="text-md font-semibold text-gray-200 mb-2">Search Results:</h3>
          {searchResults.map((result) => (
            <div key={result.url} className="p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors flex justify-between items-center">
              <p className="font-medium text-blue-300 truncate mr-2">{result.title}</p>
              <button
                onClick={() => {
                  onSelectUrl(result.url);
                  setSearchResults([]);
                  setMangaName("");
                  setSearchAttempted(false);
                }}
                className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded whitespace-nowrap"
              >
                Select
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default SearchBar;
