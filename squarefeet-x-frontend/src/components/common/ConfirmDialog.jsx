import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', variant = 'danger', isLoading = false }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-text-secondary text-sm">{message}</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>{confirmText}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
