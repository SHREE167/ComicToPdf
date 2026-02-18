import { ChangeEvent } from 'react';
import { BookOpen } from 'lucide-react';

export interface Chapter {
    title: string;
    url: string;
}

interface ChapterSelectorsProps {
    chapters: Chapter[];
    selectedStart: string;
    selectedEnd: string;
    onStartChange: (val: string) => void;
    onEndChange: (val: string) => void;
    onReadOnline: (url: string) => void;
    loading: boolean;
}

const ChapterSelectors: React.FC<ChapterSelectorsProps> = ({
    chapters,
    selectedStart,
    selectedEnd,
    onStartChange,
    onEndChange,
    onReadOnline,
    loading,
}) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Chapter</label>
                    <select
                        value={selectedStart}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => onStartChange(e.target.value)}
                        className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                        {chapters.map((chapter) => (
                            <option key={`start-${chapter.title}`} value={chapter.title}>{chapter.title}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Chapter</label>
                    <select
                        value={selectedEnd}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => onEndChange(e.target.value)}
                        className="block w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                        {chapters.map((chapter) => (
                            <option key={`end-${chapter.title}`} value={chapter.title}>{chapter.title}</option>
                        ))}
                    </select>
                </div>
            </div>
            <button
                type="button"
                onClick={() => {
                    const chapter = chapters.find(c => c.title === selectedStart);
                    if (chapter) {
                        onReadOnline(chapter.url);
                    }
                }}
                disabled={loading || chapters.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
                <BookOpen className="h-5 w-5" />
                Read Start Chapter Online
            </button>
        </div>
    );
};

export default ChapterSelectors;
