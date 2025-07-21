import React, { useState, useEffect } from "react";
import { Loader, X } from "lucide-react";

interface ComicReaderProps {
  chapterUrl: string;
  onClose: () => void;
}

const ComicReader: React.FC<ComicReaderProps> = ({ chapterUrl, onClose }) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Reading Chapter</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
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
          {!loading && !error && (
            <div className="flex flex-col items-center space-y-2">
              {imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`Page ${index + 1}`} className="max-w-full h-auto" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComicReader;
