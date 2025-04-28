import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import AddAuto from './pages/AddAuto';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Auth from './pages/Auth';
import MyVehicles from './pages/MyVehicles';
import Profile from './pages/Profile';
import './App.css';

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/add-vehicle" element={<AddAuto />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/my-vehicles" element={<MyVehicles />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
