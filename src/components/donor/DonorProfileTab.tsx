import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  Compass, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { DonorProfile, DonationItem } from '../../types';

interface DonorProfileTabProps {
  donorProfile: DonorProfile | null;
  profileForm: { name: string; phone: string; address: string };
  setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; address: string }>>;
  handleUpdateProfile: (e: React.FormEvent) => void;
  handleProfileAutoLocation: () => void;
  isLocatingProfile: boolean;
  donations: DonationItem[];
}

export default function DonorProfileTab({
  donorProfile,
  profileForm,
  setProfileForm,
  handleUpdateProfile,
  handleProfileAutoLocation,
  isLocatingProfile,
  donations
}: DonorProfileTabProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdateProfile(e);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Calculate statistics
  const totalItems = donations.reduce((acc, curr) => acc + curr.quantity, 0);
  const matchedCount = donations.filter(d => d.status !== 'Draft').length;
  const matchRate = donations.length > 0 ? Math.round((matchedCount / donations.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2">
            <User className="w-5.5 h-5.5 text-emerald-700" /> My Profile Information
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Manage your authenticated account credentials, pickup coordinates, and review your verified donor status.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-800">Verified Donor Account</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Edit Profile Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b pb-2">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Account Settings</h3>
            <p className="text-[11px] text-slate-400">Keep your pickup coordinates up to date to ensure flawless express courier dispatch.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </span>
                <input 
                  type="text" 
                  value={profileForm.name} 
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                  className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-emerald-600 bg-slate-50/50 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </span>
                  <input 
                    type="email" 
                    value={donorProfile?.email || 'jane.donor@example.com'} 
                    disabled
                    className="w-full text-sm border border-slate-150 rounded-lg pl-9 pr-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed font-mono text-xs"
                    title="Email cannot be changed (primary login identifier)"
                  />
                  <span className="absolute right-2.5 top-2.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Phone</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </span>
                  <input 
                    type="text" 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                    className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-emerald-600 bg-slate-50/50 font-semibold"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Pickup Location Address</label>
                <button
                  type="button"
                  onClick={handleProfileAutoLocation}
                  disabled={isLocatingProfile}
                  className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 font-bold px-2 py-1 rounded border border-slate-200 transition cursor-pointer flex items-center gap-1"
                >
                  <Compass className={`w-3 h-3 ${isLocatingProfile ? 'animate-spin' : ''}`} />
                  {isLocatingProfile ? 'Syncing...' : 'Auto-Locate Geolocation'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </span>
                <input 
                  type="text" 
                  value={profileForm.address} 
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} 
                  className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-emerald-600 bg-slate-50/50 font-semibold"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                This physical address will serve as the default hub for volunteer or partner NGO express courier collections.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                type="submit" 
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-5 rounded-lg shadow-sm text-xs cursor-pointer transition active:scale-98"
              >
                Save Profile Updates
              </button>
              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Impact footing card & Map Mockup */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sustainability Status Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-2 translate-x-2">
              <Award className="w-32 h-32" />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Gold Tier Member
              </span>
              <h3 className="font-display font-bold text-base mt-1 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-400" /> Sustainability Footprint
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Total Items Sent</span>
                <span className="font-display font-bold text-xl text-slate-100">{totalItems} units</span>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Active Match Rate</span>
                <span className="font-display font-bold text-xl text-emerald-400">{matchRate}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/30 space-y-2">
              <p className="text-[11px] text-slate-300 leading-normal">
                Your high matchmaking performance has conserved approximately <strong className="text-white">120kg</strong> of electronic and garment waste from entering city landfills.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24% Impact Index this month</span>
              </div>
            </div>
          </div>

          {/* Springfield Grid Node Map Mockup */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display font-semibold text-slate-800 text-xs uppercase tracking-wider">Local Support Grid</h4>
                <p className="text-[10px] text-slate-400">Node coordinates verification</p>
              </div>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-50 border px-2 py-0.5 rounded">
                Lat: {donorProfile?.coordinates.lat.toFixed(4) || '37.7892'}, Lng: {donorProfile?.coordinates.lng.toFixed(4) || '-122.3994'}
              </div>
            </div>

            {/* Map Frame visual simulation */}
            <div className="relative aspect-video rounded-lg bg-slate-100 border border-slate-150 overflow-hidden flex items-center justify-center">
              {/* Fake grid map drawing */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Fake connecting path lines */}
              <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                <line x1="10%" y1="20%" x2="40%" y2="50%" stroke="#059669" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="40%" y1="50%" x2="90%" y2="40%" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="40%" y1="50%" x2="60%" y2="80%" stroke="#d97706" strokeWidth="2" strokeDasharray="4 2" />
              </svg>

              {/* Fake pins */}
              <div className="absolute left-[10%] top-[20%] text-slate-400 text-[10px] font-bold bg-white px-1 py-0.5 rounded border flex items-center gap-0.5">
                🏢 NGO Alpha
              </div>
              <div className="absolute right-[10%] top-[40%] text-slate-400 text-[10px] font-bold bg-white px-1 py-0.5 rounded border flex items-center gap-0.5">
                🍲 Food Bank
              </div>

              {/* Active Donor Pin */}
              <div className="absolute left-[40%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="bg-emerald-600 text-white font-bold text-[9px] px-2 py-1 rounded shadow-md border border-emerald-500 flex items-center gap-1 animate-bounce">
                  <MapPin className="w-3 h-3 text-white fill-white" />
                  <span>My Pickup Node</span>
                </div>
                <div className="w-3 h-3 bg-emerald-400/40 rounded-full animate-ping absolute top-4" />
              </div>

              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-white text-[9px] p-1.5 rounded border border-slate-700 backdrop-blur-xs flex items-center justify-between">
                <span>Verified Springfield coverage zone</span>
                <span className="text-emerald-400 font-bold font-mono">NODE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
