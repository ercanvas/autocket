import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Comments({ vehicleId, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [vehicleId]);

  async function fetchComments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setComments(data || []);
    setLoading(false);
  }

  async function handleAddComment(e) {
    e.preventDefault();
    setError(null);
    if (!newComment.trim()) return;
    const { error } = await supabase
      .from('comments')
      .insert({ vehicle_id: vehicleId, text: newComment });
    if (error) setError(error.message);
    else {
      setNewComment('');
      fetchComments();
    }
  }

  return (
    <div className="comments-modal">
      <div className="comments-header">
        <h3>Yorumlar</h3>
        <button onClick={onClose}>Kapat</button>
      </div>
      <form onSubmit={handleAddComment} className="comments-form">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Yorumunuzu yazın..."
          rows={3}
        />
        <button type="submit">Yorum Yap</button>
      </form>
      {error && <div className="comments-error">{error}</div>}
      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <div className="comments-list">
          {comments.length === 0 && <div>Henüz yorum yok.</div>}
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-text">{c.text}</div>
              <div className="comment-date">{new Date(c.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
