import React, { useState, useEffect, useRef } from "react";
import { Loader, X, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";

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
  const [zoomLevel, setZoomLevel] = useState(1);
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
    <div ref={readerRef} className={`fixed inset-0 bg-gray-900 flex justify-center items-center z-50 ${isFullScreen ? 'p-0' : 'p-4'}`}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Reading Chapter</h2>
          <div className="flex items-center space-x-4">
            <button onClick={() => setZoomLevel(z => z + 0.1)} className="text-gray-400 hover:text-white">
              <ZoomIn size={24} />
            </button>
            <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="text-gray-400 hover:text-white">
              <ZoomOut size={24} />
            </button>
            <button onClick={toggleFullScreen} className="text-gray-400 hover:text-white">
              {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-auto p-4 relative">
          {loading && (
            <div className="flex justify-center items-center h-full">
              <Loader className="animate-spin h-12 w-12 text-blue-400" />
            </div>
          )}
          {error && (
            <div className="flex justify-center items-center h-full">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          {!loading && !error && imageUrls.length > 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <img
                src={imageUrls[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-700">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-white">
            {currentPage + 1} / {imageUrls.length}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(imageUrls.length - 1, p + 1))}
            disabled={currentPage === imageUrls.length - 1}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComicReader;
