import { useState } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// Generate mock price trend data for an area
const generateTrendData = (basePrice, city) => {
    const seed = city?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 50;
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    let price = basePrice * 0.88;
    return months.map((month, i) => {
        const variance = ((seed * (i + 1) * 37) % 11) - 5; // -5 to +5 %
        price = price * (1 + variance / 100);
        return { month, price: Math.round(price), priceSqft: Math.round(price / 1500) };
    });
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-card border border-surface-border rounded-xl p-3 shadow-xl text-xs">
            <p className="font-semibold text-text-primary mb-1">{label}</p>
            <p className="text-royal-400">₹{payload[0]?.value?.toLocaleString('en-IN')}/sqft</p>
        </div>
    );
};

export const PriceTrendChart = ({ price, area, city }) => {
    const [period, setPeriod] = useState('6m');
    if (!price || !city) return null;

    const basePriceSqft = area ? Math.round(price / area) : Math.round(price / 1000);
    const data = generateTrendData(basePriceSqft, city);
    const first = data[0].priceSqft;
    const last = data[data.length - 1].priceSqft;
    const changePercent = (((last - first) / first) * 100).toFixed(1);
    const isUp = changePercent >= 0;

    return (
        <div className="mt-6 p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-display font-semibold text-text-primary flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-royal-400" />
                        Area Price Trend
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">{city} — Price per sqft (6 months)</p>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                    isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${!isUp && 'rotate-180'}`} />
                    {isUp ? '+' : ''}{changePercent}% in 6mo
                </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6574f2" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6574f2" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone" dataKey="priceSqft" stroke="#6574f2" strokeWidth={2}
                        fill="url(#priceGrad)" dot={false} activeDot={{ r: 4, fill: '#6574f2' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
