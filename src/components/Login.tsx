/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  Locate
} from 'lucide-react';
import { DonorProfile, NGO, LocationCoordinates } from '../types';

interface LoginProps {
  onLoginSuccess: (session: { role: 'donor' | 'ngo'; profile: any }) => void;
  existingNgos: NGO[];
  existingDonor: DonorProfile | null;
  refreshAll: () => void;
}

export default function Login({ onLoginSuccess, existingNgos, existingDonor, refreshAll }: LoginProps) {
  const [role, setRole] = useState<'donor' | 'ngo'>('donor');
  
  // Registration Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  
  // Status Indicator States
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'failed' | 'simulated'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto Geolocation function
  const handleAutoLocation = () => {
    setIsLocating(true);
    setLocationStatus('idle');
    setErrorMsg(null);

    if (!navigator.geolocation) {
      // Browser doesn't support geolocation, use realistic simulated SF coordinates
      setTimeout(async () => {
        const mockCoords = { lat: 37.7749 + (Math.random() - 0.5) * 0.02, lng: -122.4194 + (Math.random() - 0.5) * 0.02 };
        setCoordinates(mockCoords);
        try {
          const res = await fetch('/api/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockCoords),
          });
          if (res.ok) {
            const data = await res.json();
            setAddress(data.address);
            setLocationStatus('simulated');
          } else {
            throw new Error();
          }
        } catch {
          setAddress(`Market Street Plaza, San Francisco, CA (Simulated GPS: ${mockCoords.lat.toFixed(4)}, ${mockCoords.lng.toFixed(4)})`);
          setLocationStatus('simulated');
        } finally {
          setIsLocating(false);
        }
      }, 800);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = { lat, lng };
        setCoordinates(coords);
        try {
          const res = await fetch('/api/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(coords),
          });
          if (res.ok) {
            const data = await res.json();
            setAddress(data.address);
            setLocationStatus('success');
          } else {
            throw new Error();
          }
        } catch {
          setAddress(`Detected Location (GPS Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          setLocationStatus('success');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn('Geolocation failed:', error);
        // Fall back to high-fidelity simulated SF coordinates
        setTimeout(async () => {
          const mockCoords = { lat: 37.7892 + (Math.random() - 0.5) * 0.01, lng: -122.3994 + (Math.random() - 0.5) * 0.01 };
          setCoordinates(mockCoords);
          try {
            const res = await fetch('/api/reverse-geocode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mockCoords),
            });
            if (res.ok) {
              const data = await res.json();
              setAddress(data.address);
              setLocationStatus('simulated');
            } else {
              throw new Error();
            }
          } catch {
            setAddress(`SOMA District, San Francisco, CA (Simulated GPS: ${mockCoords.lat.toFixed(4)}, ${mockCoords.lng.toFixed(4)})`);
            setLocationStatus('simulated');
          } finally {
            setIsLocating(false);
          }
        }, 800);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!name.trim()) {
      setErrorMsg('Please enter a valid name.');
      setIsSubmitting(false);
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter a valid contact phone number.');
      setIsSubmitting(false);
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Please provide a physical address or click "Auto-Locate".');
      setIsSubmitting(false);
      return;
    }

    let finalCoords = coordinates;
    let finalAddress = address.trim();

    try {
      // Geocode the finalized address to guarantee lat/lng is fully in sync
      const geocodeRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: finalAddress }),
      });
      if (geocodeRes.ok) {
        const geocodeData = await geocodeRes.json();
        finalCoords = { lat: geocodeData.lat, lng: geocodeData.lng };
        finalAddress = geocodeData.formattedAddress;
      }
    } catch (err) {
      console.warn('Geocoding address failed, using fallback:', err);
    }

    if (!finalCoords) {
      finalCoords = { lat: 37.7749, lng: -122.4194 }; // SF Center fallback
    }

    try {
      if (role === 'donor') {
        const payload: DonorProfile = {
          id: `donor_${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: finalAddress,
          coordinates: finalCoords,
        };

        const res = await fetch('/api/donor/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to register donor profile');
        const savedProfile = await res.json();
        
        setSuccessMsg(`Welcome, ${savedProfile.name}! Redirecting to Donor dashboard...`);
        setTimeout(() => {
          onLoginSuccess({ role: 'donor', profile: savedProfile });
          refreshAll();
        }, 1000);

      } else {
        // NGO Registration
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim(),
          coordinates: finalCoords,
          description: `Community focused partner, registered as "${name.trim()}". Providing support and sustainable local relief.`
        };

        const res = await fetch('/api/ngos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to register NGO organization');
        const savedNgo = await res.json();

        setSuccessMsg(`Registered successfully! Welcome, ${savedNgo.name}. Redirecting...`);
        setTimeout(() => {
          onLoginSuccess({ role: 'ngo', profile: savedNgo });
          refreshAll();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Server error. Failed to save profile registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch Quick Logins helper for demo purposes
  const handleQuickLogin = (selectedRole: 'donor' | 'ngo', profile: any) => {
    setSuccessMsg(`Logged in successfully as ${profile.name}!`);
    setTimeout(() => {
      onLoginSuccess({ role: selectedRole, profile });
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto my-3 sm:my-6 lg:my-12 px-2.5 sm:px-4">
      {/* Visual Header */}
      <div className="text-center mb-4 sm:mb-8 space-y-1.5 sm:space-y-3">
        <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 p-2.5 sm:p-3.5 rounded-full border border-emerald-200 shadow-sm">
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 fill-emerald-600 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
          Join SmartShare Network
        </h2>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 max-w-md mx-auto">
          Sign up to immediately scan donations with Gemini AI vision, request supplies in real-time, or coordinate localized pickups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Core Form Panel */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-md sm:shadow-xl overflow-hidden md:col-span-7">
          {/* Role selection tab header */}
          <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100 p-1 sm:p-1.5">
            <button
              type="button"
              onClick={() => {
                setRole('donor');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition cursor-pointer ${
                role === 'donor'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/60'
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              I am a Donor
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('ngo');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition cursor-pointer ${
                role === 'ngo'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              I am an NGO
            </button>
          </div>

          <form onSubmit={handleRegisterSubmit} className="p-4 sm:p-6 md:p-8 space-y-3.5 sm:space-y-5">
            {/* Heading */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">
                {role === 'donor' ? 'Donor Registration' : 'NGO Organization Registry'}
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wide">
                New Session
              </span>
            </div>

            {/* Error & Success Toasts */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3.5 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl p-3.5 text-xs flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Input - Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {role === 'donor' ? 'Full Name' : 'Organization Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {role === 'donor' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'donor' ? "e.g. Jane Donor" : "e.g. Springfield Food Bank"}
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50/50 focus:outline-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Input - Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'donor' ? "jane.donor@example.com" : "contact@sffoodbank.org"}
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50/50 focus:outline-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Input - Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50/50 focus:outline-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Input - Location / Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Location Address
                </label>
                <button
                  type="button"
                  onClick={handleAutoLocation}
                  disabled={isLocating}
                  className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 font-bold px-2 py-1 rounded border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
                  {isLocating ? 'Acquiring GPS...' : 'Auto-Locate'}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (locationStatus !== 'idle') setLocationStatus('idle');
                  }}
                  placeholder="e.g. 101 Pennsylvania Ave, San Francisco, CA"
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50/50 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {locationStatus === 'success' && (
                <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Successfully geocoded with high-accuracy browser geolocation.
                </p>
              )}

              {locationStatus === 'simulated' && (
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  ● Geolocation simulated. (Browser coordinates initialized).
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider"
            >
              {isSubmitting ? (
                <>Creating Session...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  Sign In & Launch Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Demo Access Panel */}
        <div className="space-y-6 md:col-span-5">
          <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200/60 text-slate-600 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              💡 Fully Autonomous Routing
            </h4>
            <p className="text-[11px] leading-relaxed">
              When registering as a Donor or NGO, our matching matrix automatically computes real-time driving distances using the Haversine Earth-Curvature equation based on your location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
