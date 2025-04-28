import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Vehicles.css';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      const { data, error } = await supabase.from('vehicles').select('*').order('id', { ascending: false });
      if (!error) setVehicles(data || []);
      setLoading(false);
    }
    fetchVehicles();
  }, []);

  return (
    <div className="vehicles-bg">
      <div className="vehicles-grid">
        {loading ? (
          <div className="vehicles-loading">Loading...</div>
        ) : vehicles.length === 0 ? (
          <div className="vehicles-empty">No vehicles found.</div>
        ) : (
          vehicles.map((v, i) => (
            <Link to={`/vehicles/${v.id}`} key={v.id} className="vehicle-card-gradient">
              <img src={v.image_url || v.resim_url || 'https://via.placeholder.com/120x80?text=Vehicle'} alt="Vehicle" />
              <div className="vehicle-title">{v.marka} {v.seri} {v.model}</div>
              <div className="vehicle-table">
                <div><b>Price:</b> {v.fiyat} TL</div>
                <div><b>Year:</b> {v.yil}</div>
                <div><b>Body Type:</b> {v.kasa_tipi}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
