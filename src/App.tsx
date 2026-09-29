/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Heart, 
  AlertCircle,
  RefreshCw,
  LogOut,
  MapPin
} from 'lucide-react';
import { DonorProfile, NGO, NGODemand, DonationItem, NotificationLog } from './types';
import DonorDashboard from './components/DonorDashboard';
import NGODashboard from './components/NGODashboard';
import SystemHub from './components/SystemHub';
import Login from './components/Login';

export default function App() {
  // Current logged in session: role: 'donor' | 'ngo', profile: DonorProfile | NGO
  const [currentUser, setCurrentUser] = useState<{ role: 'donor' | 'ngo'; profile: any } | null>(() => {
    try {
      const stored = localStorage.getItem('smartshare_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'donor' | 'ngo' | 'system'>(() => {
    try {
      const stored = localStorage.getItem('smartshare_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.role;
      }
    } catch {}
    return 'donor';
  });
  
  // App States
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [demands, setDemands] = useState<NGODemand[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // Page Indicators
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to safely parse JSON response
  const safeFetchJson = async (res: Response) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }
    return await res.json();
  };

  // Synchronized state fetcher
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      const [pRes, nRes, dRes, uRes, lRes] = await Promise.all([
        fetch('/api/donor/profile'),
        fetch('/api/ngos'),
        fetch('/api/demands'),
        fetch('/api/donations'),
        fetch('/api/notifications'),
      ]);

      const profile = await safeFetchJson(pRes);
      const ngoList = await safeFetchJson(nRes);
      const demandList = await safeFetchJson(dRes);
      const donationList = await safeFetchJson(uRes);
      const notificationLogs = await safeFetchJson(lRes);

      setDonorProfile(profile);
      setNgos(ngoList);
      setDemands(demandList);
      setDonations(donationList);
      setNotifications(notificationLogs);
      setErrorMsg(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Vite backend service starting up or offline. Please refresh in a moment.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshAllData();
    // Auto sync state every 8 seconds
    const interval = setInterval(refreshAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Enforce tab view lock corresponding to role
  useEffect(() => {
    if (currentUser) {
      setActiveTab(currentUser.role);
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      {/* GLOBAL BANNER / HEADER */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-lg text-white shadow-inner flex items-center justify-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </div>
            <div>
              <h1 className="font-display font-bold tracking-tight text-base sm:text-lg text-slate-100">SmartShare</h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block">Sustainable Local Donation Logistics System</p>
            </div>
          </div>

          {/* Navigation Role Badge & User Profile Info */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex bg-slate-800/80 p-1 rounded-lg border border-slate-700/50 items-center">
                {currentUser.role === 'donor' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white rounded-md font-sans text-xs font-semibold">
                    <Users className="w-3.5 h-3.5" /> Donor Portal
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white rounded-md font-sans text-xs font-semibold">
                    <Building2 className="w-3.5 h-3.5" /> NGO Registry Board
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/70 px-2.5 py-1 rounded-lg text-slate-200 shadow-xs">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-inner">
                  {currentUser.profile?.name ? currentUser.profile.name.charAt(0).toUpperCase() : (currentUser.role === 'donor' ? 'D' : 'N')}
                </div>
                <div className="flex flex-col text-left text-xs font-sans">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-100 text-[11px] sm:text-xs truncate max-w-[90px] sm:max-w-[140px]">{currentUser.profile?.name}</span>
                    <span className="bg-emerald-950 text-emerald-300 text-[8px] sm:text-[9px] font-bold font-mono px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded border border-emerald-900 uppercase">
                      {currentUser.role === 'donor' ? 'Donor' : 'NGO'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('smartshare_session');
                  }}
                  className="ml-0.5 text-slate-400 hover:text-rose-400 transition cursor-pointer p-1 rounded-md hover:bg-slate-700/60"
                  title="Sign Out / Switch Profile"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-[10px] sm:text-xs font-bold tracking-wider font-mono">
              🔒 AUTHORIZATION GATEWAY
            </div>
          )}

        </div>
      </header>

      {/* ERROR STATES DISPLAY */}
      {errorMsg && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-2.5 px-3 text-xs font-medium text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={refreshAllData} className="underline text-amber-800 font-bold hover:text-slate-900 ml-1">Force Retry</button>
        </div>
      )}

      {/* CORE PAGE CONTAINER */}
      <main className="flex-grow max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 lg:pb-8 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-emerald-700 animate-spin" />
              <Heart className="w-4 h-4 text-emerald-700 absolute fill-white" />
            </div>
            <p className="font-display font-semibold text-slate-700 text-base">Bootstrapping SmartShare Framework...</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">Syncing in-memory catalog databases, compiling AI translation modules, and parsing default demand states.</p>
          </div>
        ) : !currentUser ? (
          <Login 
            onLoginSuccess={(session) => {
              setCurrentUser(session);
              localStorage.setItem('smartshare_session', JSON.stringify(session));
              setActiveTab(session.role);
            }}
            existingNgos={ngos}
            existingDonor={donorProfile}
            refreshAll={refreshAllData}
          />
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'donor' && (
              <DonorDashboard 
                donorProfile={donorProfile}
                donations={donations}
                demands={demands}
                notifications={notifications}
                refreshAll={refreshAllData}
              />
            )}
            
            {activeTab === 'ngo' && (
              <NGODashboard 
                ngos={ngos}
                demands={demands}
                donations={donations}
                refreshAll={refreshAllData}
                loggedInNgoId={currentUser.role === 'ngo' ? currentUser.profile.id : undefined}
              />
            )}

            {activeTab === 'system' && (
              <SystemHub 
                notifications={notifications}
                refreshAll={refreshAllData}
              />
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-500 py-6 text-center border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 SmartShare Donation Hub. All rights reserved.</p>
          <p className="text-slate-600">Empowering community-driven aid and resource networks.</p>
        </div>
      </footer>
    </div>
  );
}
