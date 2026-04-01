import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Trash, Play, ListNumbers } from 'phosphor-react';

export default function Queue() {
    const { queue, currentSong, setCurrentSong, removeFromQueue, clearQueue, playbackHistory } = usePlayerStore();

    return (
        <div className="queue-page">
            <h1 className="page-title">Queue</h1>

            <section className="queue-section">
                <h2 className="section-title">Now Playing</h2>
                {currentSong ? (
                    <div className="song-row active-queue-item">
                        <img src={currentSong.coverUrl} alt={currentSong.title} className="song-img" />
                        <div className="song-info">
                            <div className="song-name">{currentSong.title}</div>
                            <div className="song-artist">{currentSong.artist}</div>
                        </div>
                    </div>
                ) : (
                    <p className="empty-text">No song playing</p>
                )}
            </section>

            <section className="queue-section">
                <div className="section-header">
                    <h2 className="section-title">Next In Queue</h2>
                    {queue.length > 0 && (
                        <button className="clear-btn" onClick={clearQueue}>Clear queue</button>
                    )}
                </div>

                {queue.length > 0 ? (
                    <div className="queue-list">
                        {queue.map((song, index) => (
                            <div key={`${song.id}-${index}`} className="song-row queue-item">
                                <div className="song-index">{index + 1}</div>
                                <img src={song.coverUrl} alt={song.title} className="song-img" />
                                <div className="song-info">
                                    <div className="song-name">{song.title}</div>
                                    <div className="song-artist">{song.artist}</div>
                                </div>
                                <div className="song-actions">
                                    <button onClick={() => {
                                        removeFromQueue(index);
                                        setCurrentSong(song);
                                    }} className="icon-btn" title="Play Now">
                                        <Play size={18} weight="fill" />
                                    </button>
                                    <button onClick={() => removeFromQueue(index)} className="icon-btn" title="Remove from queue">
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-text">Queue is empty. Add songs via right-click!</p>
                )}
            </section>

            {playbackHistory.length > 0 && (
                <section className="queue-section">
                    <h2 className="section-title">Recently Played</h2>
                    <div className="queue-list">
                        {playbackHistory.map((song, index) => (
                            <div key={`history-${song.id}-${index}`} className="song-row history-item">
                                <img src={song.coverUrl} alt={song.title} className="song-img" />
                                <div className="song-info">
                                    <div className="song-name">{song.title}</div>
                                    <div className="song-artist">{song.artist}</div>
                                </div>
                                <button onClick={() => setCurrentSong(song)} className="icon-btn">
                                    <Play size={18} weight="fill" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <style>{`
                .queue-page {
                    padding: 32px;
                    animation: fadeIn 0.4s ease;
                }
                .page-title {
                    font-size: 24px;
                    margin-bottom: 32px;
                    font-weight: 800;
                }
                .queue-section {
                    margin-bottom: 40px;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-secondary);
                }
                .empty-text {
                    color: var(--text-tertiary);
                    font-size: 14px;
                }
                .clear-btn {
                    background: transparent;
                    border: 1px solid var(--text-tertiary);
                    color: var(--text-primary);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }
                .clear-btn:hover {
                    border-color: var(--text-primary);
                    transform: scale(1.05);
                }
                .song-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 8px 16px;
                    border-radius: 8px;
                    transition: background 0.2s;
                }
                .song-row:hover {
                    background: var(--bg-glass-hover);
                }
                .active-queue-item {
                    background: rgba(255, 255, 255, 0.05);
                }
                .song-img {
                    width: 48px;
                    height: 48px;
                    border-radius: 4px;
                    object-fit: cover;
                }
                .song-info {
                    flex: 1;
                }
                .song-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .song-artist {
                    font-size: 14px;
                    color: var(--text-secondary);
                }
                .song-index {
                    width: 24px;
                    color: var(--text-tertiary);
                    font-variant-numeric: tabular-nums;
                }
                .song-actions {
                    display: flex;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .song-row:hover .song-actions {
                    opacity: 1;
                }
                .icon-btn {
                    background: transparent;
                    color: var(--text-secondary);
                    padding: 8px;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .icon-btn:hover {
                    color: var(--text-primary);
                    background: rgba(255, 255, 255, 0.1);
                }
                .history-item {
                    opacity: 0.7;
                }
            `}</style>
        </div>
    );
}
