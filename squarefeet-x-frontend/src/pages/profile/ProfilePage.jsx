import { useState } from 'react';
import { User, Mail, Phone, Shield, Camera, ArrowRightLeft, LogOut, Save, ChevronRight } from 'lucide-react';
import { useAuth, useLogout } from '../../hooks';
import { useAuthStore } from '../../store/authStore';
import { userService, authService } from '../../services/api';
import { ROLES, ROLE_LABELS, getDashboardPath } from '../../constants';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ProfilePage = () => {
    const { user } = useAuth();
    const setUser = useAuthStore((s) => s.setUser);
    const logout = useLogout();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data } = await userService.updateProfile(formData);
            setUser(data.user);
            setIsEditing(false);
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSwitchRole = async (role) => {
        try {
            const { data } = await userService.switchRole(role);
            await authService.refreshToken();
            setUser(data.user);
            toast.success(`Switched to ${ROLE_LABELS[role]}`);
            navigate(getDashboardPath(role));
        } catch {
            toast.error('Failed to switch role');
        }
    };

    const switchableRoles = (user?.activeRole === 'ADMIN' || user?.activeRole === 'MANAGER')
        ? []
        : (user?.roles?.filter((r) => r !== user.activeRole && r !== 'MANAGER' && r !== 'ADMIN') || []);

    return (
        <>
            <SEOHead title="Profile Settings" noindex />
            <div className="min-h-screen bg-surface-dark">
                <Navbar />
                <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Header */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary">
                                Profile <span className="text-gradient">Settings</span>
                            </h1>
                            <p className="text-text-secondary mt-1">Manage your account and preferences</p>
                        </motion.div>

                        {/* Profile Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="relative group">
                                        <Avatar src={user?.avatar} name={user?.name} size="xl" />
                                        <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-6 h-6 text-white" />
                                        </button>
                                    </div>
                                    <div className="text-center sm:text-left flex-1">
                                        <h2 className="text-xl font-display font-bold text-text-primary">{user?.name}</h2>
                                        <p className="text-text-secondary text-sm">{user?.email}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                                            <Badge variant="royal">{ROLE_LABELS[user?.activeRole]}</Badge>
                                            {user?.roles?.length > 1 && (
                                                <span className="text-xs text-text-muted">{user.roles.length} roles available</span>
                                            )}
                                        </div>
                                    </div>
                                    {!isEditing && (
                                        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                                            Edit Profile
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Personal Info */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card>
                                <h3 className="text-lg font-display font-semibold text-text-primary mb-6">Personal Information</h3>
                                <div className="space-y-4">
                                    {isEditing ? (
                                        <>
                                            <Input
                                                label="Full Name"
                                                icon={User}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                            <div className="opacity-60">
                                                <Input label="Email" icon={Mail} value={user?.email || ''} disabled />
                                                <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                                            </div>
                                            <Input
                                                label="Phone"
                                                icon={Phone}
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                            <div className="flex gap-3 pt-2">
                                                <Button onClick={handleSave} isLoading={isSaving} icon={Save}>Save Changes</Button>
                                                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover/50">
                                                <User className="w-5 h-5 text-royal-400" />
                                                <div>
                                                    <p className="text-xs text-text-muted">Full Name</p>
                                                    <p className="text-sm text-text-primary font-medium">{user?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover/50">
                                                <Mail className="w-5 h-5 text-royal-400" />
                                                <div>
                                                    <p className="text-xs text-text-muted">Email</p>
                                                    <p className="text-sm text-text-primary font-medium">{user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover/50">
                                                <Phone className="w-5 h-5 text-royal-400" />
                                                <div>
                                                    <p className="text-xs text-text-muted">Phone</p>
                                                    <p className="text-sm text-text-primary font-medium">{user?.phone || 'Not set'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Account Info */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <Card>
                                <h3 className="text-lg font-display font-semibold text-text-primary mb-4">Account</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-emerald-400" />
                                            <div>
                                                <p className="text-sm text-text-primary font-medium">Account Status</p>
                                                <p className="text-xs text-text-muted">Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                    
                                    {/* Role Switching Section */}
                                    {switchableRoles.length > 0 && (
                                        <div className="mt-4 p-4 rounded-xl border border-surface-border bg-surface-card">
                                            <h4 className="text-sm font-semibold text-text-primary mb-3">Switch Active Role</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {switchableRoles.map((role) => (
                                                    <button
                                                        key={role}
                                                        onClick={() => handleSwitchRole(role)}
                                                        className="flex items-center justify-between p-3 rounded-lg border border-surface-border hover:border-royal-500 hover:bg-royal-500/5 transition-all text-left"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center">
                                                                <ArrowRightLeft className="w-4 h-4 text-text-secondary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-text-primary">{ROLE_LABELS[role]}</p>
                                                                <p className="text-xs text-text-muted">Switch to this role</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-text-muted" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                                <div className="mt-6 pt-4 border-t border-surface-border">
                                    <Button
                                        variant="danger"
                                        className="w-full"
                                        icon={LogOut}
                                        onClick={logout}
                                    >
                                        Sign Out
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

export default ProfilePage;
