import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Vehicles.css';

export default function MyVehicles() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setUser(fbUser);
      setLoading(true);
      setError(null);
      if (fbUser) {
        // Kendi araçlarını çek
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', fbUser.uid)
          .order('created_at', { ascending: false });
        setVehicles(data || []);
        if (error) setError(error.message);
      } else {
        setVehicles([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="vehicles-container">Loading...</div>;
  if (!user) return <div className="vehicles-container">You are not logged in. <button onClick={() => navigate('/auth')}>Log In</button></div>;

  return (
    <div className="vehicles-container">
      <h2>My Vehicles</h2>
      {vehicles.length === 0 ? (
        <div>You don't have any vehicles. <button onClick={() => navigate('/add-vehicle')}>Add Vehicle</button></div>
      ) : (
        <div className="vehicles-list">
          {vehicles.map(vehicle => (
            <div className="vehicle-card" key={vehicle.id} onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
              <img src={vehicle.resim_url || 'https://via.placeholder.com/160x100?text=Vehicle'} alt="Vehicle" className="vehicle-card-img" />
              <div className="vehicle-card-info">
                <div><b>{vehicle.marka} {vehicle.model}</b></div>
                <div>Year: {vehicle.yil}</div>
                <div>Price: {vehicle.fiyat ? vehicle.fiyat + ' ₺' : 'Not Estimated'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
