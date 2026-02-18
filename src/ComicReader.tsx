import React, { useState, useEffect, useRef } from "react";
import { Loader, X, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Maximize, Minimize, View } from "lucide-react";

interface ComicReaderProps {
  chapterUrl: string;
  siteType: string | null;
  onClose: () => void;
}

const ComicReader: React.FC<ComicReaderProps> = ({ chapterUrl, siteType, onClose }) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(3);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'scroll'>('single');
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChapterImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/get-chapter-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterUrl, siteType }),
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
  }, [chapterUrl, siteType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentPage(p => Math.min(imageUrls.length - 1, p + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentPage(p => Math.max(0, p - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageUrls.length]);

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
            <div className="p-1 bg-cyber-dark rounded border border-gray-700 flex space-x-1">
              <button onClick={() => setZoomLevel(z => z + 0.1)} className="p-1 text-neon-silver hover:text-neon-blue transition-colors" disabled={viewMode === 'scroll'} title="Zoom In">
                <ZoomIn size={20} />
              </button>
              <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="p-1 text-neon-silver hover:text-neon-blue transition-colors" disabled={viewMode === 'scroll'} title="Zoom Out">
                <ZoomOut size={20} />
              </button>
              <div className="w-px bg-gray-700"></div>
              <button onClick={() => setViewMode(m => m === 'single' ? 'scroll' : 'single')} className={`p-1 transition-colors ${viewMode === 'scroll' ? 'text-neon-blue' : 'text-neon-silver hover:text-white'}`} title="Toggle View Mode">
                <View size={20} />
              </button>
            </div>
            <button onClick={toggleFullScreen} className="text-neon-silver hover:text-neon-blue transition-colors">
              {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            <button onClick={onClose} className="text-red-500 hover:text-red-400 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-auto p-0 relative bg-cyber-black">
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
            viewMode === 'single' ? (
              <div className="flex flex-col items-center justify-center h-full min-h-screen">
                <img
                  src={imageUrls[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-0 w-full">
                {imageUrls.map((url, index) => (
                  <img key={index} src={url} alt={`Page ${index + 1}`} className="max-w-full h-auto shadow-lg" />
                ))}
              </div>
            )
          )}
        </div>

        {viewMode === 'single' && (
          <div className="flex justify-between items-center p-4 border-t border-neon-blue/20 bg-cyber-black/50 backdrop-blur-sm z-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-full border border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-cyber-black disabled:opacity-30 disabled:border-gray-700 disabled:text-gray-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="text-neon-silver font-mono">
              <span className="text-neon-blue">PAGE</span> {currentPage + 1} <span className="text-gray-600">/</span> {imageUrls.length}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(imageUrls.length - 1, p + 1))}
              disabled={currentPage === imageUrls.length - 1}
              className="p-2 rounded-full border border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-cyber-black disabled:opacity-30 disabled:border-gray-700 disabled:text-gray-500 transition-all"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComicReader;
