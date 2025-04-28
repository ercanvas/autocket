import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function UserMenu() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    navigate('/');
  };

  if (user) {
    return (
      <div className="user-menu">
        <Link to="/profile" className="profile-btn">
          <img src={user.photoURL || 'https://via.placeholder.com/32x32?text=U'} alt="Profil" className="profile-btn-img" />
          Profilim
        </Link>
        <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
      </div>
    );
  } else {
    return (
      <div className="user-menu">
        <button className="auth-btn" onClick={() => navigate('/auth')}>Giriş / Kayıt Ol</button>
      </div>
    );
  }
}
