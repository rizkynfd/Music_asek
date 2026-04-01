import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { WarningCircle } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import '../ConfirmModal.css';

export default function ConfirmModal() {
    const { confirmDialog, closeConfirm, deletePlaylist, deleteSong, showToast } = usePlayerStore();
    const navigate = useNavigate();

    if (!confirmDialog.isOpen) return null;

    const handleConfirm = () => {
        const { actionType, payload } = confirmDialog;
        
        // Close the modal immediately to provide instant feedback
        closeConfirm();

        if (actionType === 'DELETE_PLAYLIST') {
            deletePlaylist(payload);
            showToast("Playlist deleted successfully");
            navigate('/');
        } else if (actionType === 'DELETE_SONG') {
            deleteSong(payload);
            showToast("Song deleted successfully");
        }
    };

    const handleCancel = () => {
        closeConfirm();
    };

    return (
        <div className="modal-overlay">
            <div className="confirm-modal glass-panel">
                <div className="confirm-icon">
                    <WarningCircle size={48} color="var(--accent-color)" weight="duotone" />
                </div>
                <h3 className="confirm-title">Are you sure?</h3>
                <p className="confirm-message">{confirmDialog.message}</p>

                <div className="confirm-actions">
                    <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="btn-confirm" onClick={handleConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
}
