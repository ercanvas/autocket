import React, { useRef } from 'react';
import './ProfileBanner.css';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';

export default function ProfileBanner({ bannerUrl, onBannerChange, uploading }) {
  const fileInput = useRef();

  return (
    <div className="profile-banner" style={{position:'relative'}}>
      <img className="profile-banner-img" src={bannerUrl || "https://cdn.pixabay.com/photo/2017/01/06/19/15/auto-1957037_1280.jpg"} alt="Banner" />
      <button
        className="banner-edit-btn"
        style={{position:'absolute',right:32,bottom:28,zIndex:2,background:'#ff6600',color:'#fff',border:'none',borderRadius:12,padding:'10px 18px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)',fontWeight:700,display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:18,opacity:0.95}}
        onClick={() => fileInput.current && fileInput.current.click()}
        disabled={uploading}
      >
        <AddAPhotoIcon style={{marginRight:6}}/>{uploading ? 'Uploading...' : 'Edit Banner'}
      </button>
      <input
        type="file"
        accept="image/*"
        style={{display:'none'}}
        ref={fileInput}
        onChange={onBannerChange}
        disabled={uploading}
      />
    </div>
  );
}
