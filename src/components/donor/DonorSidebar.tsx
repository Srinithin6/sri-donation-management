import React from 'react';
import { 
  Home, 
  Gift, 
  Bell, 
  Truck, 
  History, 
  MapPin, 
  Locate,
  Clock,
  Heart
} from 'lucide-react';
import { DonorProfile, DonationItem, NotificationLog } from '../../types';

interface DonorSidebarProps {
  donorTab: string;
  setDonorTab: (tab: any) => void;
  draftCount: number;
  notificationCount: number;
  deliveryCount: number;
  historyCount: number;
  activePickupItem: DonationItem | undefined;
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;
  profileForm: { name: string; phone: string; address: string };
  setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; address: string }>>;
  handleUpdateProfile: (e: React.FormEvent) => void;
  handleProfileAutoLocation: () => void;
  isLocatingProfile: boolean;
  donorProfile: DonorProfile | null;
}

export default function DonorSidebar({
  donorTab,
  setDonorTab,
  draftCount,
  notificationCount,
  deliveryCount,
  historyCount,
  activePickupItem,
  isEditingProfile,
  setIsEditingProfile,
  profileForm,
  setProfileForm,
  handleUpdateProfile,
  handleProfileAutoLocation,
  isLocatingProfile,
  donorProfile
}: DonorSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Mobile Horizontal Navigation Chips (Visible on Mobile/Tablet < lg) */}
      <div className="lg:hidden bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm text-slate-800">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Quick Navigation</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'home', label: 'Home', icon: Home, badge: 0 },
            { id: 'donation', label: 'Donate', icon: Gift, badge: draftCount },
            { id: 'notification', label: 'Alerts', icon: Bell, badge: notificationCount },
            { id: 'delivery', label: 'Delivery', icon: Truck, badge: deliveryCount },
            { id: 'history', label: 'History', icon: History, badge: historyCount },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = donorTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDonorTab(tab.id as any)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-emerald-700 text-white font-bold' : 'bg-emerald-100 text-emerald-800 font-bold'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Navigation Sidebar (Visible on lg and larger) */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-slate-800">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Navigation</p>
        <nav className="space-y-1">
          {[
            { id: 'home', label: 'Home Dashboard', icon: Home, badge: 0 },
            { id: 'donation', label: 'Make Donation', icon: Gift, badge: draftCount },
            { id: 'notification', label: 'Notifications', icon: Bell, badge: notificationCount },
            { id: 'delivery', label: 'Active Delivery', icon: Truck, badge: deliveryCount },
            { id: 'history', label: 'Impact History', icon: History, badge: historyCount },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = donorTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDonorTab(tab.id as any)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-between cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-800' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-850'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* STICKY BOTTOM MOBILE APP NAVIGATION BAR (Native mobile phone experience) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex justify-around items-center text-white shadow-2xl">
        {[
          { id: 'home', label: 'Home', icon: Home, badge: 0 },
          { id: 'donation', label: 'Donate', icon: Gift, badge: draftCount },
          { id: 'notification', label: 'Alerts', icon: Bell, badge: notificationCount },
          { id: 'delivery', label: 'Delivery', icon: Truck, badge: deliveryCount },
          { id: 'history', label: 'History', icon: History, badge: historyCount },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = donorTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setDonorTab(tab.id as any)}
              className={`relative flex flex-col items-center justify-center min-h-[44px] px-2 py-1 rounded-lg transition cursor-pointer ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-slate-950 font-bold text-[9px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-0.5 font-mono">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Pickup Highlight Alert */}
      {activePickupItem && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 shadow-sm space-y-2 animate-pulse text-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
            <Truck className="w-4 h-4 text-emerald-700 animate-bounce" />
            <span>Express Pickup Scheduled!</span>
          </div>
          <p className="text-[11px] text-emerald-950 leading-relaxed">
            Your <strong>{activePickupItem.notes.split('.')[0]}</strong> is scheduled for pickup on <strong>{activePickupItem.pickupSlot?.date}</strong> during <strong>{activePickupItem.pickupSlot?.timeWindow}</strong>.
          </p>
          <div className="text-[10px] text-slate-500 font-mono bg-white p-2 rounded border border-emerald-100 space-y-0.5">
            <p>Driver: <strong className="text-slate-700">{activePickupItem.pickupSlot?.volunteerName}</strong></p>
            <p>Phone: {activePickupItem.pickupSlot?.volunteerPhone}</p>
          </div>
          <button
            onClick={() => setDonorTab('delivery')}
            className="w-full text-center text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 rounded-md transition shadow-sm cursor-pointer"
          >
            Track Real-time Route &rarr;
          </button>
        </div>
      )}

    </div>
  );
}
