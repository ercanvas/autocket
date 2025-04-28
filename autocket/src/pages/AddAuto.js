import React, { useState } from 'react';
import './AddAuto.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';

const initialState = {
  marka: '', seri: '', model: '', yil: '', yakit: '', vites: '', arac_durumu: '', km: '', kasa_tipi: '',
  motor_gucu: '', motor_hacmi: '', cekis: '', renk: '', garanti: '', agir_hasarli: ''
};

const options = {
  yakit: ['Gasoline', 'Diesel', 'Electric', 'LPG'],
  vites: ['Automatic', 'Manual'],
  arac_durumu: ['Brand New', 'Used'],
  kasa_tipi: ['Sedan', 'Hatchback', 'SUV', 'Coupe'],
  cekis: ['Front Wheel Drive', 'Rear Wheel Drive', 'Four Wheel Drive'],
  garanti: ['Available', 'Not Available'],
  agir_hasarli: ['No', 'Yes']
};

export default function AddAuto() {
  const [form, setForm] = useState(initialState);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePriceChange = e => {
    setCustomPrice(e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSave(false);
    try {
      const res = await fetch('https://autocket.onrender.com/tahmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.fiyat);
        setShowSave(true);
      } else setError(data.error || 'Could not get estimate.');
    } catch (err) {
      setError('Could not connect to server.');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const fiyat = customPrice || result;
    if (!fiyat) {
      setError('No price found!');
      setLoading(false);
      return;
    }
    let imageUrl = '';
    try {
      if (file) {
        setUploading(true);
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
        const { data, error: uploadError } = await supabase.storage.from('vehicle-images').upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        setUploading(false);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = await supabase.storage.from('vehicle-images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      if (!user) {
        setError('Please log in.');
        setLoading(false);
        return;
      }
      const { error: dbError } = await supabase.from('vehicles').insert([
        {
          user_id: user.uid,
          ...form,
          fiyat: fiyat,
          image_url: imageUrl
        }
      ]);
      if (dbError) throw dbError;
      navigate('/vehicles');
    } catch (err) {
      setError(err.message || 'Could not save record.');
    }
    setLoading(false);
  };

  // --- LOGIN GATE ---
  if (!user) {
    return (
      <div className="add-auto-login-gate">
        <div className="login-gate-center-box">
          <h2>Please log in to add a vehicle</h2>
          <p>You must be signed in to add your vehicle to our marketplace. Click the button below to log in or sign up.</p>
          <a href="/auth" className="login-gate-btn">Login / Sign Up</a>
        </div>
        <div className="login-gate-info-row">
          <div className="login-gate-info-text">
            <h3>How to add your vehicle easily?</h3>
            <p>Fill in the vehicle details on the left, upload a photo, and get an instant price estimate. Then, set your own price and publish your listing with one click. It's that easy!</p>
          </div>
          <img src="/av.png" alt="How to add vehicle" className="login-gate-img" />
        </div>
      </div>
    );
  }

  // --- FORM SPLIT LAYOUT ---
  return (
    <div className="add-auto-container">
      <div className="add-auto-main-row">
        {/* LEFT: First half of form */}
        <div className="add-auto-form-col add-auto-form-col-left">
          <form className="auto-form auto-form-left" onSubmit={e => { e.preventDefault(); }}>
            <h2>Add a Vehicle</h2>
            <div className="form-row">
              <input name="marka" placeholder="Brand" value={form.marka} onChange={handleChange} required />
              <input name="seri" placeholder="Series" value={form.seri} onChange={handleChange} required />
              <input name="model" placeholder="Model" value={form.model} onChange={handleChange} required />
              <input name="yil" placeholder="Year" type="number" value={form.yil} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <select name="yakit" value={form.yakit} onChange={handleChange} required>
                <option value="">Fuel Type</option>
                {options.yakit.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <select name="vites" value={form.vites} onChange={handleChange} required>
                <option value="">Transmission</option>
                {options.vites.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-row">
              <select name="arac_durumu" value={form.arac_durumu} onChange={handleChange} required>
                <option value="">Vehicle Condition</option>
                {options.arac_durumu.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <input name="km" placeholder="Mileage" type="number" value={form.km} onChange={handleChange} required />
            </div>
          </form>
        </div>
        {/* CENTER: Second half of form + submit */}
        <div className="add-auto-form-col add-auto-form-col-center">
          <form className="auto-form auto-form-center" onSubmit={handleSubmit}>
            <div className="form-row">
              <select name="kasa_tipi" value={form.kasa_tipi} onChange={handleChange} required>
                <option value="">Body Type</option>
                {options.kasa_tipi.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <input name="motor_gucu" placeholder="Engine Power" type="number" value={form.motor_gucu} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <input name="motor_hacmi" placeholder="Engine Capacity" type="number" value={form.motor_hacmi} onChange={handleChange} required />
              <select name="cekis" value={form.cekis} onChange={handleChange} required>
                <option value="">Drive Type</option>
                {options.cekis.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-row">
              <input name="renk" placeholder="Color" value={form.renk} onChange={handleChange} required />
              <select name="garanti" value={form.garanti} onChange={handleChange} required>
                <option value="">Warranty</option>
                {options.garanti.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-row">
              <select name="agir_hasarli" value={form.agir_hasarli} onChange={handleChange} required>
                <option value="">Damage Status</option>
                {options.agir_hasarli.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Estimating...' : 'Estimate Price'}</button>
          </form>
        </div>
        {/* RIGHT: Estimate and user price */}
        <div className="add-auto-predict-col">
          {result && (
            <div className="result-box">Estimated Price: <span>{result.toLocaleString()} TL</span></div>
          )}
          <div className="custom-price-row">
            <input
              className="custom-price-input"
              type="number"
              placeholder="Your Price (optional)"
              value={customPrice}
              onChange={handlePriceChange}
              min="0"
            />
            <button className="save-btn" onClick={handleSave} disabled={loading || uploading}>
              {(loading || uploading) ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
