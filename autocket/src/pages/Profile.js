import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setUser(fbUser);
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (fbUser) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('firebase_uid', fbUser.uid)
          .single();
        setProfile(data);
        if (error) setError(error.message);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    let avatarUrl = profile.avatar_url;
    try {
      if (avatarFile) {
        setAvatarUploading(true);
        const ext = avatarFile.name.split('.').pop();
        const fileName = `${user.uid}_avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from('profile-images').upload(fileName, avatarFile, { upsert: true });
        setAvatarUploading(false);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('profile-images').getPublicUrl(fileName);
        avatarUrl = publicUrlData.publicUrl;
      }
      const { error: updateError } = await supabase
        .from('users')
        .update({ ...profile, avatar_url: avatarUrl })
        .eq('firebase_uid', user.uid);
      if (updateError) throw updateError;
      setSuccess('Profile updated!');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible.')) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: dbError } = await supabase.from('users').delete().eq('firebase_uid', user.uid);
      if (dbError) throw dbError;
      await user.delete();
      navigate('/auth');
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/auth');
    } catch (err) {
      setError(err.message || 'Failed to log out.');
    }
  };

  if (loading) return <div className="profile-container">Loading...</div>;
  if (!user) return <div className="profile-container">You are not logged in. <button onClick={() => navigate('/auth')}>Log in</button></div>;
  if (!profile) return <div className="profile-container">Profile not found.</div>;

  return (
    <div className="profile-bg-gradient">
      <div className="profile-main-card">
        <div className="profile-header-row">
          <img src={profile.avatar_url || user.photoURL || 'https://via.placeholder.com/96x96?text=Profile'} alt="avatar" className="profile-avatar" />
          <div className="profile-header-info">
            <h2>{profile.name || ''}</h2>
            <div className="profile-email">{profile.email || ''}</div>
            <div className="profile-joined">Joined: {profile.join_date || ''}</div>
          </div>
        </div>
        <div className="profile-stats-row">
          <div className="profile-stat">
            <span className="profile-stat-num">{profile.listings || 0}</span>
            <span className="profile-stat-label">Listings</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-num">{profile.favorites || 0}</span>
            <span className="profile-stat-label">Favorites</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-num">{profile.phone || ''}</span>
            <span className="profile-stat-label">Phone</span>
          </div>
        </div>
        <div className="profile-about">
          <h3>About</h3>
          <p>{profile.about || ''}</p>
        </div>
        <div className="profile-edit-toggle-row">
          <button className="profile-edit-toggle-btn" onClick={() => setEditMode(e => !e)}>
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
          <button className="profile-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        {editMode && (
          <form className="profile-form" onSubmit={handleSave}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            <input name="name" placeholder="Full Name" value={profile.name || ''} onChange={handleChange} required />
            <input name="email" placeholder="Email" value={profile.email || ''} onChange={handleChange} required />
            <input name="phone" placeholder="Phone" value={profile.phone || ''} onChange={handleChange} />
            <textarea name="about" placeholder="About" value={profile.about || ''} onChange={handleChange} />
            <button className="profile-save-btn" type="submit" disabled={loading || avatarUploading}>Save</button>
          </form>
        )}
        <Link to="/my-vehicles" className="profile-my-vehicles-btn">My Vehicles</Link>
        <button className="profile-delete-btn" onClick={handleDeleteAccount} disabled={loading} style={{ backgroundColor: 'red', color: 'white' }}>Delete Account</button>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    </div>
  );
}
