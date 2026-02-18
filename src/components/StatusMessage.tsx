import { motion, AnimatePresence } from 'framer-motion';

interface StatusMessageProps {
    status: {
        type: string;
        message: string;
    };
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
    return (
        <AnimatePresence>
            {status.message && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className={`mt-4 p-4 rounded-lg font-mono text-sm text-center border shadow-[0_0_10px_rgba(0,0,0,0.5)] ${status.type === 'error'
                            ? 'bg-red-900/20 border-red-500 text-red-400 shadow-red-500/20'
                            : 'bg-green-900/20 border-green-500 text-green-400 shadow-green-500/20'
                        }`}
                >
                    <span className="font-bold mr-2">[{status.type === 'error' ? 'ERROR' : 'SUCCESS'}]</span>
                    {status.message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StatusMessage;
