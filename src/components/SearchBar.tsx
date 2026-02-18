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

    <div className="space-y-4 mb-6 relative">
      <div>
        <label htmlFor="manga-name-search" className="block text-sm font-bold text-neon-silver mb-2 font-orbitron tracking-wide">
          SEARCH DATABASE
        </label>
        <div className="flex gap-2 relative">
          <input
            type="text"
            id="manga-name-search"
            value={mangaName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setMangaName(e.target.value);
              setSearchAttempted(false);
              setSearchResults([]);
            }}
            placeholder="Search KingOfShojo..."
            className="block w-full px-4 py-3 pl-10 bg-cyber-dark text-neon-silver border border-gray-700 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:shadow-neon-blue transition-all duration-300 placeholder-gray-600 font-mono"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>

          <button
            type="button"
            onClick={handleSearchManga}
            disabled={isSearching || mangaName.trim() === ""}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-neon-purple/10 border border-neon-purple text-neon-purple rounded-lg hover:bg-neon-purple hover:text-white hover:shadow-neon-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-orbitron font-bold"
            style={{ minWidth: '140px' }}
          >
            {isSearching ? (
              <>
                <Loader className="animate-spin h-5 w-5" /> SEARCHING
              </>
            ) : (
              <>
                <Search className="h-5 w-5" /> SEARCH
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
            className="text-center text-neon-blue font-mono text-sm animate-pulse"
          >
            SCANNING DATABASE...
          </motion.div>
        )}
        {!isSearching && searchAttempted && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-red-400 font-mono text-sm bg-red-900/20 border border-red-900/50 p-3 rounded-lg"
          >
            NO DATA FOUND FOR "{mangaName}".
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-cyber-black/95 backdrop-blur-md border border-neon-blue/50 rounded-lg shadow-neon-blue max-h-60 overflow-y-auto custom-scrollbar"
          >
            <div className="p-2 border-b border-gray-800">
              <h3 className="text-xs font-bold text-neon-blue font-orbitron tracking-wider">SEARCH RESULTS detected: {searchResults.length}</h3>
            </div>
            <ul className="py-2">
              {searchResults.map((result, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      onSelectUrl(result.url);
                      setSearchResults([]);
                      setMangaName("");
                      setSearchAttempted(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-neon-blue/10 hover:text-neon-blue transition-colors flex items-center justify-between group border-l-2 border-transparent hover:border-neon-blue"
                  >
                    <span className="font-rajdhani font-medium truncate pr-4">{result.title}</span>
                    <span className="text-xs text-gray-600 font-mono group-hover:text-neon-blue">[SELECT]</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
