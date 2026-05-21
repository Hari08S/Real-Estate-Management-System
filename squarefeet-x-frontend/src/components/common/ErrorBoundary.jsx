import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-8">
                    <div className="text-center space-y-5 max-w-md">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-display font-semibold text-text-primary">Something went wrong</h2>
                        <p className="text-text-secondary text-sm">{this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}</p>
                        <pre className="text-left text-xs bg-black/50 p-4 rounded overflow-auto text-red-400 mt-4">{this.state.error?.stack}</pre>
                        <Button
                            onClick={() => window.location.reload()}
                            icon={RefreshCw}
                        >
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
