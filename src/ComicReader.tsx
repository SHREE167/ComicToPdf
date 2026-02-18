import React, { useState, useEffect, useRef } from "react";
import { Loader, X, Maximize, Minimize } from "lucide-react";

interface ComicReaderProps {
  chapterUrl: string;
  onClose: () => void;
}

const ComicReader: React.FC<ComicReaderProps> = ({ chapterUrl, onClose }) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChapterImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/get-chapter-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterUrl }),
        });

        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.error || `Server responded with status ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setImageUrls(data.imageUrls);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (chapterUrl) {
      fetchChapterImages();
    }
  }, [chapterUrl]);

  const toggleFullScreen = () => {
    if (!readerRef.current) return;

    if (!document.fullscreenElement) {
      readerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div ref={readerRef} className={`fixed inset-0 bg-cyber-black flex justify-center items-center z-50 ${isFullScreen ? 'p-0' : 'p-4'}`}>
      <div className="bg-cyber-gray rounded-lg shadow-neon-blue border border-neon-blue/30 w-full h-full flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b border-neon-blue/20 bg-cyber-black/50 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold text-neon-blue font-orbitron tracking-wider">SECURE READER LINK</h2>
          <div className="flex items-center space-x-4">
            <button onClick={toggleFullScreen} className="text-neon-silver hover:text-neon-blue transition-colors" title="Toggle Fullscreen">
              {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            <button onClick={onClose} className="text-red-500 hover:text-red-400 transition-colors" title="Close Reader">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-auto p-0 relative bg-cyber-black custom-scrollbar">
          {loading && (
            <div className="flex flex-col justify-center items-center h-full space-y-4">
              <Loader className="animate-spin h-16 w-16 text-neon-blue" />
              <p className="font-mono text-neon-blue animate-pulse">DECRYPTING IMAGE DATA...</p>
            </div>
          )}
          {error && (
            <div className="flex justify-center items-center h-full">
              <div className="border border-red-500 bg-red-900/20 p-6 rounded-lg text-center">
                <p className="text-red-500 font-bold font-orbitron text-xl mb-2">ERROR DETECTED</p>
                <p className="text-red-300 font-mono">{error}</p>
              </div>
            </div>
          )}
          {!loading && !error && imageUrls.length > 0 && (
            <div className="flex flex-col items-center space-y-0 w-full">
              {imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`Page ${index + 1}`} className="max-w-full h-auto shadow-lg" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComicReader;
