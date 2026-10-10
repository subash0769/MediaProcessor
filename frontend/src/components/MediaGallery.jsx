import React from 'react';

export default function MediaGallery({ mediaItems, apiBase, onDelete, onReprocess }) {
  if (mediaItems.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>No media files uploaded yet</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Upload an image to test background processing and thumbnail extraction!
        </div>
      </div>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="media-list">
      {mediaItems.map((item) => (
        <div key={item.id} className="media-card">
          <div className="thumbnail-box">
            {item.status === 'COMPLETED' && item.thumbnail_path ? (
              <img
                src={`${apiBase}/static/uploads/thumbnails/${item.thumbnail_path}`}
                alt={item.filename}
                className="thumbnail-img"
              />
            ) : item.status === 'PROCESSING' ? (
              <div className="thumbnail-placeholder">
                <span style={{ fontSize: '2rem' }}>⚙️</span>
                <span>Generating thumbnail...</span>
              </div>
            ) : item.status === 'FAILED' ? (
              <div className="thumbnail-placeholder" style={{ color: 'var(--danger)' }}>
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <span>Processing failed</span>
              </div>
            ) : (
              <div className="thumbnail-placeholder">
                <span style={{ fontSize: '2rem' }}>⏳</span>
                <span>In queue...</span>
              </div>
            )}
          </div>

          <div className="media-info">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className={`badge badge-${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatBytes(item.file_size)}
                </span>
              </div>

              <div className="media-title" title={item.filename}>
                {item.filename}
              </div>

              <div className="media-meta">
                {item.status === 'COMPLETED' ? (
                  <>
                    <span>📐 {item.width} × {item.height} px</span>
                    <span>🎨 {item.format} ({item.color_mode})</span>
                  </>
                ) : item.status === 'FAILED' ? (
                  <span style={{ color: 'var(--danger)' }}>Error: {item.error_message || 'Unknown error'}</span>
                ) : (
                  <span>Awaiting worker...</span>
                )}
              </div>
            </div>

            <div className="card-actions">
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => onReprocess(item.id)}
                title="Send task back to Redis queue"
              >
                🔄 Reprocess
              </button>
              <button
                className="btn-danger"
                onClick={() => onDelete(item.id)}
                title="Delete media and files"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
