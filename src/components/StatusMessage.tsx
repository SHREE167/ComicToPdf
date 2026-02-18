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
                    className={`mt-4 p-3 rounded-lg text-sm text-center ${status.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                        }`}
                >
                    {status.message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StatusMessage;
