import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './VehicleDetail.css';
import Comments from '../components/Comments';

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
      // Likes
      const { data: likesData } = await supabase
        .from('vehicle_likes')
        .select('id', { count: 'exact' })
        .eq('vehicle_id', id);
      setLikeCount(likesData ? likesData.length : 0);
      // User liked?
      if (currentUser) {
        const { data: userLike } = await supabase
          .from('vehicle_likes')
          .select('*')
          .eq('vehicle_id', id)
          .eq('user_id', currentUser?.id);
        setLiked(userLike && userLike.length > 0);
      }
      // Comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('vehicle_id', id);
      setCommentCount(commentsData ? commentsData.length : 0);
    }
    fetchLikeAndCommentCounts();
  }, [id, currentUser]);

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
    if (!currentUser) return alert('Lütfen giriş yapın.');
    if (liked) return;
    await supabase.from('vehicle_likes').insert({ vehicle_id: id, user_id: currentUser.id });
    setLikeCount(likeCount + 1);
    setLiked(true);
  }

  function handleShowComments() {
    setShowComments(true);
  }

  function handleCloseComments() {
    setShowComments(false);
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
          <div className="vehicle-detail-price">{vehicle.fiyat?.toLocaleString()} TL</div>
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
      {/* Beğeni ve Yorum Alanı */}
      <div className="vehicle-social-actions">
        <button className="like-btn" onClick={handleLike} disabled={liked}>
          {liked ? 'Beğendin' : 'Beğen'}
        </button>
        <span className="like-count">{likeCount} Beğeni</span>
        <button className="comment-btn" onClick={handleShowComments}>
          Yorum Yap
        </button>
        <span className="comment-count">{commentCount} Yorum</span>
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
