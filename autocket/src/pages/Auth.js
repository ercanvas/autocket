import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Animasyonlu gradyan arkaplan için
  // (CSS dosyasında tanımlı olacak)

  const handleGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      await createOrUpdateSupabaseUser(result.user);
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  async function createOrUpdateSupabaseUser(fbUser) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        firebase_uid: fbUser.uid,
        name: fbUser.displayName,
        email: fbUser.email,
        avatar_url: fbUser.photoURL
      }, { onConflict: ['firebase_uid'] });
    if (error) {
      console.error("Supabase user upsert error:", error);
    } else {
      console.log("Supabase user upsert success:", data);
    }
  }

  return (
    <div className="auth-bg-gradient" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-container">
        <div className="auth-card">
          <h2>Login / Sign Up</h2>
          <button className="google-btn-3d" onClick={handleGoogle}>
            <span className="google-icon" /> Continue with Google
          </button>
          <form className="login-form">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="signup-btn-3d" disabled>Sign Up / Login (Only Google is active)</button>
          </form>
          {user && (
            <div className="profile-box">
              <img src={user.photoURL} alt="Profile" className="profile-img" />
              <div>{user.displayName}</div>
              <div>{user.email}</div>
              <button className="logout-btn-3d" onClick={handleLogout}>Logout</button>
            </div>
          )}
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
