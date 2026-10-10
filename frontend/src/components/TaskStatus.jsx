import React from 'react';

export default function TaskStatus({ mediaItems }) {
  const pendingCount = mediaItems.filter((m) => m.status === 'PENDING').length;
  const processingCount = mediaItems.filter((m) => m.status === 'PROCESSING').length;
  const completedCount = mediaItems.filter((m) => m.status === 'COMPLETED').length;
  const failedCount = mediaItems.filter((m) => m.status === 'FAILED').length;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="card-title">⚡ Queue Overview</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>{pendingCount}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Processing</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{processingCount}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{completedCount}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failed</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>{failedCount}</div>
        </div>
      </div>
    </div>
  );
}
