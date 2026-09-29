/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Check, 
  Activity, 
  AlertTriangle,
  ClipboardList,
  Info,
  ThumbsUp,
  ThumbsDown,
  X,
  Trash2,
  Eye,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Send,
  Lock,
  User,
  Truck,
  History,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { NGO, NGODemand, DonationItem, ItemCategory } from '../types';

interface NGODashboardProps {
  ngos: NGO[];
  demands: NGODemand[];
  donations: DonationItem[];
  refreshAll: () => void;
  loggedInNgoId?: string;
}

export default function NGODashboard({ ngos, demands, donations, refreshAll, loggedInNgoId }: NGODashboardProps) {
  // Current Active NGO identity for demonstration switcher
  const [selectedNgoId, setSelectedNgoId] = useState<string>(loggedInNgoId || ngos[0]?.id || '');
  
  // Navigation Tab State: 'compatible' | 'demands' | 'pickup' | 'claims' | 'history'
  const [activeTab, setActiveTab] = useState<'compatible' | 'demands' | 'pickup' | 'claims' | 'history'>('compatible');

  // Director Srinithin R. M Profile View State
  const [showProfileModal, setShowProfileModal] = useState(false);

  React.useEffect(() => {
    if (loggedInNgoId) {
      setSelectedNgoId(loggedInNgoId);
    }
  }, [loggedInNgoId]);
  
  // New Demand Form State
  const [isAddingDemand, setIsAddingDemand] = useState(false);
  const [newDemand, setNewDemand] = useState({
    category: 'clothing' as ItemCategory,
    quantityRequired: 10,
    priority: 'High' as 'Low' | 'Medium' | 'High',
    expiryDate: '2026-08-15',
    description: '',
    specificItem: '',
  });

  // Accepting/Rejecting matching items state
  const [selectedItemToReview, setSelectedItemToReview] = useState<DonationItem | null>(null);
  const [rejectedDonationIds, setRejectedDonationIds] = useState<string[]>([]);
  const [expandedDemandId, setExpandedDemandId] = useState<string | null>(null);
  const [selectedDemandDetail, setSelectedDemandDetail] = useState<NGODemand | null>(null);

  // NGO Pickup Scheduling states
  const [schedulingItem, setSchedulingItem] = useState<DonationItem | null>(null);
  const [ngoSelectedDate, setNgoSelectedDate] = useState(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return tom.toISOString().split('T')[0];
  });
  const [ngoSelectedTimeSlot, setNgoSelectedTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [ngoDriverName, setNgoDriverName] = useState('Michael Adams');
  const [ngoDriverPhone, setNgoDriverPhone] = useState('+1 (555) 304-9871');

  // OTP Handover Verification states
  const [otpInputs, setOtpInputs] = useState<{ [itemId: string]: string }>({});
  const [otpErrors, setOtpErrors] = useState<{ [itemId: string]: string }>({});
  const [otpSuccess, setOtpSuccess] = useState<{ [itemId: string]: string }>({});
  const [verifyingOtpId, setVerifyingOtpId] = useState<string | null>(null);
  const [resendingOtpId, setResendingOtpId] = useState<string | null>(null);

  const handleVerifyOtp = async (item: DonationItem) => {
    const enteredOtp = otpInputs[item.id] || '';
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setOtpErrors(prev => ({ ...prev, [item.id]: 'Please enter a valid 6-digit OTP code.' }));
      return;
    }

    setVerifyingOtpId(item.id);
    setOtpErrors(prev => ({ ...prev, [item.id]: '' }));
    setOtpSuccess(prev => ({ ...prev, [item.id]: '' }));

    try {
      const res = await fetch(`/api/donations/${item.id}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otp: enteredOtp,
          targetStatus: item.status === 'Pickup Scheduled' ? 'Collected' : 'Delivered'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSuccess(prev => ({ ...prev, [item.id]: `✓ OTP Verified! Item marked as ${data.updated?.status}.` }));
        setOtpInputs(prev => ({ ...prev, [item.id]: '' }));
        refreshAll();
      } else {
        setOtpErrors(prev => ({ ...prev, [item.id]: data.error || 'Invalid OTP code.' }));
      }
    } catch (err) {
      console.error(err);
      setOtpErrors(prev => ({ ...prev, [item.id]: 'Server error verifying OTP.' }));
    } finally {
      setVerifyingOtpId(null);
    }
  };

  const handleResendOtpToDonor = async (item: DonationItem) => {
    setResendingOtpId(item.id);
    setOtpErrors(prev => ({ ...prev, [item.id]: '' }));
    setOtpSuccess(prev => ({ ...prev, [item.id]: '' }));

    try {
      const res = await fetch(`/api/donations/${item.id}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSuccess(prev => ({ ...prev, [item.id]: `New OTP (${data.otp}) sent via SMS to ${item.donorName || 'donor'}.` }));
        refreshAll();
      } else {
        setOtpErrors(prev => ({ ...prev, [item.id]: data.error || 'Failed to dispatch OTP.' }));
      }
    } catch (err) {
      console.error(err);
      setOtpErrors(prev => ({ ...prev, [item.id]: 'Error sending OTP SMS.' }));
    } finally {
      setResendingOtpId(null);
    }
  };

  const activeNgo = ngos.find(n => n.id === selectedNgoId);
  
  // Filter demands and matches for current NGO
  const ngoDemands = demands.filter(d => d.ngoId === selectedNgoId);
  const ngoMatchedDonations = donations.filter(item => item.match?.ngoId === selectedNgoId);
  
  // Filter general draft donations that match categories this NGO is looking for
  const lookupCategories = Array.from(new Set(ngoDemands.map(d => d.category)));
  const incomingMatches = donations.filter(item => 
    item.status === 'Draft' && 
    lookupCategories.includes(item.category) &&
    !rejectedDonationIds.includes(item.id)
  );

  // Derived History items
  const historyItems = donations.filter(
    i => (i.match?.ngoId === selectedNgoId || i.status === 'Delivered' || i.status === 'Acknowledged' || i.status === 'Collected')
  );

  const totalUnitsPickedUp = historyItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Group monthly donation pickup data for the bar chart
  const monthlyChartData = React.useMemo(() => {
    const baseMonths = [
      { month: 'May 2026', clothing: 12, food: 25, books: 8, electronics: 4, utensils: 10, furniture: 2 },
      { month: 'Jun 2026', clothing: 18, food: 32, books: 14, electronics: 6, utensils: 12, furniture: 5 },
      { month: 'Jul 2026', clothing: 24, food: 40, books: 18, electronics: 9, utensils: 15, furniture: 8 },
      { month: 'Aug 2026', clothing: 15, food: 28, books: 10, electronics: 5, utensils: 8, furniture: 4 }
    ];

    historyItems.forEach(item => {
      const date = item.detectedAt ? new Date(item.detectedAt) : new Date();
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const found = baseMonths.find(m => m.month === monthLabel);
      if (found) {
        const cat = item.category as keyof typeof found;
        if (cat in found && typeof found[cat] === 'number') {
          (found[cat] as number) += item.quantity || 1;
        }
      } else {
        baseMonths.push({
          month: monthLabel,
          clothing: item.category === 'clothing' ? (item.quantity || 1) : 0,
          food: item.category === 'food' ? (item.quantity || 1) : 0,
          books: item.category === 'books' ? (item.quantity || 1) : 0,
          electronics: item.category === 'electronics' ? (item.quantity || 1) : 0,
          utensils: item.category === 'utensils' ? (item.quantity || 1) : 0,
          furniture: item.category === 'furniture' ? (item.quantity || 1) : 0,
        });
      }
    });

    return baseMonths;
  }, [historyItems]);

  const handleAddDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNgo) return;

    try {
      const response = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDemand,
          ngoId: activeNgo.id,
        }),
      });

      if (response.ok) {
        setIsAddingDemand(false);
        // Reset form
        setNewDemand({
          category: 'clothing',
          quantityRequired: 10,
          priority: 'High',
          expiryDate: '2026-08-15',
          description: '',
          specificItem: '',
        });
        refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimDonation = async (item: DonationItem) => {
    if (!activeNgo) return;

    // Find the matching demand for this category
    const matchingDemand = ngoDemands.find(d => d.category === item.category);
    if (!matchingDemand) return;

    try {
      // Calculate match score using standard engine criteria
      const response = await fetch(`/api/donations/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Matched',
          match: {
            ngoId: activeNgo.id,
            ngoName: activeNgo.name,
            demandId: matchingDemand.id,
            matchScore: 92, // Simulated direct match score
            reasons: [
              `Direct category fit: "${item.category.toUpperCase()}"`,
              `NGO explicitly declared high demand for this item`,
              `Fulfills part of required ${matchingDemand.quantityRequired} units`,
            ],
          },
        }),
      });

      if (response.ok) {
        // Also update the filled count of demand
        const updatedFilled = Math.min(matchingDemand.quantityRequired, matchingDemand.quantityFilled + item.quantity);
        await fetch(`/api/demands/${matchingDemand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantityFilled: updatedFilled }),
        });
        refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNgoScheduler = (item: DonationItem) => {
    setSchedulingItem(item);
  };

  const handleConfirmNgoClaim = async () => {
    if (!schedulingItem || !activeNgo) return;

    // Find the matching demand for this category
    const matchingDemand = ngoDemands.find(d => d.category === schedulingItem.category);
    if (!matchingDemand) {
      alert('Error: You must have an active demand for ' + schedulingItem.category + ' to claim this match.');
      setSchedulingItem(null);
      return;
    }

    try {
      const response = await fetch(`/api/donations/${schedulingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Pickup Scheduled',
          match: {
            ngoId: activeNgo.id,
            ngoName: activeNgo.name,
            demandId: matchingDemand.id,
            matchScore: 95,
            reasons: [
              `Direct category fit: "${schedulingItem.category.toUpperCase()}"`,
              `NGO scheduled express collection directly in dashboard`,
              `Distance optimized logistics`,
            ],
          },
          pickupSlot: {
            date: ngoSelectedDate,
            timeWindow: ngoSelectedTimeSlot,
            volunteerName: ngoDriverName,
            volunteerPhone: ngoDriverPhone,
          }
        }),
      });

      if (response.ok) {
        // Also update the filled count of demand
        const updatedFilled = Math.min(matchingDemand.quantityRequired, matchingDemand.quantityFilled + schedulingItem.quantity);
        await fetch(`/api/demands/${matchingDemand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantityFilled: updatedFilled }),
        });

        // Add a notification simulated log for donor
        await fetch('/api/notifications/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'SMS',
            recipient: schedulingItem.donorPhone || '+1 (555) 432-1098',
            message: `🔔 SmartShare: NGO "${activeNgo.name}" accepted your donation of ${schedulingItem.quantity}x ${schedulingItem.notes.split('.')[0]}! Pickup scheduled for ${ngoSelectedDate} during ${ngoSelectedTimeSlot} with driver ${ngoDriverName} (${ngoDriverPhone}).`
          })
        });

        setSchedulingItem(null);
        refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick helper to get category emojis
  const getCategoryEmoji = (cat: ItemCategory) => {
    switch (cat) {
      case 'clothing': return '🧥';
      case 'food': return '🥫';
      case 'books': return '📚';
      case 'electronics': return '📱';
      case 'furniture': return '🪑';
      case 'utensils': return '🍳';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar with Profile Trigger on Right */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-800 text-white rounded-xl shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 text-base leading-tight">NGO Operations & Fulfilling Network</h3>
            <p className="text-xs text-slate-500 font-sans">Manage localized community demands, claims, and delivery dispatches</p>
          </div>
        </div>

        {/* Right Side: Director Srinithin R. M Profile Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowProfileModal(!showProfileModal)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-bold ${
              showProfileModal
                ? 'bg-emerald-900 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-500">
              SR
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-bold text-xs leading-none">Srinithin R. M</p>
              <span className="text-[9px] opacity-80 font-normal">Verified NGO Director</span>
            </div>
            <User className="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>
      </div>

      {/* Srinithin R. M Profile View Popover / Card (Only shown when clicked) */}
      {showProfileModal && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-md space-y-2.5 animate-fade-in border-t-4 border-t-emerald-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-600 shadow-xs">
                SR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-slate-900 text-sm">{activeNgo.name}</h3>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> Verified NGO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-slate-700">Director: Srinithin R. M</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-600 font-bold text-[10px]">Officer ID: NGO-MGR-8829</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-500">Managing NGO:</span>
                <select 
                  value={selectedNgoId}
                  onChange={e => setSelectedNgoId(e.target.value)}
                  className="text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-800 focus:outline-emerald-600 cursor-pointer shadow-xs"
                >
                  {ngos.map(ngo => (
                    <option key={ngo.id} value={ngo.id}>{ngo.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Close Profile"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description & Address Banner */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
              <span>Location: {activeNgo.address}</span>
            </div>
            <p className="text-[11px] text-slate-600 italic leading-snug">
              "{activeNgo.description}"
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-slate-50/80 p-2 rounded-md border border-slate-200/80 space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Coordinator Email</span>
              <p className="font-semibold text-slate-800 font-mono truncate text-[10px]">{activeNgo.email}</p>
            </div>

            <div className="bg-slate-50/80 p-2 rounded-md border border-slate-200/80 space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</span>
              <p className="font-semibold text-slate-800 font-mono text-[10px]">{activeNgo.phone}</p>
            </div>

            <div className="bg-slate-50/80 p-2 rounded-md border border-slate-200/80 space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Director Name</span>
              <p className="font-semibold text-slate-800 truncate flex items-center gap-1 text-[10px]">
                <User className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Srinithin R. M</span>
              </p>
            </div>

            <div className="bg-slate-50/80 p-2 rounded-md border border-slate-200/80 space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Authorization</span>
              <p className="font-bold text-emerald-800 font-mono text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Active Field Director</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {activeNgo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR / MOBILE NAV BAR */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Mobile Horizontal Navigation Chips (Visible on Mobile/Tablet < lg) */}
            <div className="lg:hidden bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm text-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                NGO Portal Quick Menu
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'compatible', label: 'Compatible', icon: Sparkles, badge: incomingMatches.length },
                  { id: 'demands', label: 'Demands', icon: ClipboardList, badge: ngoDemands.length },
                  { id: 'pickup', label: 'Pickup', icon: Truck, badge: ngoMatchedDonations.filter(i => i.pickupSlot || i.status === 'Pickup Scheduled').length },
                  { id: 'claims', label: 'Claims', icon: Activity, badge: ngoMatchedDonations.length },
                  { id: 'history', label: 'History', icon: History, badge: historyItems.length },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isActive 
                          ? 'bg-emerald-800 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-emerald-700'}`} />
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

            {/* Desktop Left Vertical Navigation Menu (Stacked One by One) */}
            <div className="hidden lg:block bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                NGO Portal Navigation
              </span>

              {/* 1. Compatible Donations */}
              <button
                type="button"
                onClick={() => setActiveTab('compatible')}
                className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${
                  activeTab === 'compatible'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className={`w-4 h-4 ${activeTab === 'compatible' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                  <span>Compatible Donations</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'compatible' ? 'bg-emerald-700 text-white font-bold' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  {incomingMatches.length}
                </span>
              </button>

              {/* 2. New Demand Registry */}
              <button
                type="button"
                onClick={() => setActiveTab('demands')}
                className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${
                  activeTab === 'demands'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className={`w-4 h-4 ${activeTab === 'demands' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                  <span>New Demand Registry</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'demands' ? 'bg-emerald-700 text-white font-bold' : 'bg-slate-200 text-slate-700 font-bold'
                }`}>
                  {ngoDemands.length}
                </span>
              </button>

              {/* 3. Delivery Pickup */}
              <button
                type="button"
                onClick={() => setActiveTab('pickup')}
                className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${
                  activeTab === 'pickup'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Truck className={`w-4 h-4 ${activeTab === 'pickup' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                  <span>Delivery Pickup</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'pickup' ? 'bg-emerald-700 text-white font-bold' : 'bg-slate-200 text-slate-700 font-bold'
                }`}>
                  {ngoMatchedDonations.filter(i => i.pickupSlot || i.status === 'Pickup Scheduled').length}
                </span>
              </button>

              {/* 4. Active Claims */}
              <button
                type="button"
                onClick={() => setActiveTab('claims')}
                className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${
                  activeTab === 'claims'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className={`w-4 h-4 ${activeTab === 'claims' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                  <span>Active Claims</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'claims' ? 'bg-emerald-700 text-white font-bold' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  {ngoMatchedDonations.length}
                </span>
              </button>

              {/* 5. History */}
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                  <span>History</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'history' ? 'bg-emerald-700 text-white font-bold' : 'bg-slate-200 text-slate-700 font-bold'
                }`}>
                  {historyItems.length}
                </span>
              </button>
            </div>

            {/* STICKY BOTTOM MOBILE APP NAVIGATION BAR (Native mobile phone experience) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex justify-around items-center text-white shadow-2xl">
              {[
                { id: 'compatible', label: 'Matches', icon: Sparkles, badge: incomingMatches.length },
                { id: 'demands', label: 'Demands', icon: ClipboardList, badge: ngoDemands.length },
                { id: 'pickup', label: 'Pickup', icon: Truck, badge: ngoMatchedDonations.filter(i => i.pickupSlot || i.status === 'Pickup Scheduled').length },
                { id: 'claims', label: 'Claims', icon: Activity, badge: ngoMatchedDonations.length },
                { id: 'history', label: 'History', icon: History, badge: historyItems.length },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
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

          </div>

          {/* RIGHT MAIN PANEL: Render Details based on Active Tab */}
          <div className="lg:col-span-8 space-y-6">

            {/* VIEW 1: COMPATIBLE DONATIONS */}
            {activeTab === 'compatible' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display font-semibold text-slate-900 text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-700 animate-pulse" /> Compatible Donations Influx
                    </h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Intelligent Matching Engine detects donor items matching your active demand categories.
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase">
                    {incomingMatches.length} Matches Found
                  </span>
                </div>

                {/* Accept/Reject Interactive Evaluation Panel */}
                {selectedItemToReview && (
                  <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 space-y-3 shadow-md animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {getCategoryEmoji(selectedItemToReview.category)} {selectedItemToReview.category} Match
                      </span>
                      <button 
                        onClick={() => setSelectedItemToReview(null)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-xs text-slate-100">{selectedItemToReview.notes.split('.')[0]}</h5>
                      <p className="text-[11px] text-slate-400 italic mt-1 leading-normal">"{selectedItemToReview.notes}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded border border-slate-800 text-[11px] font-mono">
                      <div>
                        <span className="block text-[9px] text-slate-500">QUANTITY</span>
                        <span className="text-slate-200 font-bold">{selectedItemToReview.quantity} units</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500">CONFIDENCE</span>
                        <span className="text-emerald-400 font-bold">{(selectedItemToReview.confidence * 100).toFixed(0)}% Match</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button 
                        onClick={() => {
                          setRejectedDonationIds(prev => [...prev, selectedItemToReview.id]);
                          setSelectedItemToReview(null);
                        }}
                        className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 font-bold text-[11px] py-1.5 rounded flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> Reject / Ignore
                      </button>
                      <button 
                        onClick={() => {
                          handleOpenNgoScheduler(selectedItemToReview);
                          setSelectedItemToReview(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 rounded flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Accept Match & Schedule
                      </button>
                    </div>
                  </div>
                )}

                {incomingMatches.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-xl text-center text-xs text-slate-400 bg-slate-50/50 space-y-2">
                    <Info className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">No pending compatible donations</p>
                    <p className="text-[11px]">When local donors post items matching your active demand registry categories, they will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingMatches.map((item) => {
                      const isSelected = selectedItemToReview?.id === item.id;
                      return (
                        <div key={item.id} className={`border rounded-xl p-4 transition space-y-2.5 ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50/20 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                        }`}>
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl p-2 bg-slate-100 rounded-lg border border-slate-200">{getCategoryEmoji(item.category)}</span>
                              <div>
                                <p className="font-bold text-sm text-slate-900">{item.notes.split('.')[0]}</p>
                                <p className="text-xs text-slate-500 font-medium">Qty: <span className="font-mono font-bold text-slate-700">{item.quantity} units</span> | Category: <span className="capitalize font-semibold text-slate-700">{item.category}</span></p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedItemToReview(item)}
                              className={`font-semibold px-3 py-1.5 rounded-lg active:scale-95 text-xs cursor-pointer transition shadow-xs ${
                                isSelected 
                                  ? 'bg-amber-600 text-white hover:bg-amber-700' 
                                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
                              }`}
                            >
                              {isSelected ? 'Reviewing...' : 'Review Match'}
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 italic pl-2 border-l-2 border-emerald-500">"{item.notes}"</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: NEW DEMAND REGISTRY */}
            {activeTab === 'demands' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display font-semibold text-slate-900 text-lg flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-emerald-700" /> My Demand Registry
                    </h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Register specific category items required by your community hubs.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsAddingDemand(!isAddingDemand)}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> {isAddingDemand ? 'Cancel Form' : 'Register New Demand'}
                  </button>
                </div>

                {/* Add Demand Form */}
                {isAddingDemand && (
                  <form onSubmit={handleAddDemandSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Category</label>
                        <select 
                          value={newDemand.category}
                          onChange={e => {
                            const cat = e.target.value as ItemCategory;
                            setNewDemand({ ...newDemand, category: cat, specificItem: '' });
                          }}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white font-semibold text-slate-700 focus:outline-emerald-600"
                        >
                          <option value="clothing">Clothing</option>
                          <option value="food">Food</option>
                          <option value="books">Books</option>
                          <option value="electronics">Electronics</option>
                          <option value="furniture">Furniture</option>
                          <option value="utensils">Utensils</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Units Required</label>
                        <input 
                          type="number"
                          min="1"
                          value={newDemand.quantityRequired}
                          onChange={e => setNewDemand({ ...newDemand, quantityRequired: Number(e.target.value) })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white font-mono text-slate-700 focus:outline-emerald-600"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Specific Item Type (e.g. Shirt, Pant, Sweater)</label>
                      <input 
                        type="text"
                        value={newDemand.specificItem}
                        onChange={e => setNewDemand({ ...newDemand, specificItem: e.target.value })}
                        placeholder={
                          newDemand.category === 'clothing' ? "e.g. Shirts, Pants, Sweaters, Jackets..." :
                          newDemand.category === 'food' ? "e.g. Canned Soup, Rice Bags, Fresh Produce..." :
                          "e.g. Textbooks, Laptops, Cookware..."
                        }
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-700 focus:outline-emerald-600 font-medium"
                        required
                      />
                      {newDemand.category === 'clothing' && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['Shirts', 'Pants', 'Sweaters', 'Jackets', 'Blankets', 'Socks'].map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setNewDemand({ ...newDemand, specificItem: item })}
                              className={`text-[9px] px-2 py-0.5 rounded border transition cursor-pointer ${
                                newDemand.specificItem === item
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              + {item}
                            </button>
                          ))}
                        </div>
                      )}
                      {newDemand.category === 'food' && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['Rice Bags', 'Canned Soup', 'Baby Food', 'Biscuits', 'Cooking Oil'].map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setNewDemand({ ...newDemand, specificItem: item })}
                              className={`text-[9px] px-2 py-0.5 rounded border transition cursor-pointer ${
                                newDemand.specificItem === item
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              + {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Urgency Priority</label>
                        <div className="flex gap-2">
                          {['Low', 'Medium', 'High'].map(p => (
                            <button 
                              key={p}
                              type="button"
                              onClick={() => setNewDemand({ ...newDemand, priority: p as any })}
                              className={`flex-1 text-center py-1 text-xs font-semibold rounded cursor-pointer transition ${
                                newDemand.priority === p 
                                  ? 'bg-emerald-700 text-white shadow-xs' 
                                  : 'bg-white border text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                        <input 
                          type="date"
                          value={newDemand.expiryDate}
                          onChange={e => setNewDemand({ ...newDemand, expiryDate: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white font-mono text-slate-700 focus:outline-emerald-600"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Detailed Description of Needs</label>
                      <textarea 
                        value={newDemand.description}
                        onChange={e => setNewDemand({ ...newDemand, description: e.target.value })}
                        rows={2}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-emerald-600 text-slate-700"
                        placeholder="Specify sizes, brand preferences, age limits, or packaging guidelines..."
                        required
                      />
                    </div>

                    <button type="submit" className="w-full btn-primary text-xs py-2 cursor-pointer shadow-xs">
                      Submit Demand to Network Registry
                    </button>
                  </form>
                )}

                {ngoDemands.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No active demands listed. Click "+ Register New Demand" above to create one.</p>
                ) : (
                  <div className="space-y-3.5">
                    {ngoDemands.map((demand) => {
                      const percentFilled = Math.round((demand.quantityFilled / demand.quantityRequired) * 100);
                      return (
                        <div 
                          key={demand.id} 
                          className="border border-slate-200 rounded-xl p-4 bg-white hover:border-emerald-300 transition shadow-xs space-y-2.5 relative"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl p-2 bg-slate-100 rounded-lg border border-slate-200">{getCategoryEmoji(demand.category)}</span>
                              <div>
                                <p className="font-bold text-sm text-slate-900 capitalize flex items-center gap-2">
                                  {demand.specificItem || demand.category}
                                  <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                    {demand.category}
                                  </span>
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">Expires {demand.expiryDate}</p>
                              </div>
                            </div>

                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono ${
                              demand.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                              demand.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {demand.priority} Priority
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 italic bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">"{demand.description}"</p>

                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Filled progress: <span className="font-mono text-slate-800 font-bold">{demand.quantityFilled}</span> / <span className="font-mono text-slate-800 font-bold">{demand.quantityRequired} units</span></span>
                              <span className="font-mono text-emerald-800 font-bold">{percentFilled}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${percentFilled}%` }} />
                            </div>
                          </div>

                          {/* Interactive Matching Donor Items indicator & reviewer */}
                          {(() => {
                            const matchingItemsForThisDemand = donations.filter(item => 
                              item.status === 'Draft' && 
                              item.category === demand.category &&
                              !rejectedDonationIds.includes(item.id)
                            );
                            const isExpanded = expandedDemandId === demand.id;

                            return (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  {matchingItemsForThisDemand.length > 0 ? (
                                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase tracking-wide">
                                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                      {matchingItemsForThisDemand.length} matching item{matchingItemsForThisDemand.length > 1 ? 's' : ''} detected
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                                      ● No matching donor items detected
                                    </span>
                                  )}

                                  {matchingItemsForThisDemand.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedDemandId(isExpanded ? null : demand.id)}
                                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer border border-emerald-200"
                                    >
                                      {isExpanded ? 'Hide Matches ▴' : 'Review & Take Matches ▾'}
                                    </button>
                                  )}
                                </div>

                                {/* Expanded panel to accept/reject */}
                                {isExpanded && matchingItemsForThisDemand.length > 0 && (
                                  <div className="mt-2 space-y-2 p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-white animate-fade-in shadow-inner">
                                    <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex justify-between items-center">
                                      <span>Review matched products</span>
                                      <span className="text-emerald-400 font-mono">{matchingItemsForThisDemand.length} pending decision</span>
                                    </div>

                                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                      {matchingItemsForThisDemand.map((item) => (
                                        <div key={item.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2 text-xs">
                                          <div className="flex justify-between items-start gap-2">
                                            <div>
                                              <p className="font-bold text-slate-100 flex items-center gap-1.5">
                                                <span>{item.notes.split('.')[0]}</span>
                                                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono font-normal px-1.5 py-0.5 rounded">
                                                  Qty: {item.quantity}
                                                </span>
                                              </p>
                                              <p className="text-[11px] text-slate-400 italic mt-1 leading-relaxed">
                                                "{item.notes}"
                                              </p>
                                            </div>
                                            <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                              {(item.confidence * 100).toFixed(0)}% Match
                                            </span>
                                          </div>

                                          <div className="flex gap-2 justify-end pt-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setRejectedDonationIds(prev => [...prev, item.id]);
                                              }}
                                              className="bg-red-950 hover:bg-red-900 text-red-200 border border-red-900/80 text-[10px] font-bold py-1 px-2.5 rounded transition cursor-pointer flex items-center gap-1"
                                            >
                                              <ThumbsDown className="w-3 h-3" /> Ignore / Reject
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleOpenNgoScheduler(item);
                                                if (matchingItemsForThisDemand.length <= 1) {
                                                  setExpandedDemandId(null);
                                                }
                                              }}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-3 rounded transition cursor-pointer flex items-center gap-1"
                                            >
                                              <ThumbsUp className="w-3 h-3" /> Accept Match
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: DELIVERY PICKUP */}
            {activeTab === 'pickup' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display font-semibold text-slate-900 text-lg flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-700" /> Delivery Pickup Logistics
                    </h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Monitor scheduled volunteer pick-ups, driver contacts, and delivery dispatch slots.
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase">
                    {ngoMatchedDonations.filter(i => i.pickupSlot || i.status === 'Pickup Scheduled').length} Active Pickups
                  </span>
                </div>

                {ngoMatchedDonations.filter(i => i.pickupSlot || i.status === 'Pickup Scheduled' || i.status === 'Collected').length === 0 ? (
                  <div className="p-8 border border-dashed rounded-xl text-center text-xs text-slate-400 bg-slate-50/50 space-y-2">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">No scheduled pickup dispatches</p>
                    <p className="text-[11px]">When you claim compatible donations and assign pickup slots, logistics details will be monitored here.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {ngoMatchedDonations
                      .filter(i => i.pickupSlot || i.status === 'Pickup Scheduled' || i.status === 'Collected')
                      .map(item => (
                        <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-xs">
                          <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl p-2 bg-slate-100 rounded-lg border border-slate-200">{getCategoryEmoji(item.category)}</span>
                              <div>
                                <p className="font-bold text-sm text-slate-900">{item.notes.split('.')[0]}</p>
                                <p className="text-xs text-slate-500 font-medium">Qty: <span className="font-mono font-bold text-slate-700">{item.quantity} units</span> | Category: <span className="capitalize font-semibold text-slate-700">{item.category}</span></p>
                              </div>
                            </div>
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase">
                              {item.status}
                            </span>
                          </div>

                          {item.pickupSlot && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-emerald-700" /> Driver: {item.pickupSlot.volunteerName} ({item.pickupSlot.volunteerPhone})
                                </p>
                                <span className="text-[10px] text-emerald-800 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{item.pickupSlot.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>Estimated Window: <strong className="text-slate-900 font-mono">{item.pickupSlot.timeWindow}</strong></span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleResendOtpToDonor(item)}
                              disabled={resendingOtpId === item.id}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{resendingOtpId === item.id ? 'Sending...' : 'Notify Donor via SMS'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: ACTIVE CLAIMS */}
            {activeTab === 'claims' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display font-semibold text-slate-900 text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-700" /> Active Claim Pipelines
                    </h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Track and monitor progress of claims matched to your organization.
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase">
                    {ngoMatchedDonations.length} Active Claims
                  </span>
                </div>

                {ngoMatchedDonations.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-xl text-center text-xs text-slate-400 bg-slate-50/50 space-y-2">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">No active claims in pipeline</p>
                    <p className="text-[11px]">When you accept matched donations, they enter your active claims pipeline.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {ngoMatchedDonations.map((item) => {
                      const estTime = item.estimatedDeliveryTime || item.pickupSlot?.estimatedDeliveryTime || (item.pickupSlot ? `${item.pickupSlot.date} during ${item.pickupSlot.timeWindow}` : 'Slot assigned');

                      return (
                        <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white text-xs space-y-3 shadow-xs hover:border-emerald-300 transition">
                          <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.notes.split('.')[0]}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Quantity: <span className="font-mono font-bold">{item.quantity}</span> | Match score: <span className="font-mono text-emerald-700 font-bold">{item.match?.matchScore}%</span></p>
                            </div>
                            <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.status === 'Collected' || item.status === 'Delivered' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                            }`}>{item.status}</span>
                          </div>

                          {item.pickupSlot && (
                            <div className="bg-slate-50 p-3 rounded-lg text-[11px] border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-800">Driver: {item.pickupSlot.volunteerName} ({item.pickupSlot.volunteerPhone})</p>
                                <span className="text-[10px] text-emerald-800 font-mono font-bold">{item.pickupSlot.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>Est. Delivery Time: <strong className="text-slate-900">{estTime}</strong></span>
                              </div>
                            </div>
                          )}

                          {/* Donor OTP Handover Verification Box */}
                          {item.pickupSlot && (
                            <div className="bg-emerald-950 text-white rounded-xl p-3.5 space-y-2 border border-emerald-800">
                              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Handover OTP Verification
                                </span>
                                {item.otpVerified ? (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                                    Pending Verification
                                  </span>
                                )}
                              </div>

                              {otpSuccess[item.id] && (
                                <p className="text-[11px] text-emerald-300 font-semibold bg-emerald-900/80 p-1.5 rounded border border-emerald-700">
                                  {otpSuccess[item.id]}
                                </p>
                              )}

                              {otpErrors[item.id] && (
                                <p className="text-[11px] text-rose-300 font-semibold bg-rose-950/80 p-1.5 rounded border border-rose-800">
                                  {otpErrors[item.id]}
                                </p>
                              )}

                              {!item.otpVerified && item.status !== 'Delivered' && item.status !== 'Acknowledged' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter 6-digit OTP"
                                    value={otpInputs[item.id] || ''}
                                    onChange={(e) => setOtpInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="w-32 bg-slate-900 text-emerald-200 border border-emerald-700 rounded px-2.5 py-1 text-xs font-mono font-bold tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-500 focus:outline-emerald-500"
                                  />

                                  <button
                                    onClick={() => handleVerifyOtp(item)}
                                    disabled={verifyingOtpId === item.id}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition shadow-xs cursor-pointer disabled:opacity-50"
                                  >
                                    {verifyingOtpId === item.id ? 'Verifying...' : 'Verify OTP'}
                                  </button>

                                  <button
                                    onClick={() => handleResendOtpToDonor(item)}
                                    disabled={resendingOtpId === item.id}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-[11px] rounded border border-slate-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                    title="Resend OTP SMS to donor"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{resendingOtpId === item.id ? 'Sending...' : 'Resend SMS'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Advance Pipeline Status */}
                          <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-100">
                            {item.status === 'Pickup Scheduled' && (
                              <button 
                                onClick={async () => {
                                  await fetch(`/api/donations/${item.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'Collected' }),
                                  });
                                  refreshAll();
                                }}
                                className="bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold text-[10px] px-2.5 py-1 rounded transition cursor-pointer"
                              >
                                Bypass & Mark Collected
                              </button>
                            )}
                            {item.status === 'Collected' && (
                              <button 
                                onClick={async () => {
                                  await fetch(`/api/donations/${item.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'Delivered' }),
                                  });
                                  refreshAll();
                                }}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded transition cursor-pointer shadow-xs"
                              >
                                Mark Donation Picked Up
                              </button>
                            )}
                            {item.status === 'Delivered' && (
                              <button 
                                onClick={async () => {
                                  await fetch(`/api/donations/${item.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'Acknowledged' }),
                                  });
                                  refreshAll();
                                }}
                                className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded transition cursor-pointer shadow-xs"
                              >
                                Send Final Acknowledgment
                              </button>
                            )}
                            {item.status === 'Acknowledged' && (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Fulfilling Complete</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 5: HISTORY */}
            {activeTab === 'history' && (
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-sm space-y-4 sm:space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display font-semibold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                      <History className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" /> Donation Picked Up & Fulfillment History
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-sans mt-0.5">
                      Archived record of all donations successfully picked up, received, and acknowledged by {activeNgo.name}.
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase self-start sm:self-auto">
                    {historyItems.length} Picked Up Orders
                  </span>
                </div>

                {/* MONTHLY DONATIONS PICKED UP BAR GRAPH WITH ITEM CATEGORIES */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <h5 className="font-display font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-700" />
                        Monthly Donations Picked Up (By Item Category)
                      </h5>
                      <p className="text-[10px] sm:text-[11px] text-slate-500">
                        Monthly analysis of donation items received and processed across categories
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                        Total: {totalUnitsPickedUp} Units ({historyItems.length} Records)
                      </span>
                    </div>
                  </div>

                  {/* Category Legend */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] font-medium">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Categories:</span>
                    <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 🧥 Clothing
                    </span>
                    <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span> 🥫 Food
                    </span>
                    <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span> 📚 Books
                    </span>
                    <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span> 💻 Electronics
                    </span>
                    <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-orange-600"></span> 🍳 Utensils
                    </span>
                    <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-slate-600"></span> 🪑 Furniture
                    </span>
                  </div>

                  {/* Interactive Recharts Bar Chart */}
                  <div className="h-48 sm:h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            const totalMonth = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-700 text-xs space-y-1.5 font-sans">
                                <p className="font-bold border-b border-slate-700 pb-1 text-emerald-400">{label}</p>
                                <p className="text-[11px] font-semibold text-slate-300">Total Picked Up: <strong className="text-white font-mono">{totalMonth} units</strong></p>
                                <div className="space-y-0.5 pt-1 text-[10px]">
                                  {payload.map((entry: any, index: number) => (
                                    <div key={`item-${index}`} className="flex justify-between items-center gap-4">
                                      <span className="flex items-center gap-1.5" style={{ color: entry.fill }}>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                                        {entry.name}:
                                      </span>
                                      <span className="font-mono font-bold text-slate-200">{entry.value} units</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }} />
                        <Bar dataKey="clothing" name="Clothing" fill="#059669" radius={[2, 2, 0, 0]} stackId="a" />
                        <Bar dataKey="food" name="Food" fill="#d97706" radius={[2, 2, 0, 0]} stackId="a" />
                        <Bar dataKey="books" name="Books" fill="#2563eb" radius={[2, 2, 0, 0]} stackId="a" />
                        <Bar dataKey="electronics" name="Electronics" fill="#7c3aed" radius={[2, 2, 0, 0]} stackId="a" />
                        <Bar dataKey="utensils" name="Utensils" fill="#ea580c" radius={[2, 2, 0, 0]} stackId="a" />
                        <Bar dataKey="furniture" name="Furniture" fill="#475569" radius={[2, 2, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* History Items Listing */}
                {historyItems.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-xl text-center text-xs text-slate-400 bg-slate-50/50 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">No completed history items yet</p>
                    <p className="text-[11px]">Once your claimed items are picked up and acknowledged, they will be archived here.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Historical Picked Up Records</h5>
                    {historyItems.map(item => (
                      <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 hover:border-emerald-300 transition shadow-xs">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-2 bg-slate-100 rounded-lg border border-slate-200">{getCategoryEmoji(item.category)}</span>
                            <div>
                              <p className="font-bold text-sm text-slate-900">{item.notes.split('.')[0]}</p>
                              <p className="text-xs text-slate-500 font-medium">
                                Qty: <span className="font-mono font-bold text-slate-700">{item.quantity} units</span> | Category: <span className="font-bold text-slate-700 capitalize">{item.category}</span> | Completed: <span className="font-mono">{new Date(item.detectedAt).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 font-mono uppercase self-start sm:self-center">
                            <Check className="w-3.5 h-3.5 text-emerald-700" /> Donation Picked Up
                          </span>
                        </div>

                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                          <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                            💌 Acknowledgment Receipt from {item.match?.ngoName || activeNgo.name}
                          </p>
                          <p className="italic font-sans text-slate-600">
                            "We have successfully received and verified the quantity of <strong>{item.quantity} units</strong>. They are being cataloged for immediate community distribution. Thank you for your support!"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* NGO-Side Pickup Scheduling Modal */}
      {schedulingItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden text-slate-800">
            <div className="bg-emerald-700 text-white p-4">
              <h4 className="font-display font-semibold flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-emerald-100" /> Accept Donation & Schedule Pickup
              </h4>
              <p className="text-xs text-emerald-100 mt-1">
                You are claiming "{schedulingItem.notes.split('.')[0]}". Please specify the pickup details for the donor.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pick Pickup Date</label>
                <input 
                  type="date" 
                  value={ngoSelectedDate}
                  onChange={e => setNgoSelectedDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 font-mono text-slate-700 focus:outline-emerald-600 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estimated Arrival Window</label>
                <select 
                  value={ngoSelectedTimeSlot}
                  onChange={e => setNgoSelectedTimeSlot(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 font-semibold text-slate-700 focus:outline-emerald-600"
                >
                  <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Early Morning)</option>
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Late Morning)</option>
                  <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM (Early Afternoon)</option>
                  <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM (Late Afternoon)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Driver Name</label>
                  <select
                    value={ngoDriverName}
                    onChange={e => {
                      setNgoDriverName(e.target.value);
                      const matchingPreset = [
                        { name: 'Michael Adams', phone: '+1 (555) 304-9871' },
                        { name: 'Sophia Chen', phone: '+1 (555) 782-4412' },
                        { name: 'David Lee', phone: '+1 (555) 234-5678' },
                        { name: 'Emma Watson', phone: '+1 (555) 890-1234' }
                      ].find(d => d.name === e.target.value);
                      if (matchingPreset) {
                        setNgoDriverPhone(matchingPreset.phone);
                      }
                    }}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 font-semibold text-slate-700 focus:outline-emerald-600"
                  >
                    <option value="Michael Adams">Michael Adams</option>
                    <option value="Sophia Chen">Sophia Chen</option>
                    <option value="David Lee">David Lee</option>
                    <option value="Emma Watson">Emma Watson</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Driver Phone</label>
                  <input 
                    type="text" 
                    value={ngoDriverPhone}
                    onChange={e => setNgoDriverPhone(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 font-mono text-slate-700 focus:outline-emerald-600 font-semibold"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <span>Confirming this match will automatically notify the donor about your dispatch schedule.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setSchedulingItem(null)} 
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmNgoClaim} 
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs cursor-pointer shadow-sm"
                >
                  Confirm Match & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demand Detail Inspector Modal */}
      {selectedDemandDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-slate-800 rounded-lg border border-slate-700">
                  {getCategoryEmoji(selectedDemandDetail.category)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white capitalize">
                      {selectedDemandDetail.specificItem || selectedDemandDetail.category}
                    </h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      selectedDemandDetail.priority === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                      selectedDemandDetail.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {selectedDemandDetail.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1 font-mono">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> {selectedDemandDetail.ngoName}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedDemandDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Progress & Quantity Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>Fulfillment Progress</span>
                  <span className="text-emerald-700 font-mono">
                    {selectedDemandDetail.quantityFilled} / {selectedDemandDetail.quantityRequired} units ({Math.round((selectedDemandDetail.quantityFilled / selectedDemandDetail.quantityRequired) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300" 
                    style={{ width: `${Math.round((selectedDemandDetail.quantityFilled / selectedDemandDetail.quantityRequired) * 100)}%` }} 
                  />
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Remaining needed: <strong className="text-slate-800 font-mono">{Math.max(0, selectedDemandDetail.quantityRequired - selectedDemandDetail.quantityFilled)} units</strong>
                </p>
              </div>

              {/* Requirement Statement */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-700" /> Detailed Need Statement
                </h4>
                <p className="bg-white border border-slate-200 rounded-lg p-3 text-slate-700 text-xs leading-relaxed italic">
                  "{selectedDemandDetail.description}"
                </p>
              </div>

              {/* Expiry Date & Priority Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Registry Target Deadline</span>
                  <p className="font-medium text-slate-800 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{selectedDemandDetail.expiryDate}</span>
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category Tag</span>
                  <p className="font-medium text-slate-800 flex items-center gap-1.5 capitalize font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{selectedDemandDetail.category}</span>
                  </p>
                </div>
              </div>

              {/* Matched Donor Items Indicator */}
              {(() => {
                const matches = donations.filter(item => 
                  item.status === 'Draft' && 
                  item.category === selectedDemandDetail.category &&
                  !rejectedDonationIds.includes(item.id)
                );

                return (
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                        {matches.length} Matching Donor Item{matches.length === 1 ? '' : 's'} Ready
                      </span>
                      {matches.length > 0 && (
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded font-mono uppercase">
                          Action Needed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {matches.length > 0 
                        ? 'Donors have logged items in this category. You can review and claim them directly.'
                        : 'No pending donor items logged for this category at the moment. Matched items will appear automatically.'
                      }
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedDemandDetail(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const targetId = selectedDemandDetail.id;
                  setSelectedDemandDetail(null);
                  setExpandedDemandId(targetId);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4" /> Review & Match Items
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
