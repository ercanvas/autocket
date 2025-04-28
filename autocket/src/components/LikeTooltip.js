import React from 'react';
import './LikeTooltip.css';

export default function LikeTooltip({ users, extraCount }) {
  if (!users || users.length === 0) return null;
  return (
    <div className="like-tooltip">
      <div className="like-tooltip-names">
        {users.slice(0, 5).map((u, i) => (
          <span key={u.firebase_uid || i} className="like-tooltip-name">{u.name || 'Anonim'}{i < users.length - 1 && i < 4 ? ', ' : ''}</span>
        ))}
        {extraCount > 0 && (
          <span className="like-tooltip-extra">ve {extraCount} diğer kişi</span>
        )}
      </div>
    </div>
  );
}
