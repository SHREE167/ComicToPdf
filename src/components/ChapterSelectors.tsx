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
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-neon-silver mb-2 font-orbitron tracking-wide">START CHAPTER</label>
                    <select
                        value={selectedStart}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => onStartChange(e.target.value)}
                        className="block w-full px-4 py-3 bg-cyber-dark text-neon-silver border border-gray-700 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:shadow-neon-blue transition-all duration-300 font-mono custom-select"
                    >
                        {chapters.map((chapter) => (
                            <option key={`start-${chapter.title}`} value={chapter.title} className="bg-cyber-black">{chapter.title}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-neon-silver mb-2 font-orbitron tracking-wide">END CHAPTER</label>
                    <select
                        value={selectedEnd}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => onEndChange(e.target.value)}
                        className="block w-full px-4 py-3 bg-cyber-dark text-neon-silver border border-gray-700 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:shadow-neon-blue transition-all duration-300 font-mono custom-select"
                    >
                        {chapters.map((chapter) => (
                            <option key={`end-${chapter.title}`} value={chapter.title} className="bg-cyber-black">{chapter.title}</option>
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neon-green/10 border border-neon-green text-neon-green rounded-lg hover:bg-neon-green hover:text-cyber-black hover:shadow-neon-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <BookOpen className="h-5 w-5" />
                <span className="font-bold font-orbitron">READ ONLINE</span>
            </button>
        </div>
    );
};

export default ChapterSelectors;
