import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, Edit3, Ban, CheckCircle2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { adminService } from '../../services/api';
import { ROLE_LABELS, ROLES } from '../../constants';
import { formatDate } from '../../utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [editUser, setEditUser] = useState(null);
    const [showPasswordMap, setShowPasswordMap] = useState({});
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => adminService.getUsers({}).then((r) => r.data),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => adminService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User updated');
            setEditUser(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => adminService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User deleted');
        },
    });

    const users = (data?.users || []).filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <DashboardSkeleton />;

    return (
        <>
            <SEOHead title="User Management" noindex />
            <div>
                <h1 className="text-2xl font-display font-bold text-text-primary mb-2">User Management</h1>
                <p className="text-text-secondary text-sm mb-6">Manage platform users and roles</p>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full sm:w-80 bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                    />
                </div>

                <Card padding={false}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-border">
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">User</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Roles</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Details</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Password</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Status</th>
                                    <th className="text-left text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Joined</th>
                                    <th className="text-right text-xs font-medium text-text-muted p-4 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-surface-hover/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={u.profilePicUrl} name={u.name} size="sm" />
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">{u.name}</p>
                                                    <p className="text-xs text-text-muted">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {u.roles?.map((r) => <Badge key={r} variant="royal">{ROLE_LABELS[r]}</Badge>)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-text-primary">{u.phone || '—'}</div>
                                            {u.cities && u.cities.length > 0 && (
                                                <div className="text-xs text-gold-400 mt-1 font-semibold">
                                                    Cities: {u.cities.join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono text-text-secondary bg-surface-dark px-2 py-1 rounded">
                                                    {showPasswordMap[u.id] ? (u.rawPassword || '••••••••') : '••••••••'}
                                                </span>
                                                <button onClick={() => setShowPasswordMap(p => ({ ...p, [u.id]: !p[u.id] }))} className="text-text-muted hover:text-text-primary">
                                                    {showPasswordMap[u.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={u.status === 'active' ? 'success' : 'danger'} dot>
                                                {u.status || 'active'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-xs text-text-muted">{formatDate(u.createdAt)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="sm" variant="ghost" icon={Edit3} onClick={() => setEditUser({ ...u })}>Edit</Button>
                                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" icon={Trash2} onClick={() => {
                                                    if(window.confirm('Are you sure you want to delete this user?')) deleteMutation.mutate(u.id);
                                                }}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
                {editUser && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                            <input type="text" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                            <input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                            <input type="text" value={editUser.phone || ''} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Active Role</label>
                            <select value={editUser.activeRole} onChange={(e) => setEditUser({ ...editUser, activeRole: e.target.value })} className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none">
                                {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                        </div>
                        <div className="pt-4 flex justify-end gap-3 border-t border-surface-border">
                            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
                            <Button variant="primary" icon={Save} isLoading={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: editUser.id, data: { name: editUser.name, email: editUser.email, phone: editUser.phone, activeRole: editUser.activeRole, roles: editUser.roles.includes(editUser.activeRole) ? editUser.roles : [...editUser.roles, editUser.activeRole] } })}>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default UserManagement;
