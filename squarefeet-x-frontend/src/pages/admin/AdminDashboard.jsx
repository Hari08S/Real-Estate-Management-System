import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
    Building2, Users, MessageSquare, TrendingUp, ArrowUp, ArrowDown
} from 'lucide-react';
import { adminService } from '../../services/api';
import { useAuth } from '../../hooks';
import Card from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import { motion } from 'framer-motion';

const CHART_COLORS = ['#6d3fff', '#f5c518', '#10b981', '#3b82f6', '#ef4444', '#8b72ff'];

const AdminDashboard = () => {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => adminService.getDashboardStats().then((r) => r.data),
    });

    if (isLoading) return <DashboardSkeleton />;

    const overviewCards = [
        { label: 'Total Properties', value: stats?.totalProperties || 0, icon: Building2, color: 'from-royal-600 to-royal-500', change: '+12%', up: true },
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-emerald-600 to-emerald-500', change: '+8%', up: true },
        { label: 'Total Inquiries', value: stats?.totalInquiries || stats?.totalUnlocks || 0, icon: MessageSquare, color: 'from-blue-600 to-blue-500', change: '+15%', up: true },
    ];

    const monthlyData = stats?.monthlyData || [
        { month: 'Jan', listings: 45, inquiries: 120 },
        { month: 'Feb', listings: 52, inquiries: 145 },
        { month: 'Mar', listings: 61, inquiries: 180 },
        { month: 'Apr', listings: 70, inquiries: 210 },
        { month: 'May', listings: 85, inquiries: 250 },
        { month: 'Jun', listings: 95, inquiries: 290 },
    ];

    const categoryData = stats?.categoryData || [
        { name: 'Apartments', value: 45 },
        { name: 'Villas', value: 25 },
        { name: 'Plots', value: 15 },
        { name: 'Commercial', value: 10 },
        { name: 'Others', value: 5 },
    ];

    return (
        <>
            <SEOHead title="Admin Dashboard" noindex />
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-display font-bold text-text-primary">
                        Admin <span className="text-gradient">Dashboard</span>
                    </h1>
                    <p className="text-text-secondary mt-1">Platform overview and analytics</p>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {overviewCards.map((card, i) => (
                        <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card hover>
                                <div className="flex items-start justify-between">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                        <card.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className={`flex items-center gap-1 text-xs font-medium ${card.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {card.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                        {card.change}
                                    </span>
                                </div>
                                <p className="text-2xl font-display font-bold text-text-primary mt-4">{card.value}</p>
                                <p className="text-xs text-text-secondary mt-1">{card.label}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}


                    {/* Category Distribution */}
                    <Card>
                        <h3 className="text-lg font-display font-semibold text-text-primary mb-6">Property Types</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                                    {categoryData.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#141829', border: '1px solid #2a2f4a', borderRadius: '12px', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {categoryData.map((item, i) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                        <span className="text-text-secondary">{item.name}</span>
                                    </div>
                                    <span className="text-white font-medium">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <Card>
                    <h3 className="text-lg font-display font-semibold text-text-primary mb-6">Listings & Inquiries</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip contentStyle={{ background: '#141829', border: '1px solid #2a2f4a', borderRadius: '12px', color: '#fff' }} />
                            <Bar dataKey="listings" fill="#6d3fff" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="inquiries" fill="#f5c518" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </>
    );
};

export default AdminDashboard;
