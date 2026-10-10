import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import MediaGallery from './components/MediaGallery';
import TaskStatus from './components/TaskStatus';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/media`);
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    // Poll every 2.5s for real-time background worker task updates
    const interval = setInterval(fetchMedia, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleUploadSuccess = (newItem) => {
    setMediaItems((prev) => [newItem, ...prev]);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMediaItems((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete media:', err);
    }
  };

  const handleReprocess = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/media/${id}/reprocess`, { method: 'POST' });
      if (res.ok) {
        fetchMedia();
      }
    } catch (err) {
      console.error('Failed to reprocess media:', err);
    }
  };

  return (
    <div className="container">
      <header>
        <div className="logo-badge">
          <div className="logo-icon">🖼️</div>
          <div>
            <h1>PixelForge</h1>
            <p className="subtitle">Distributed Media & Image Processing Service</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Backend API:</span>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: 'var(--accent)' }}>
            {API_BASE}
          </div>
        </div>
      </header>

      <div className="grid-layout">
        <div>
          <FileUploader apiBase={API_BASE} onUploadSuccess={handleUploadSuccess} />
          <TaskStatus mediaItems={mediaItems} />
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 20 }}>
            📚 Media Library ({mediaItems.length})
          </div>
          {loading && mediaItems.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              Connecting to PixelForge API...
            </div>
          ) : (
            <MediaGallery
              mediaItems={mediaItems}
              apiBase={API_BASE}
              onDelete={handleDelete}
              onReprocess={handleReprocess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
