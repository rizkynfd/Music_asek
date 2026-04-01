import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { X, PencilSimple, LockSimple, LockOpen } from 'phosphor-react';

export default function EditPlaylistModal() {
    const { editModal, closeEditModal, playlists, editPlaylist } = usePlayerStore();

    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [coverHover, setCoverHover] = useState(false);
    const nameRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 300;
                
                canvas.width = MAX_SIZE;
                canvas.height = MAX_SIZE;

                const ctx = canvas.getContext('2d');
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;
                
                // Crop to perfect square and resize to 300x300
                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
                
                setCoverUrl(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (editModal.isOpen && editModal.playlistId) {
            const playlist = playlists.find(p => p.id === editModal.playlistId);
            if (playlist) {
                setName(playlist.name || '');
                setDesc(playlist.desc || '');
                setCoverUrl(playlist.coverUrl || '');
                setIsPrivate(playlist.isPrivate || false);
            }
            setTimeout(() => nameRef.current?.focus(), 50);
        }
    }, [editModal.isOpen, editModal.playlistId, playlists]);

    if (!editModal.isOpen) return null;

    const defaultCover = null; // intentionally null to show placeholder

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        editPlaylist(editModal.playlistId, { name, desc, coverUrl, isPrivate });
        closeEditModal();
    };

    const coverDisplay = coverUrl || defaultCover;

    return (
        <div className="epm-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
            <div className="epm-card">
                {/* Header */}
                <div className="epm-header">
                    <h2 className="epm-title">Edit details</h2>
                    <button className="epm-close" onClick={closeEditModal} aria-label="Close">
                        <X size={20} weight="bold" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="epm-body">
                        {/* Cover Photo */}
                        <div
                            className={`epm-cover-wrap ${coverHover ? 'hovered' : ''}`}
                            onMouseEnter={() => setCoverHover(true)}
                            onMouseLeave={() => setCoverHover(false)}
                            onClick={() => fileInputRef.current?.click()}
                            title="Choose photo"
                        >
                            {coverDisplay ? (
                                <img src={coverDisplay} alt="Playlist cover" className="epm-cover-img"
                                    onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                                <div className="epm-cover-placeholder">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 3H15L17 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V6C2 5.44772 2.44772 5 3 5H7L9 3Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                                        <circle cx="12" cy="13" r="3.5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                                    </svg>
                                    <span className="epm-cover-placeholder-text">Choose photo</span>
                                </div>
                            )}
                            <div className="epm-cover-overlay">
                                <PencilSimple size={28} weight="fill" />
                                <span>Choose photo</span>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="epm-fields">
                            <input
                                ref={nameRef}
                                type="text"
                                className="epm-input"
                                placeholder="Add a name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                maxLength={100}
                            />
                            <textarea
                                className="epm-input epm-textarea"
                                placeholder="Add an optional description"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                rows={3}
                                maxLength={300}
                            />
                        </div>
                    </div>

                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                    />

                    {/* Footer */}
                    <div className="epm-footer">
                        <button
                            type="button"
                            className={`epm-privacy-btn ${isPrivate ? 'private' : ''}`}
                            onClick={() => setIsPrivate(v => !v)}
                        >
                            {isPrivate
                                ? <><LockSimple size={15} weight="fill" /> Make public</>
                                : <><LockOpen size={15} weight="fill" /> Make private</>
                            }
                        </button>
                        <button type="submit" className="epm-save-btn">Save</button>
                    </div>

                    <p className="epm-disclaimer">
                        By proceeding, you agree to give SpotiClone access to the image you choose to upload.
                        Please make sure you have the right to upload the image.
                    </p>
                </form>
            </div>

            <style>{`
                .epm-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10000;
                    animation: epmFadeIn 0.15s ease;
                }
                @keyframes epmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .epm-card {
                    background: #282828;
                    border-radius: 8px;
                    width: 524px;
                    max-width: calc(100vw - 32px);
                    padding: 24px;
                    animation: epmSlideIn 0.2s cubic-bezier(.2,.8,.4,1);
                    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
                }
                @keyframes epmSlideIn {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .epm-header {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 20px;
                }
                .epm-title {
                    font-size: 24px; font-weight: 700;
                    color: #fff; letter-spacing: -0.3px;
                }
                .epm-close {
                    width: 32px; height: 32px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #b3b3b3; background: transparent;
                    transition: color 0.15s, background 0.15s;
                    cursor: pointer;
                }
                .epm-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

                .epm-body {
                    display: flex; gap: 16px; align-items: flex-start;
                }

                /* Cover */
                .epm-cover-wrap {
                    width: 180px; height: 180px; flex-shrink: 0; border-radius: 4px;
                    position: relative; cursor: pointer; overflow: hidden;
                    background: #3e3e3e;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                    transition: box-shadow 0.2s;
                }
                .epm-cover-wrap:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.6); }
                .epm-cover-img {
                    width: 100%; height: 100%; object-fit: cover; display: block;
                }
                .epm-cover-placeholder {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 8px; color: rgba(255,255,255,0.4);
                }
                .epm-cover-placeholder-text {
                    font-size: 13px; font-weight: 600;
                }
                .epm-cover-overlay {
                    position: absolute; inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 8px; color: #fff; font-size: 13px; font-weight: 700;
                    opacity: 0; transition: opacity 0.2s;
                }
                .epm-cover-wrap.hovered .epm-cover-overlay,
                .epm-cover-wrap:hover .epm-cover-overlay { opacity: 1; }

                /* Fields */
                .epm-fields {
                    flex: 1; display: flex; flex-direction: column; gap: 8px;
                }
                .epm-input {
                    width: 100%; padding: 10px 12px;
                    background: #3e3e3e; border: none; border-radius: 4px;
                    color: #fff; font-size: 14px; font-family: inherit;
                    outline: none; resize: none;
                    transition: background 0.15s, box-shadow 0.15s;
                    box-sizing: border-box;
                }
                .epm-input::placeholder { color: #6a6a6a; }
                .epm-input:focus {
                    background: #3e3e3e;
                    box-shadow: 0 0 0 2px #fff;
                }
                .epm-textarea { height: 135px; resize: none; }

                /* URL row */
                .epm-url-row {
                    margin-top: 10px;
                }

                /* Footer */
                .epm-footer {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-top: 20px;
                }
                .epm-privacy-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 8px 16px; border-radius: 20px;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.3);
                    color: #fff; background: transparent;
                    transition: background 0.15s, border-color 0.15s;
                    letter-spacing: 0.2px;
                }
                .epm-privacy-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.6);
                }
                .epm-privacy-btn.private {
                    border-color: var(--accent-color, #1ed760);
                    color: var(--accent-color, #1ed760);
                }
                .epm-save-btn {
                    padding: 12px 32px; border-radius: 32px;
                    background: #fff; color: #000;
                    font-size: 15px; font-weight: 700;
                    cursor: pointer; transition: transform 0.1s, background 0.15s;
                    letter-spacing: 0.2px;
                }
                .epm-save-btn:hover {
                    transform: scale(1.03);
                    background: #f0f0f0;
                }

                .epm-disclaimer {
                    font-size: 11px; color: #a7a7a7;
                    margin-top: 14px; line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
