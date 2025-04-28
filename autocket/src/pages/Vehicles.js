import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FavoriteBorder, ChatBubbleOutline } from '@mui/icons-material';
import './Vehicles.css';
import { convertPrice } from '../utils/currency';

export default function Vehicles({ currency, setCurrency, rates }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      // Fetch vehicles
      const { data: vehiclesData, error } = await supabase.from('vehicles').select('*').order('id', { ascending: false });
      if (!vehiclesData || error) {
        setVehicles([]);
        setLoading(false);
        return;
      }
      // For each vehicle, fetch like and comment counts
      const vehicleIds = vehiclesData.map(v => v.id);
      let likeCounts = [];
      let commentCounts = [];
      if (vehicleIds.length > 0) {
        const { data: likes } = await supabase
          .from('vehicle_likes')
          .select('vehicle_id');
        const { data: comments } = await supabase
          .from('comments')
          .select('vehicle_id');
        likeCounts = likes ? vehicleIds.map(id => likes.filter(l => l.vehicle_id === id).length) : [];
        commentCounts = comments ? vehicleIds.map(id => comments.filter(c => c.vehicle_id === id).length) : [];
      }
      // Attach counts to vehicles
      const vehiclesWithCounts = vehiclesData.map((v, i) => ({
        ...v,
        like_count: likeCounts[i] || 0,
        comment_count: commentCounts[i] || 0
      }));
      setVehicles(vehiclesWithCounts);
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
            <Link to={`/vehicles/${v.id}`} className="vehicle-card-gradient" key={v.id}>
              <img src={v.image_url || v.resim_url || 'https://via.placeholder.com/120x80?text=Vehicle'} alt="Vehicle" />
              <div className="vehicle-title">{v.marka} {v.seri} {v.model}</div>
              <div className="vehicle-table">
                <div><b>Price:</b> {v.fiyat ? `${convertPrice(Number(v.fiyat), 'TRY', currency, rates).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}` : 'Not Estimated'}</div>
                <div><b>Year:</b> {v.yil}</div>
                <div><b>Body Type:</b> {v.kasa_tipi}</div>
                <div className="vehicle-card-social-row" style={{display:'flex',alignItems:'center',gap:'14px',marginTop:'6px'}}>
                  <span style={{display:'flex',alignItems:'center',gap:'4px'}}><FavoriteBorder style={{fontSize:18,color:'#ffb347'}}/> {v.like_count || 0}</span>
                  <span style={{display:'flex',alignItems:'center',gap:'4px'}}><ChatBubbleOutline style={{fontSize:18,color:'#b7c3e6'}}/> {v.comment_count || 0}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
