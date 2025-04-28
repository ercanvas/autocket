import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import AddAuto from './pages/AddAuto';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Auth from './pages/Auth';
import MyVehicles from './pages/MyVehicles';
import Profile from './pages/Profile';
import CurrencySelector from './components/CurrencySelector';
import { fetchRates } from './utils/currency';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

export default function App() {
  // Global currency state for all pages
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'TRY');
  const [rates, setRates] = useState({});

  useEffect(() => {
    fetchRates().then(setRates).catch(() => {});
  }, []);

  return (
    <Router>
      <Header />
      <CurrencySelector currency={currency} setCurrency={setCurrency} rates={rates} />
      <Routes>
        <Route path="/" element={<LandingPage currency={currency} setCurrency={setCurrency} rates={rates} />} />
        <Route path="/add-vehicle" element={<AddAuto currency={currency} setCurrency={setCurrency} rates={rates} />} />
        <Route path="/vehicles" element={<Vehicles currency={currency} setCurrency={setCurrency} rates={rates} />} />
        <Route path="/vehicles/:id" element={<VehicleDetail currency={currency} setCurrency={setCurrency} rates={rates} />} />
        <Route path="/auth" element={<Auth currency={currency} setCurrency={setCurrency} rates={rates} />} />
        <Route path="/my-vehicles" element={<MyVehicles currency={currency} setCurrency={setCurrency} rates={rates} />} />
        <Route path="/profile" element={<Profile currency={currency} setCurrency={setCurrency} rates={rates} />} />
      </Routes>
      <Analytics />
    </Router>
  );
}
