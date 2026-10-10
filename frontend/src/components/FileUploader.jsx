import React, { useState, useRef } from 'react';

export default function FileUploader({ apiBase, onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${apiBase}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Upload failed');
      }

      const created = await res.json();
      onUploadSuccess(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="card">
      <div className="card-title">📤 Upload New Media</div>
      <div
        className={`dropzone ${dragging ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon">
          {uploading ? '⏳' : '📁'}
        </div>
        <p style={{ fontWeight: 600 }}>
          {uploading ? 'Uploading & Enqueuing...' : 'Click to browse or drop image here'}
        </p>
        <p className="file-hint">Supports PNG, JPG, JPEG, WEBP, GIF</p>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginTop: 12, fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
