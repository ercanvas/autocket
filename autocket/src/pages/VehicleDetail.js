import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './VehicleDetail.css';
import Comments from '../components/Comments';
import LikeTooltip from '../components/LikeTooltip';
import '../components/LikeTooltip.css';
import { Favorite, FavoriteBorder, ChatBubbleOutline } from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { convertPrice } from '../utils/currency';

export default function VehicleDetail() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [likeUsers, setLikeUsers] = useState([]);
  const [showLikeTooltip, setShowLikeTooltip] = useState(false);
  const [currency, setCurrency] = React.useState(localStorage.getItem('currency') || 'TRY');
  const [rates, setRates] = React.useState({});

  // Yardımcı: Form anahtarlarını normalize et (Supabase ile birebir uyumlu)
  const normalizeVehicleKeys = (data) => {
    if (!data) return {};
    return {
      marka: data.marka || '',
      seri: data.seri || '',
      model: data.model || '',
      yil: data.yil || data.yıl || '', // Supabase: 'yil'
      yakit: data.yakit || data.yakıt || '', // Supabase: 'yakit'
      vites: data.vites || '',
      arac_durumu: data.arac_durumu || data['araç_durumu'] || '', // Supabase: 'arac_durumu'
      km: data.km || '',
      kasa_tipi: data.kasa_tipi || '',
      motor_gucu: data.motor_gucu || '',
      motor_hacmi: data.motor_hacmi || '',
      cekis: data.cekis || '',
      renk: data.renk || '',
      garanti: data.garanti || '',
      agir_hasarli: data.agir_hasarli || data['agir_hasarlı'] || '', // Supabase: 'agir_hasarli'
      fiyat: data.fiyat || '',
      image_url: data.image_url || data.resim_url || '',
      user_id: data.user_id || '',
      id: data.id || '',
    };
  };

  useEffect(() => {
    setCurrentUser(null); // auth.currentUser
  }, []);

  useEffect(() => {
    // Firebase UID'yi al
    try {
      const auth = getAuth();
      setFirebaseUid(auth.currentUser ? auth.currentUser.uid : null);
    } catch (err) {
      setFirebaseUid(null);
    }
  }, []);

  useEffect(() => {
    async function fetchVehicle() {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();
      setVehicle(data);
      setForm(normalizeVehicleKeys(data));
      setLoading(false);
    }
    fetchVehicle();
  }, [id]);

  useEffect(() => {
    async function fetchLikeAndCommentCounts() {
      // Likes with user info
      const { data: likesData } = await supabase
        .from('vehicle_likes')
        .select('*, users(name, firebase_uid)')
        .eq('vehicle_id', id);
      setLikeCount(likesData ? likesData.length : 0);
      setLikeUsers(likesData ? likesData.map(l => l.users || { name: 'Anonim', firebase_uid: l.firebase_uid }) : []);
      // User liked?
      if (firebaseUid) {
        const { data: userLike } = await supabase
          .from('vehicle_likes')
          .select('id')
          .eq('vehicle_id', id)
          .eq('firebase_uid', firebaseUid);
        setLiked(userLike && userLike.length > 0);
      } else {
        setLiked(false);
      }
      // Comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id')
        .eq('vehicle_id', id);
      setCommentCount(commentsData ? commentsData.length : 0);
    }
    fetchLikeAndCommentCounts();
  }, [id, firebaseUid]);

  useEffect(() => {
    function syncCurrencyFromStorage() {
      setCurrency(localStorage.getItem('currency') || 'TRY');
      try {
        setRates(JSON.parse(localStorage.getItem('rates') || '{}'));
      } catch {
        setRates({});
      }
    }
    window.addEventListener('storage', syncCurrencyFromStorage);
    // Also poll every 1s in case of SPA navigation (no storage event)
    const interval = setInterval(syncCurrencyFromStorage, 1000);
    syncCurrencyFromStorage();
    return () => {
      window.removeEventListener('storage', syncCurrencyFromStorage);
      clearInterval(interval);
    };
  }, []);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    setError(null);
    // Supabase'dan sil
    const { error: supaError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    // Backend'e de silme isteği gönder (CSV güncellemesi için)
    fetch(`http://localhost:3000/vehicle/${id}`, { method: 'DELETE' });
    if (!supaError) {
      // navigate('/vehicles');
    } else {
      setError(supaError.message || 'Deletion failed.');
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    // Yalnızca Supabase'daki alan adlarıyla güncelleme yap
    const updateData = normalizeVehicleKeys(form);
    // Supabase'da güncelle
    const { data, error: supaError } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select();
    // Backend'e de güncelleme isteği gönder (CSV güncellemesi için)
    // CSV için Türkçe karakterli anahtarlar gerekebilir, bu yüzden ayrıca dönüştür
    const csvData = {
      marka: updateData.marka,
      seri: updateData.seri,
      model: updateData.model,
      yıl: updateData.yil, // Türkçe karakterli
      yakıt: updateData.yakit,
      vites: updateData.vites,
      araç_durumu: updateData.arac_durumu,
      km: updateData.km,
      kasa_tipi: updateData.kasa_tipi,
      motor_gucu: updateData.motor_gucu,
      motor_hacmi: updateData.motor_hacmi,
      cekis: updateData.cekis,
      renk: updateData.renk,
      garanti: updateData.garanti,
      agir_hasarlı: updateData.agir_hasarli,
      fiyat: updateData.fiyat
    };
    fetch(`http://localhost:3000/vehicle/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(csvData)
    });
    if (!supaError && data && data.length > 0) {
      setEditMode(false);
      setVehicle(data[0]); // Güncellenen veriyi state'e yaz
    } else {
      setError((supaError && supaError.message) || 'Update failed.');
    }
  };

  async function handleLike() {
    // Firebase UID'yi anlık olarak al (her zaman güncel olsun)
    let currentFirebaseUid = null;
    try {
      const auth = getAuth();
      currentFirebaseUid = auth.currentUser ? auth.currentUser.uid : null;
    } catch (err) {}
    if (!currentFirebaseUid) return;
    if (liked) {
      // Unlike: beğeniyi kaldır
      await supabase.from('vehicle_likes')
        .delete()
        .eq('vehicle_id', id)
        .eq('firebase_uid', currentFirebaseUid);
      setLikeCount(likeCount > 0 ? likeCount - 1 : 0);
      setLiked(false);
    } else {
      // Like: beğeni ekle
      await supabase.from('vehicle_likes')
        .insert({ vehicle_id: id, firebase_uid: currentFirebaseUid });
      setLikeCount(likeCount + 1);
      setLiked(true);
    }
  }

  function handleShowComments() {
    setShowComments(true);
  }

  function handleCloseComments() {
    setShowComments(false);
  }

  // Helper to extract numeric value and currency code from price string
  function parsePrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return { amount: 0, code: currency };
    const match = priceStr.replace(/\u00A0/g, ' ').match(/([\d.,]+)\s*([A-Z]{3})/);
    if (!match) return { amount: Number(String(priceStr).replace(/[^\d.,]/g, '').replace(',', '')), code: currency };
    let num = match[1].replace(/,/g, '').replace(/\./g, '.');
    return { amount: parseFloat(num), code: match[2] };
  }

  // Render price in selected currency, integer only
  function renderConvertedPrice(rawPrice) {
    const { amount, code } = parsePrice(rawPrice);
    if (!rates || !rates[code] || !rates[currency]) return rawPrice;
    const converted = convertPrice(amount, code, currency, rates);
    return `${Math.floor(converted).toLocaleString()} ${currency}`;
  }

  if (loading) return <div className="vehicle-bg-gradient"><div className="vehicle-detail-loading">Loading...</div></div>;
  if (!vehicle || vehicle.error) return <div className="vehicle-bg-gradient"><div className="vehicle-detail-error">Vehicle not found.</div></div>;

  return (
    <div className="vehicle-bg-gradient vehicle-detail-fullpage-centered">
      <Link to="/vehicles" className="back-link-absolute">← All Vehicles</Link>
      <div className="vehicle-detail-mainbox no-radius">
        <div className="vehicle-detail-img-large-wrapper no-radius">
          <img src={vehicle.image_url || vehicle.resim_url || 'https://via.placeholder.com/800x400?text=Vehicle'} alt="Vehicle" className="vehicle-detail-img-large no-radius" />
        </div>
        <div className="vehicle-detail-title vehicle-detail-title-left vehicle-detail-title-large-only">
          <h2>{vehicle.marka} {vehicle.seri} {vehicle.model}</h2>
          <div className="vehicle-detail-price">
            {renderConvertedPrice(vehicle.fiyat)}
          </div>
        </div>
        {/* Social Actions: Like, Comment */}
        <div className="vehicle-social-actions">
          <button className="like-btn" onClick={handleLike} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            {liked ? <Favorite color="error"/> : <FavoriteBorder />} Like
          </button>
          {/* Like count under the like button */}
          <div style={{position:'relative', marginTop: 2, marginBottom: 8, width:'100%'}}>
            <span
              className="like-count-underlined"
              style={{ textDecoration: 'underline', cursor: likeUsers.length > 0 ? 'pointer' : 'default', color: '#ffb347', fontWeight: 600, fontSize: '1.08rem', display:'inline-block' }}
              onMouseEnter={() => setShowLikeTooltip(true)}
              onMouseLeave={() => setShowLikeTooltip(false)}
            >
              {likeCount} Likes
            </span>
            {showLikeTooltip && likeUsers.length > 0 && (
              <LikeTooltip users={likeUsers.slice(0,5)} extraCount={likeUsers.length > 5 ? likeUsers.length - 5 : 0} />
            )}
          </div>
          <button className="comment-btn" onClick={handleShowComments} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <ChatBubbleOutline /> Comment
          </button>
          <span className="comment-count">{commentCount} Comments</span>
        </div>
        {editMode ? (
          <form className="vehicle-edit-form" onSubmit={handleUpdate}>
            <input name="marka" value={form.marka || ''} onChange={handleChange} required />
            <input name="seri" value={form.seri || ''} onChange={handleChange} required />
            <input name="model" value={form.model || ''} onChange={handleChange} required />
            <input name="yil" value={form.yil || ''} onChange={handleChange} required />
            <input name="yakit" value={form.yakit || ''} onChange={handleChange} required />
            <input name="vites" value={form.vites || ''} onChange={handleChange} required />
            <input name="arac_durumu" value={form.arac_durumu || ''} onChange={handleChange} required />
            <input name="km" value={form.km || ''} onChange={handleChange} required />
            <input name="kasa_tipi" value={form.kasa_tipi || ''} onChange={handleChange} required />
            <input name="motor_gucu" value={form.motor_gucu || ''} onChange={handleChange} required />
            <input name="motor_hacmi" value={form.motor_hacmi || ''} onChange={handleChange} required />
            <input name="cekis" value={form.cekis || ''} onChange={handleChange} required />
            <input name="renk" value={form.renk || ''} onChange={handleChange} required />
            <input name="garanti" value={form.garanti || ''} onChange={handleChange} required />
            <input name="agir_hasarli" value={form.agir_hasarli || ''} onChange={handleChange} required />
            <input name="fiyat" value={form.fiyat || ''} onChange={handleChange} required />
            <div className="edit-actions">
              <button type="submit" className="save-btn">Save</button>
              <button type="button" className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="vehicle-detail-info-table vehicle-detail-info-scroll">
            <div className="vehicle-detail-info-row"><span>Year:</span><span>{vehicle.yil}</span></div>
            <div className="vehicle-detail-info-row"><span>Body Type:</span><span>{vehicle.kasa_tipi}</span></div>
            <div className="vehicle-detail-info-row"><span>Fuel:</span><span>{vehicle.yakit}</span></div>
            <div className="vehicle-detail-info-row"><span>Transmission:</span><span>{vehicle.vites}</span></div>
            <div className="vehicle-detail-info-row"><span>Mileage:</span><span>{vehicle.km} km</span></div>
            <div className="vehicle-detail-info-row"><span>Engine Power:</span><span>{vehicle.motor_gucu} HP</span></div>
            <div className="vehicle-detail-info-row"><span>Engine Capacity:</span><span>{vehicle.motor_hacmi} cc</span></div>
            <div className="vehicle-detail-info-row"><span>Drive:</span><span>{vehicle.cekis}</span></div>
            <div className="vehicle-detail-info-row"><span>Color:</span><span>{vehicle.renk}</span></div>
            <div className="vehicle-detail-info-row"><span>Warranty:</span><span>{vehicle.garanti}</span></div>
            <div className="vehicle-detail-info-row"><span>Damage:</span><span>{vehicle.agir_hasarli}</span></div>
          </div>
        )}
      </div>
      {showComments && (
        <Comments vehicleId={id} onClose={handleCloseComments} />
      )}
      {currentUser && (
        <div className="detail-actions">
          <button className="edit-btn" onClick={handleEdit}>Edit</button>
          <button className="delete-btn" onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}
