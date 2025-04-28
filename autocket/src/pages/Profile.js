import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { PersonIcon, EmailIcon, CalendarMonthIcon, DirectionsCarIcon, FavoriteIcon, PhoneIcon, EditIcon, LogoutIcon, DeleteIcon, ListAltIcon } from './muiIcons';
import ProfileBanner from './ProfileBanner';
import './ProfileBanner.css';
import './Profile.css';
import { convertPrice } from '../utils/currency';

export default function Profile({ currency, setCurrency, rates }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(null);
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
        if (data && data.banner_url) setBannerUrl(data.banner_url);
        if (error) setError(error.message);
      } else {
        setProfile(null);
        setBannerUrl(null);
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

  const handleBannerChange = async (e) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    setBannerUploading(true);
    setError(null);
    try {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop();
      const fileName = `${user.uid}_banner.${ext}`;
      const { error: uploadError } = await supabase.storage.from('profile-banners').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('profile-banners').getPublicUrl(fileName);
      setBannerUrl(publicUrlData.publicUrl);
      // Save to user profile
      await supabase.from('users').update({ banner_url: publicUrlData.publicUrl }).eq('firebase_uid', user.uid);
    } catch (err) {
      setError(err.message || 'Failed to upload banner.');
    }
    setBannerUploading(false);
  };

  if (loading) return <div className="profile-container">Loading...</div>;
  if (!user) return <div className="profile-container">You are not logged in. <button onClick={() => navigate('/auth')}>Log in</button></div>;
  if (!profile) return <div className="profile-container">Profile not found.</div>;

  // Format joined date from profile.created_at ("2025-04-27T18:10:59.000Z") to "Apr 2025"
  let joinedStr = '';
  if (profile && profile.created_at) {
    const d = new Date(profile.created_at);
    joinedStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  return (
    <div style={{background:'#23253a', minHeight:'100vh'}}>
      <ProfileBanner bannerUrl={bannerUrl} onBannerChange={handleBannerChange} uploading={bannerUploading} />
      <div className="profile-main-card" style={{marginTop:-60}}>
        <div className="profile-header-row">
          <img src={profile && profile.avatar_url ? profile.avatar_url : 'https://via.placeholder.com/120x120?text=Avatar'} alt="Avatar" className="profile-avatar" />
        </div>
        <div className="profile-header-row" style={{justifyContent:'flex-start', gap:32, marginTop:-40}}>
          <div style={{minWidth:300}}>
            <h2 style={{display:'flex',alignItems:'center',gap:8}}><PersonIcon style={{fontSize:28}}/>{profile.name || ''}</h2>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><EmailIcon style={{fontSize:20}}/>{profile.email || ''}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><CalendarMonthIcon style={{fontSize:20}}/>Joined: {joinedStr}</div>
          </div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <button className="profile-btn" style={{background:'#ff6600'}}><ListAltIcon style={{marginRight:6}}/>Listings</button>
            <button className="profile-btn" style={{background:'#ff6600'}}><FavoriteIcon style={{marginRight:6}}/>Favorites</button>
            <button className="profile-btn" style={{background:'#ff6600'}}><PhoneIcon style={{marginRight:6}}/>Phone number</button>
            <button className="profile-btn" style={{background:'#ff6600'}} onClick={handleLogout}><LogoutIcon style={{marginRight:6}}/>Log out</button>
            <button className="profile-btn" style={{background:'#ff2222',color:'#fff'}} onClick={handleDeleteAccount}><DeleteIcon style={{marginRight:6}}/>Delete account</button>
          </div>
        </div>
        <div style={{display:'flex',gap:24,marginTop:28}}>
          <button className="profile-btn" style={{background:'#ff6600',width:160}} onClick={()=>setEditMode(e=>!e)}><EditIcon style={{marginRight:6}}/>{editMode ? 'Cancel' : 'Edit Profile'}</button>
          <Link to="/my-vehicles" className="profile-btn" style={{background:'#ff6600',width:160,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><DirectionsCarIcon/>My Vehicles</Link>
        </div>
        <div style={{marginTop:32}}>
          <h3 style={{color:'#fff'}}>About</h3>
          <div style={{background:'#444',color:'#fff',borderRadius:8,padding:'24px 32px',marginTop:12,minHeight:80}}>
            {profile.about || <span style={{color:'#bbb'}}>No info provided.</span>}
          </div>
        </div>
        <div className="profile-info-row">
          <div className="profile-info-label"><DirectionsCarIcon /> Total Vehicles</div>
          <div className="profile-info-value">{profile && profile.vehicle_count ? profile.vehicle_count : 0}</div>
        </div>
        <div className="profile-info-row">
          <div className="profile-info-label"><FavoriteIcon /> Favorite Vehicle Value</div>
          <div className="profile-info-value">
            {profile && profile.favorite_vehicle_value ? `${convertPrice(Number(profile.favorite_vehicle_value), 'TRY', currency, rates).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}` : 'N/A'}
          </div>
        </div>
        {editMode && (
          <form className="profile-form" onSubmit={handleSave} style={{marginTop:32}}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            <input name="name" placeholder="Full Name" value={profile.name || ''} onChange={handleChange} required />
            <input name="email" placeholder="Email" value={profile.email || ''} onChange={handleChange} required />
            <input name="phone" placeholder="Phone" value={profile.phone || ''} onChange={handleChange} />
            <textarea name="about" placeholder="About" value={profile.about || ''} onChange={handleChange} />
            <button className="profile-save-btn" type="submit" disabled={loading || avatarUploading}>Save</button>
          </form>
        )}
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    </div>
  );
}
