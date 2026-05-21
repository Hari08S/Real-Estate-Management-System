import { Check, Clock, X, AlertCircle } from 'lucide-react';
import { STATUS_FLOW, PROPERTY_STATUS_LABELS, PROPERTY_STATUS } from '../../constants';
import { formatDate } from '../../utils';
import { motion } from 'framer-motion';

const statusIcons = {
    completed: <Check className="w-4 h-4" />,
    current: <Clock className="w-4 h-4" />,
    future: <AlertCircle className="w-4 h-4" />,
    rejected: <X className="w-4 h-4" />,
};

const PropertyStatusTracker = ({ currentStatus, timestamps = {}, rejectionReason, vertical = false }) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const isRejected = currentStatus === PROPERTY_STATUS.REJECTED;

    return (
        <div className={`${vertical ? 'flex flex-col gap-0' : 'flex items-start gap-0'}`}>
            {STATUS_FLOW.map((status, index) => {
                let state = 'future';
                if (isRejected && index <= currentIndex) state = 'rejected';
                else if (index < currentIndex) state = 'completed';
                else if (index === currentIndex) state = 'current';

                const colors = {
                    completed: 'bg-emerald-500 border-emerald-500 text-white',
                    current: 'bg-amber-500 border-amber-500 text-white',
                    future: 'bg-surface-hover border-surface-border text-text-muted',
                    rejected: 'bg-red-500 border-red-500 text-white',
                };

                const lineColors = {
                    completed: 'bg-emerald-500',
                    current: 'bg-amber-500',
                    future: 'bg-surface-border',
                    rejected: 'bg-red-500',
                };

                return (
                    <div
                        key={status}
                        className={`flex ${vertical ? 'flex-row items-start gap-3' : 'flex-col items-center gap-2'} ${vertical ? '' : 'flex-1'}`}
                    >
                        <div className={`flex ${vertical ? 'flex-col items-center' : 'flex-row items-center w-full'}`}>
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${colors[state]}`}
                            >
                                {statusIcons[state]}
                            </motion.div>
                            {index < STATUS_FLOW.length - 1 && (
                                <div className={`${vertical ? 'w-0.5 h-8 mx-auto' : 'h-0.5 flex-1'} ${lineColors[state]} transition-all`} />
                            )}
                        </div>
                        <div className={`${vertical ? 'pb-4' : 'text-center mt-1'}`}>
                            <p className={`text-xs font-medium ${state === 'current' ? 'text-amber-400' : state === 'completed' ? 'text-emerald-400' : state === 'rejected' ? 'text-red-400' : 'text-text-muted'}`}>
                                {PROPERTY_STATUS_LABELS[status]}
                            </p>
                            {timestamps[status] && (
                                <p className="text-[10px] text-text-muted mt-0.5">{formatDate(timestamps[status])}</p>
                            )}
                        </div>
                    </div>
                );
            })}
            {isRejected && rejectionReason && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">
                        <strong>Rejection Reason:</strong> {rejectionReason}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PropertyStatusTracker;
