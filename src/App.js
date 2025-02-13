import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader, List } from "lucide-react";
function App() {
    const [mangaUrl, setMangaUrl] = useState("");
    const [chapters, setChapters] = useState([]);
    const [selectedStart, setSelectedStart] = useState("");
    const [selectedEnd, setSelectedEnd] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [siteType, setSiteType] = useState(null);
    // Fetch chapters based on URL
    const fetchChapters = async () => {
        setStatus({ type: "", message: "" });
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/get-chapters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mangaUrl }),
            });
            const data = await response.json();
            if (data.error)
                throw new Error(data.error);
            setChapters(data.chapters);
            setSelectedStart(data.chapters[0]?.title || "");
            setSelectedEnd(data.chapters[data.chapters.length - 1]?.title || "");
            setSiteType(data.siteType);
            setStatus({ type: "success", message: "Chapters loaded successfully!" });
        }
        catch (err) {
            setStatus({ type: "error", message: err.message || "Failed to fetch chapters" });
        }
        finally {
            setLoading(false);
        }
    };
    // Handle PDF download
    const handleDownload = async (e) => {
        e.preventDefault();
        setStatus({ type: "", message: "" });
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/scrape-comic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mangaUrl, startChapter: selectedStart, endChapter: selectedEnd }),
            });
            if (!response.ok)
                throw new Error("Failed to fetch PDF");
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = "comic.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setStatus({ type: "success", message: "PDF downloaded successfully!" });
        }
        catch (err) {
            setStatus({ type: "error", message: "Failed to process the comic. Please try again." });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-6", children: _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8 }, className: "max-w-xl w-full bg-gray-800 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx(motion.h1, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" }, className: "text-3xl font-bold text-blue-400 mb-2", children: "\uD83D\uDCD6 Comic to PDF Converter" }), _jsx("p", { className: "text-gray-400", children: "Download any comic as PDFs." })] }), _jsxs("form", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Enter Manga URL" }), _jsx("input", { type: "url", value: mangaUrl, onChange: (e) => setMangaUrl(e.target.value), placeholder: "Enterthe novel interface URL Example: https://kingofshojo.com/manga/solo-leveling/", className: "block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400", required: true })] }), _jsxs("button", { type: "button", onClick: fetchChapters, disabled: loading, className: "w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [loading ? _jsx(Loader, { className: "animate-spin h-5 w-5" }) : _jsx(List, { className: "h-5 w-5" }), loading ? "Loading Chapters..." : "Fetch Chapters"] }), chapters.length > 0 && (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("select", { value: selectedStart, onChange: (e) => setSelectedStart(e.target.value), className: "block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400", children: chapters.map((chapter) => (_jsx("option", { value: chapter.title, children: chapter.title }, chapter.title))) }), _jsx("select", { value: selectedEnd, onChange: (e) => setSelectedEnd(e.target.value), className: "block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400", children: chapters.map((chapter) => (_jsx("option", { value: chapter.title, children: chapter.title }, chapter.title))) })] })), _jsxs("button", { type: "submit", onClick: handleDownload, disabled: loading || chapters.length === 0, className: "w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50", children: [loading ? _jsx(Loader, { className: "animate-spin h-5 w-5" }) : _jsx(Download, { className: "h-5 w-5" }), loading ? "Converting..." : "Download PDF"] })] }), _jsxs("div", { className: "mt-6 text-gray-400 text-sm text-center", children: [_jsx("p", { children: "1\uFE0F\u20E3 Paste the comic, manhwa, or manhua link above and fetch the chapter." }), _jsx("p", { children: "2\uFE0F\u20E3 Select the start and end chapters, download the PDF, and enjoy reading! \uD83D\uDCD6" }), _jsx("p", { children: "3\uFE0F\u20E3 Currently supports URLs from aquareader.net and kingofshojo.com." })] })] }) }));
}
export default App;
