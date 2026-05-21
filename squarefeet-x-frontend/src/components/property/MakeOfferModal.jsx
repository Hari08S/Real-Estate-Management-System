import { useState } from 'react';
import { X, HandshakeIcon, IndianRupee, MessageSquare, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils';
import toast from 'react-hot-toast';

export const MakeOfferModal = ({ property, onClose, onSubmit }) => {
    const [offerPrice, setOfferPrice] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const listedPrice = property?.price || property?.monthlyRent || property?.leaseAmount || 0;
    const offerNum = Number(offerPrice);
    const diffPercent = listedPrice > 0 ? (((offerNum - listedPrice) / listedPrice) * 100).toFixed(1) : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!offerPrice || offerNum <= 0) { toast.error('Enter a valid offer price'); return; }
        setLoading(true);
        try {
            await onSubmit({
                offerPrice: offerNum,
                message: message || `I'd like to make an offer of ${formatCurrency(offerNum)} for ${property.title}.`,
            });
            setDone(true);
        } catch {
            toast.error('Failed to submit offer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
                        <HandshakeIcon className="w-5 h-5 text-royal-400" />
                        Make an Offer
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {done ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h4 className="text-base font-semibold text-text-primary mb-2">Offer Sent!</h4>
                        <p className="text-sm text-text-secondary">
                            Your offer of <span className="text-emerald-400 font-bold">{formatCurrency(offerNum)}</span> has been sent to the seller.
                            They will respond via chat.
                        </p>
                        <button onClick={onClose} className="mt-5 px-5 py-2 bg-royal-600 text-white rounded-xl text-sm font-medium hover:bg-royal-500 transition-all">
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-3 rounded-xl bg-surface-hover border border-surface-border text-sm">
                            <p className="text-text-muted text-xs">Listed Price</p>
                            <p className="font-bold text-gradient text-base">{formatCurrency(listedPrice)}</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-text-secondary">Your Offer Price (₹)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="number"
                                    required
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    placeholder="Enter your offer amount"
                                    className="w-full bg-surface-hover border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                                />
                            </div>
                            {offerNum > 0 && diffPercent !== null && (
                                <p className={`text-xs font-medium ${Number(diffPercent) < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {Number(diffPercent) < 0
                                        ? `${Math.abs(diffPercent)}% below listed price`
                                        : `${diffPercent}% above listed price`}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-text-secondary">Message to Seller (optional)</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                                <textarea
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Reason for offer, preferred move-in date..."
                                    className="w-full bg-surface-hover border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-surface-border text-text-secondary hover:text-text-primary text-sm font-medium transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className="flex-1 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-sm font-semibold disabled:opacity-50 transition-all">
                                {loading ? 'Sending...' : 'Submit Offer'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
