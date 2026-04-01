import React, { useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Trash, Plus, CircleNotch } from 'phosphor-react';
import { uploadSongAudio, uploadSongCover } from '../../services/api';

export default function AdminSongs() {
    const { songs, addSong, showConfirm, showToast } = usePlayerStore();
    const [isAdding, setIsAdding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [duration, setDuration] = useState('3:00');
    const [lyricsInput, setLyricsInput] = useState('');
    
    // File upload refs
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const localUrl = URL.createObjectURL(file);
        if (type === 'audio') {
            setAudioUrl(localUrl);
            setAudioFile(file);
        } else if (type === 'cover') {
            setCoverUrl(localUrl);
            setCoverFile(file);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!title || !artist || !coverUrl || !audioUrl) {
            alert("Please fill in all required fields.");
            return;
        }

        setIsUploading(true);
        try {
            let finalAudioUrl = audioUrl;
            let finalCoverUrl = coverUrl;

            // Upload files if they were chosen locally
            if (audioFile) {
                const fileName = `song_${Date.now()}_${audioFile.name}`;
                const { data, error } = await uploadSongAudio(audioFile, fileName);
                if (error) throw new Error(`Audio upload failed: ${error}`);
                finalAudioUrl = data;
            }

            if (coverFile) {
                const fileName = `cover_${Date.now()}_${coverFile.name}`;
                const { data, error } = await uploadSongCover(coverFile, fileName);
                if (error) throw new Error(`Cover upload failed: ${error}`);
                finalCoverUrl = data;
            }

            // Parse lyrics text to array of objects { time: 0, text: line }
            // Note: In admin we only support plain lyrics text for now, no sync.
            const parsedLyrics = lyricsInput
                .split('\n')
                .map(line => line.trim())
                .filter(line => line)
                .map((text, i) => ({ time: i * 4, text })); // fallback spacing

            const newSong = {
                id: `song-${Date.now()}`,
                title,
                artist,
                album: album || "Single",
                coverUrl: finalCoverUrl,
                audioUrl: finalAudioUrl,
                duration,
                lyrics: parsedLyrics,
                dateAdded: new Date().toISOString(),
                desc: "Added by Admin"
            };
            
            addSong(newSong);
            showToast("Song added successfully to Supabase!");
            setIsAdding(false);
            
            // Reset form
            setTitle(''); setArtist(''); setAlbum(''); setCoverUrl(''); setAudioUrl(''); setLyricsInput('');
            setAudioFile(null); setCoverFile(null);
        } catch (err) {
            console.error("Upload Error:", err);
            alert(`Failed to add song: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (id) => {
        showConfirm(
            "Are you sure you want to delete this song? It will be removed from all playlists.",
            'DELETE_SONG',
            id
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ marginBottom: '8px' }}>Manage Songs</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Add or remove tracks from the global application catalog.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{
                        background: isAdding ? 'var(--bg-glass-hover)' : 'var(--accent-color)',
                        color: isAdding ? '#fff' : '#000',
                        padding: '12px 24px',
                        borderRadius: '24px',
                        fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {isAdding ? 'Cancel' : <><Plus size={20} weight="bold" /> Add New Song</>}
                </button>
            </div>

            {isAdding && (
                <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent-color)', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--accent-color)' }}>Add New Track</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.4' }}>
                        <strong style={{ color: 'var(--accent-color)' }}>UPLOADING TO SUPABASE:</strong> Your songs are now uploaded permanently to Supabase Storage.
                    </p>
                    <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Song Title *</label>
                            <input className="admin-input" placeholder="e.g. Moonlight Sonata" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Artist Name *</label>
                            <input className="admin-input" placeholder="e.g. Beethoven" value={artist} onChange={e => setArtist(e.target.value)} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Album Name</label>
                            <input className="admin-input" placeholder="e.g. Classic Hits" value={album} onChange={e => setAlbum(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Duration</label>
                            <input className="admin-input" placeholder="e.g. 3:45" value={duration} onChange={e => setDuration(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Plain Text Lyrics (Optional)</label>
                            <textarea 
                                className="admin-input" 
                                placeholder="Paste song lyrics here... (Line by line, no timestamps)" 
                                value={lyricsInput} 
                                onChange={e => setLyricsInput(e.target.value)} 
                                style={{ height: '120px', resize: 'vertical', fontFamily: 'monospace' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Leave empty to auto-fetch from LRCLIB.</span>
                        </div>

                        {/* Cover Image Group */}
                        <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>Cover Image *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                                <input className="admin-input" placeholder="Paste Image URL here..." value={coverUrl} onChange={e => setCoverUrl(e.target.value)} required />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px' }}>OR</span>
                                    <label className="file-upload-btn">
                                        Choose Local Image
                                        <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'cover')} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Audio File Group */}
                        <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>Audio Source (MP3) *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                                <input className="admin-input" placeholder="Paste MP3 URL here..." value={audioUrl} onChange={e => setAudioUrl(e.target.value)} required />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px' }}>OR</span>
                                    <label className="file-upload-btn">
                                        Upload MP3 File
                                        <input type="file" accept="audio/*" onChange={e => handleFileChange(e, 'audio')} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button 
                                type="submit" 
                                disabled={isUploading}
                                style={{ 
                                    background: isUploading ? 'var(--bg-glass-hover)' : 'var(--accent-color)', 
                                    color: isUploading ? '#fff' : '#000', 
                                    padding: '12px 32px', 
                                    borderRadius: '24px', 
                                    fontWeight: 'bold', 
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isUploading ? <><CircleNotch size={20} className="spin" /> Saving...</> : 'Save Song'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table className="song-list-table" style={{ margin: 0 }}>
                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <tr>
                            <th style={{ padding: '16px' }}>Cover</th>
                            <th>Title & Artist</th>
                            <th>Album</th>
                            <th>Audio URL</th>
                            <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {songs.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No songs in catalog.</td></tr>
                        ) : (
                            songs.map(song => (
                                <tr key={song.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 16px' }}><img src={song.coverUrl} alt="cover" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} /></td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold' }}>{song.title}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.artist}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{song.album}</td>
                                    <td style={{ maxWidth: '200px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <p className="text-ellipsis" style={{ fontSize: '11px', color: 'var(--accent-color)', margin: 0 }}>{song.audioUrl}</p>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                                        <button onClick={() => handleDelete(song.id)} style={{ background: 'transparent', color: '#ff4444', padding: '8px', cursor: 'pointer' }} title="Delete Song">
                                            <Trash size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .admin-input {
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid var(--bg-glass-border);
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .admin-input:focus {
                    border-color: var(--accent-color);
                }
                .file-upload-btn {
                    display: inline-block;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .file-upload-btn:hover {
                    background: var(--accent-color);
                    color: #000;
                    border-color: var(--accent-color);
                }
            `}</style>
        </div>
    );
}
