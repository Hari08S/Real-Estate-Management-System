import { useState } from 'react';
import { HandshakeIcon, Check, X, RefreshCcw, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils';
import toast from 'react-hot-toast';

/**
 * Detects if a chat message contains a formal offer and renders
 * the Accept / Reject / Counter offer action panel.
 *
 * Props:
 *  - message     : the raw message text
 *  - isFromMe    : whether current user sent this message
 *  - isSeller    : whether current user is the seller (can act on offers)
 *  - onRespond   : async fn({ type: 'ACCEPT'|'REJECT'|'COUNTER', counterPrice? })
 */
export const OfferMessageBubble = ({ message, isFromMe, isSeller, onRespond }) => {
    const [expanded, setExpanded] = useState(false);
    const [counterPrice, setCounterPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [responded, setResponded] = useState(null); // 'ACCEPT' | 'REJECT' | 'COUNTER'

    // Only render the action panel if this is a formal offer message AND current user is the seller
    const isOffer = message?.includes('FORMAL OFFER') || message?.includes('🤝');
    if (!isOffer || isFromMe || !isSeller) return null;
    if (responded) return null; // Hide after responding

    // Extract offer price from message
    const match = message.match(/Offer Price.*?₹([\d,]+)/);
    const offerAmount = match ? Number(match[1].replace(/,/g, '')) : null;

    const handleRespond = async (type) => {
        if (type === 'COUNTER' && (!counterPrice || Number(counterPrice) <= 0)) {
            toast.error('Enter a valid counter price');
            return;
        }
        setLoading(true);
        try {
            await onRespond({ type, counterPrice: Number(counterPrice) || undefined });
            setResponded(type);
            toast.success(
                type === 'ACCEPT' ? '✅ Offer accepted!' :
                type === 'REJECT' ? '❌ Offer rejected' :
                `↩️ Counter offer of ${formatCurrency(Number(counterPrice))} sent!`
            );
        } catch {
            toast.error('Failed to respond to offer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-2 rounded-xl border border-royal-500/30 bg-navy-900/80 backdrop-blur-sm overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-surface-hover/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <HandshakeIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Formal Offer Received</span>
                    {offerAmount && (
                        <span className="text-xs text-text-muted">— {formatCurrency(offerAmount)}</span>
                    )}
                </div>
                {expanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
            </div>

            {expanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-surface-border">
                    <p className="text-[10px] text-text-muted pt-2">Respond to this offer:</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleRespond('ACCEPT')}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                            <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                            onClick={() => handleRespond('REJECT')}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                            <X className="w-3.5 h-3.5" /> Reject
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
                            <input
                                type="number"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                placeholder="Counter price..."
                                className="w-full bg-surface-card border border-surface-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                            />
                        </div>
                        <button
                            onClick={() => handleRespond('COUNTER')}
                            disabled={loading || !counterPrice}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                            <RefreshCcw className="w-3 h-3" /> Counter
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
