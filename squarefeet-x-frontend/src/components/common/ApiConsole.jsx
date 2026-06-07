import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Terminal, X, Search, Trash2, Copy, Check, 
    Activity, FileText, ChevronDown, ChevronUp, Network,
    RefreshCw
} from 'lucide-react';
import { useApiLogStore } from '../../store/apiLogStore';

export default function ApiConsole() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [activeTab, setActiveTab] = useState('response'); // 'request' | 'response' | 'headers'

    const { logs, clearLogs } = useApiLogStore();

    const filteredLogs = logs.filter(
        (log) =>
            log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getMethodBg = (method) => {
        switch (method) {
            case 'GET': return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
            case 'POST': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'PUT': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            case 'DELETE': return 'bg-red-500/20 text-red-400 border border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    const getStatusBg = (status) => {
        if (typeof status === 'string' && status.includes('Pending')) {
            return 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse';
        }
        const statusCode = Number(status);
        if (statusCode >= 200 && statusCode < 300) {
            return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        }
        if (statusCode >= 400 && statusCode < 500) {
            return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        }
        if (statusCode >= 500 || status === 'Network Error') {
            return 'bg-red-500/20 text-red-400 border border-red-500/30';
        }
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    };

    const selectedLog = logs.find(l => l.id === selectedLogId);

    return (
        <>
            {/* Floating Developer Widget Launcher */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-royal-600 to-indigo-600 hover:from-royal-500 hover:to-indigo-500 text-white rounded-full p-3.5 shadow-2xl shadow-royal-500/30 border border-royal-400/40 flex items-center justify-center cursor-pointer group"
                title="Open API Traffic Console"
            >
                <div className="relative">
                    <Activity className="w-5 h-5 animate-pulse group-hover:rotate-12 transition-transform" />
                    {logs.filter(l => l.status === 'Pending').length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-surface-dark animate-ping" />
                    )}
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 text-xs font-bold transition-all duration-300 whitespace-nowrap">
                    API Console ({logs.length})
                </span>
            </motion.button>

            {/* Slide-out Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex justify-end"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-2xl bg-surface-dark border-l border-surface-border h-full shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Panel Header */}
                            <div className="p-4 border-b border-surface-border bg-surface-card flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-royal-500/10 border border-royal-500/20 text-royal-400">
                                        <Network className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-text-primary">API Traffic Console</h2>
                                        <p className="text-[10px] text-text-muted">Real-time HTTP request & response inspector</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {logs.length > 0 && (
                                        <button
                                            onClick={clearLogs}
                                            className="p-2 text-xs text-text-muted hover:text-red-400 hover:bg-surface-hover rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                            title="Clear logs"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Clear</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Search bar */}
                            <div className="p-3 border-b border-surface-border bg-surface-card/50 flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Filter by endpoint path or method..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-surface-dark border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-royal-500"
                                    />
                                    {searchTerm && (
                                        <button 
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Main Split Layout */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Logs List */}
                                <div className={`flex-1 overflow-y-auto divide-y divide-surface-border/60 ${selectedLogId ? 'hidden md:block md:w-1/2 border-r border-surface-border' : 'w-full'}`}>
                                    {filteredLogs.length === 0 ? (
                                        <div className="text-center py-12 px-4">
                                            <Terminal className="w-10 h-10 text-text-muted mx-auto mb-3" />
                                            <p className="text-xs text-text-secondary font-medium">No API requests captured</p>
                                            <p className="text-[10px] text-text-muted mt-1">Interact with the web app pages to trigger APIs</p>
                                        </div>
                                    ) : (
                                        filteredLogs.map((log) => {
                                            const isSelected = log.id === selectedLogId;
                                            return (
                                                <div
                                                    key={log.id}
                                                    onClick={() => setSelectedLogId(log.id)}
                                                    className={`p-3 text-left transition-all cursor-pointer flex flex-col gap-1.5 ${isSelected ? 'bg-royal-500/10 border-l-2 border-royal-500' : 'hover:bg-surface-hover/50'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${getMethodBg(log.method)}`}>
                                                                {log.method}
                                                            </span>
                                                            <span className="text-xs font-semibold text-text-secondary truncate shrink-0 max-w-[200px]" title={log.url}>
                                                                {log.url.split('?')[0]}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${getStatusBg(log.status)}`}>
                                                            {log.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                                                        <span>{log.timestamp}</span>
                                                        {log.duration !== null && (
                                                            <span className="font-mono">{log.duration}ms</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Inspector Panel */}
                                {selectedLog && (
                                    <div className="w-full md:w-1/2 flex flex-col bg-surface-card overflow-hidden">
                                        {/* Inspector Header */}
                                        <div className="p-3 border-b border-surface-border flex items-center justify-between bg-surface-dark/40">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${getMethodBg(selectedLog.method)}`}>
                                                    {selectedLog.method}
                                                </span>
                                                <span className="text-xs font-bold text-text-primary truncate max-w-[180px]" title={selectedLog.url}>
                                                    {selectedLog.url}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedLogId(null)}
                                                className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-surface-hover"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Info summary */}
                                        <div className="p-3 border-b border-surface-border text-[11px] text-text-secondary grid grid-cols-2 gap-2 bg-surface-dark/20">
                                            <div>
                                                <span className="text-[10px] text-text-muted block">Status Code</span>
                                                <span className={`font-semibold ${selectedLog.status >= 200 && selectedLog.status < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {selectedLog.status}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-text-muted block">Execution Duration</span>
                                                <span className="font-semibold text-text-primary font-mono">
                                                    {selectedLog.duration ? `${selectedLog.duration} ms` : 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Payload Tabs */}
                                        <div className="flex border-b border-surface-border bg-surface-dark/10">
                                            <button
                                                onClick={() => setActiveTab('response')}
                                                className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${activeTab === 'response' ? 'border-royal-500 text-royal-400' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
                                            >
                                                Response Body
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('request')}
                                                className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${activeTab === 'request' ? 'border-royal-500 text-royal-400' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
                                            >
                                                Request Body
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('headers')}
                                                className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${activeTab === 'headers' ? 'border-royal-500 text-royal-400' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
                                            >
                                                Headers
                                            </button>
                                        </div>

                                        {/* Log Tab Content */}
                                        <div className="flex-1 p-3 overflow-auto font-mono text-[10px] text-left">
                                            <AnimatePresence mode="wait">
                                                {activeTab === 'response' && (
                                                    <motion.div
                                                        key="response"
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="relative h-full"
                                                    >
                                                        {selectedLog.responseBody ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleCopy(JSON.stringify(selectedLog.responseBody, null, 2), 'response')}
                                                                    className="absolute top-1 right-1 p-1 bg-surface-card border border-surface-border text-text-muted hover:text-text-primary rounded-md transition-all cursor-pointer z-10"
                                                                    title="Copy Response Data"
                                                                >
                                                                    {copiedId === 'response' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <pre className="p-3 bg-surface-dark border border-surface-border rounded-xl overflow-x-auto text-sky-300 text-left select-all whitespace-pre-wrap break-all max-h-[400px]">
                                                                    {JSON.stringify(selectedLog.responseBody, null, 2)}
                                                                </pre>
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-12 text-text-muted font-sans">
                                                                {selectedLog.status === 'Pending' ? (
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                                                                        <span>Waiting for API response...</span>
                                                                    </div>
                                                                ) : (
                                                                    <span>No response payload returned</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}

                                                {activeTab === 'request' && (
                                                    <motion.div
                                                        key="request"
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="relative h-full"
                                                    >
                                                        {selectedLog.requestBody ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleCopy(JSON.stringify(selectedLog.requestBody, null, 2), 'request')}
                                                                    className="absolute top-1 right-1 p-1 bg-surface-card border border-surface-border text-text-muted hover:text-text-primary rounded-md transition-all cursor-pointer z-10"
                                                                    title="Copy Request Body"
                                                                >
                                                                    {copiedId === 'request' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <pre className="p-3 bg-surface-dark border border-surface-border rounded-xl overflow-x-auto text-amber-300 text-left select-all whitespace-pre-wrap break-all max-h-[400px]">
                                                                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                                                                </pre>
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-12 text-text-muted font-sans">
                                                                No request payload sent for this request type
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}

                                                {activeTab === 'headers' && (
                                                    <motion.div
                                                        key="headers"
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="relative h-full"
                                                    >
                                                        <button
                                                            onClick={() => handleCopy(JSON.stringify(selectedLog.requestHeaders, null, 2), 'headers')}
                                                            className="absolute top-1 right-1 p-1 bg-surface-card border border-surface-border text-text-muted hover:text-text-primary rounded-md transition-all cursor-pointer z-10"
                                                            title="Copy Headers"
                                                        >
                                                            {copiedId === 'headers' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <pre className="p-3 bg-surface-dark border border-surface-border rounded-xl overflow-x-auto text-emerald-300 text-left select-all whitespace-pre-wrap break-all max-h-[400px]">
                                                            {JSON.stringify(selectedLog.requestHeaders, null, 2)}
                                                        </pre>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
