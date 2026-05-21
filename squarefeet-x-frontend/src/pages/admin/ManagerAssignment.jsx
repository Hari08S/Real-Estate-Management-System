import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, UserPlus, X, Mail, Phone, Calendar, Edit3, Trash2, Search, Building2, Key, Lock, Plus } from 'lucide-react';
import { adminService } from '../../services/api';
import { formatDate } from '../../utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';
import { STATES } from '../../data/locations';

const ManagerAssignment = () => {
    const [showAssign, setShowAssign] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [selectedManager, setSelectedManager] = useState('');
    const [city, setCity] = useState('');
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    // Create form state
    const [createForm, setCreateForm] = useState({
        name: '', email: '', phone: '', password: 'Manager@123', cities: ''
    });

    // Edit form state
    const [editForm, setEditForm] = useState(null);
    const [editCity, setEditCity] = useState('');

    const { data: managers, isLoading } = useQuery({
        queryKey: ['admin-managers'],
        queryFn: () => adminService.getManagers().then((r) => r.data),
    });

     const assignMutation = useMutation({
        mutationFn: (data) => adminService.assignManager(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-managers'] });
            setShowAssign(false);
            setSelectedManager('');
            setCity('');
            toast.success('Manager assigned to state');
        },
        onError: () => toast.error('Assignment failed'),
    });

    const unassignMutation = useMutation({
        mutationFn: (data) => adminService.unassignManager(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-managers'] });
            toast.success('State removed');
        },
        onError: () => toast.error('Unassign failed'),
    });

    const createMutation = useMutation({
        mutationFn: (data) => adminService.createManager(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-managers'] });
            setShowCreate(false);
            setCreateForm({ name: '', email: '', phone: '', password: 'Manager@123', cities: '' });
            toast.success('Manager account created successfully!');
        },
        onError: (err) => toast.error(err?.response?.data?.error || 'Failed to create manager'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => adminService.deleteManager(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-managers'] });
            setShowDetail(null);
            toast.success('Manager deleted');
        },
        onError: () => toast.error('Delete failed'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => adminService.updateManager(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-managers'] });
            toast.success('Manager updated');
        },
        onError: () => toast.error('Update failed'),
    });

    if (isLoading) return <DashboardSkeleton />;

    const managerList = (managers?.managers || []).filter((m) =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.cities?.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    );

    const managerOptions = (managers?.managers || []).map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }));

    const totalCities = managerList.reduce((s, m) => s + (m.cities?.length || 0), 0);
    const totalListings = managerList.reduce((s, m) => s + (m.activeListings || 0), 0);

    const handleCreate = () => {
        const { name, email, phone, password, cities } = createForm;
        if (!name || !email || !phone) {
            toast.error('Name, email and phone are required');
            return;
        }
        const cityList = cities.split(',').map(c => c.trim()).filter(Boolean);
        createMutation.mutate({ name, email, phone, password, cities: cityList });
    };

    const handleAddCityToManager = () => {
        if (!showDetail || !editCity.trim()) return;
        assignMutation.mutate({ managerId: showDetail.id, city: editCity.trim() });
        setEditCity('');
    };

    return (
        <>
            <SEOHead title="Manager Management" noindex />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-text-primary mb-1">
                            Manager <span className="text-gradient">Management</span>
                        </h1>
                        <p className="text-text-secondary text-sm">Create managers, assign them to states, and manage their profiles</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" icon={MapPin} onClick={() => setShowAssign(true)}>Assign State</Button>
                        <Button icon={UserPlus} onClick={() => setShowCreate(true)}>Add Manager</Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Managers', value: managerList.length, icon: UserPlus, color: 'from-royal-600 to-royal-500' },
                        { label: 'States Covered', value: totalCities, icon: MapPin, color: 'from-emerald-600 to-emerald-500' },
                        { label: 'Active Listings', value: totalListings, icon: Building2, color: 'from-blue-600 to-blue-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-display font-bold text-text-primary">{value}</p>
                                    <p className="text-xs text-text-secondary">{label}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or state..."
                        className="w-full sm:w-96 bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-royal-500/50"
                    />
                </div>

                {/* Manager Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {managerList.map((m) => (
                        <Card key={m.id} hover>
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={m.name} size="md" />
                                        <div>
                                            <h3 className="text-sm font-semibold text-text-primary">{m.name}</h3>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Mail className="w-3 h-3 text-text-muted" />
                                                <p className="text-xs text-text-muted">{m.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => { setShowDetail(m); setEditCity(''); }}
                                            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-royal-400 transition-colors"
                                            title="View / Edit"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete manager ${m.name}?`)) deleteMutation.mutate(m.id);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-text-muted" />
                                    <span className="text-xs text-text-secondary">{m.phone || 'N/A'}</span>
                                </div>

                                {/* Cities */}
                                <div>
                                    <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-medium">Assigned States</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {m.cities?.map((c) => (
                                            <Badge key={c} variant="royal" className="pr-1">
                                                <MapPin className="w-3 h-3 mr-1" />{c}
                                                <button
                                                    onClick={() => unassignMutation.mutate({ managerId: m.id, city: c })}
                                                    disabled={unassignMutation.isPending}
                                                    className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                                                    title="Remove state"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {(!m.cities || m.cities.length === 0) && (
                                            <span className="text-xs text-text-muted italic">No states assigned</span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                                    <span className="text-xs text-text-muted">
                                        <Building2 className="w-3 h-3 inline mr-1" />{m.activeListings || 0} listings
                                    </span>
                                    <Badge variant={m.status === 'active' || !m.status ? 'success' : 'danger'} dot>
                                        {m.status || 'active'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {managerList.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                            <UserPlus className="w-8 h-8 text-text-muted" />
                        </div>
                        <p className="text-text-secondary mb-4">No managers yet</p>
                        <Button icon={UserPlus} onClick={() => setShowCreate(true)}>Create First Manager</Button>
                    </div>
                )}

                {/* ── Create Manager Modal ── */}
                <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Manager" size="md">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Full Name *"
                                placeholder="e.g. Rahul Sharma"
                                value={createForm.name}
                                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                            />
                            <Input
                                label="Phone *"
                                placeholder="9876543210"
                                icon={Phone}
                                value={createForm.phone}
                                onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                            />
                        </div>
                        <Input
                            label="Email *"
                            type="email"
                            placeholder="manager@squarefeetx.com"
                            icon={Mail}
                            value={createForm.email}
                            onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Default: Manager@123"
                            icon={Lock}
                            value={createForm.password}
                            onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                        />
                        <Select
                            label="Assigned State"
                            options={[
                                { value: '', label: 'Select State' },
                                ...STATES
                            ]}
                            value={createForm.cities}
                            onChange={(e) => setCreateForm(f => ({ ...f, cities: e.target.value }))}
                        />
                        <div className="p-3 rounded-xl bg-royal-500/10 border border-royal-500/20">
                            <p className="text-xs text-royal-300">
                                The manager will be able to log in with their email and the password above. They can review property listings for their assigned states.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button
                                icon={UserPlus}
                                onClick={handleCreate}
                                isLoading={createMutation.isPending}
                                disabled={!createForm.name || !createForm.email || !createForm.phone}
                            >
                                Save Manager
                            </Button>
                        </div>
                    </div>
                </Modal>
 
                {/* ── Assign City Modal ── */}
                <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign State to Manager" size="sm">
                    <div className="space-y-4">
                        <Select label="Manager" options={managerOptions} value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} />
                        <Select
                            label="State"
                            options={[
                                { value: '', label: 'Select State' },
                                ...STATES
                            ]}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
                            <Button
                                onClick={() => assignMutation.mutate({ managerId: selectedManager, city })}
                                isLoading={assignMutation.isPending}
                                disabled={!selectedManager || !city}
                            >
                                Assign
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* ── Manager Detail/Edit Modal ── */}
                <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Manager Details & Settings" size="md">
                    {showDetail && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <Avatar name={showDetail.name} size="lg" />
                                <div>
                                    <h3 className="text-lg font-semibold text-text-primary">{showDetail.name}</h3>
                                    <p className="text-sm text-text-muted">{showDetail.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-card p-3 rounded-xl">
                                    <p className="text-xs text-text-muted mb-1">Phone</p>
                                    <p className="text-sm text-text-primary font-medium">{showDetail.phone || 'N/A'}</p>
                                </div>
                                <div className="glass-card p-3 rounded-xl">
                                    <p className="text-xs text-text-muted mb-1">Active Listings</p>
                                    <p className="text-sm text-text-primary font-medium">{showDetail.activeListings || 0}</p>
                                </div>
                                <div className="glass-card p-3 rounded-xl">
                                    <p className="text-xs text-text-muted mb-1">Status</p>
                                    <Badge variant={showDetail.status === 'active' || !showDetail.status ? 'success' : 'danger'} dot>
                                        {showDetail.status || 'active'}
                                    </Badge>
                                </div>
                                <div className="glass-card p-3 rounded-xl">
                                    <p className="text-xs text-text-muted mb-1">Joined</p>
                                    <p className="text-sm text-text-primary font-medium">{formatDate(showDetail.createdAt)}</p>
                                </div>
                            </div>

                            {/* Cities Management */}
                            <div>
                                <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-medium">
                                    Assigned States ({showDetail.cities?.length || 0})
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {showDetail.cities?.map((c) => (
                                        <Badge key={c} variant="royal" className="pr-1">
                                            <MapPin className="w-3 h-3 mr-1" />{c}
                                            <button
                                                onClick={() => {
                                                    unassignMutation.mutate({ managerId: showDetail.id, city: c });
                                                    setShowDetail(prev => ({
                                                        ...prev,
                                                        cities: prev.cities.filter(x => x !== c)
                                                    }));
                                                }}
                                                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {(!showDetail.cities || showDetail.cities.length === 0) && (
                                        <span className="text-xs text-text-muted italic">No states assigned</span>
                                    )}
                                </div>
                                {/* Add new city inline */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Select
                                            label="Add State"
                                            options={[
                                                { value: '', label: 'Select State' },
                                                ...STATES
                                            ]}
                                            value={editCity}
                                            onChange={(e) => setEditCity(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddCityToManager}
                                        disabled={!editCity}
                                        className="px-3 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-sm disabled:opacity-50 transition-all flex items-center gap-1 h-[42px]"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button
                                    variant="danger"
                                    icon={Trash2}
                                    onClick={() => {
                                        if (window.confirm(`Delete manager ${showDetail.name}?`)) {
                                            deleteMutation.mutate(showDetail.id);
                                        }
                                    }}
                                    isLoading={deleteMutation.isPending}
                                >
                                    Delete Manager
                                </Button>
                                <Button variant="secondary" onClick={() => setShowDetail(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </>
    );
};

export default ManagerAssignment;
