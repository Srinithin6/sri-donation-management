/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RotateCw, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  MapPin, 
  Truck, 
  Clock, 
  HelpCircle, 
  AlertCircle,
  FileText,
  Info,
  Upload,
  Locate,
  Home,
  Bell,
  Gift,
  History,
  Package,
  Check,
  Heart,
  Users
} from 'lucide-react';
import { DonationItem, ItemCategory, DonorProfile, NGODemand, NotificationLog } from '../types';
import DonorSidebar from './donor/DonorSidebar';
import DonorHomeTab from './donor/DonorHomeTab';
import DonorProfileTab from './donor/DonorProfileTab';
import DonorNotificationsTab from './donor/DonorNotificationsTab';
import DonorDeliveryTab from './donor/DonorDeliveryTab';
import DonorHistoryTab from './donor/DonorHistoryTab';

interface DonorDashboardProps {
  donorProfile: DonorProfile | null;
  donations: DonationItem[];
  demands: NGODemand[];
  notifications: NotificationLog[];
  refreshAll: () => void;
}

const DEMO_PRESETS = [
  { name: 'Warm Winter Coats', icon: '🧥', category: 'clothing', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
  { name: 'Canned Beans Pack', icon: '🥫', category: 'food', url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=300&q=80' },
  { name: 'Math Textbooks', icon: '📚', category: 'books', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80' },
  { name: 'Utensils and Pots', icon: '🍳', category: 'utensils', url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80' }
];

export default function DonorDashboard({
  donorProfile,
  donations,
  demands,
  notifications,
  refreshAll,
}: DonorDashboardProps) {
  // Tabs: 'home' | 'profile' | 'donation' | 'notification' | 'delivery' | 'history'
  const [donorTab, setDonorTab] = useState<'home' | 'profile' | 'donation' | 'notification' | 'delivery' | 'history'>('home');

  // Manual Form States
  const [inputMethod, setInputMethod] = useState<'manual' | 'ai'>('manual');
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<ItemCategory>('clothing');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualNotes, setManualNotes] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // AI Camera & Detection States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [simulatorItemIdx, setSimulatorItemIdx] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedCart, setDetectedCart] = useState<{
    itemName: string;
    category: ItemCategory;
    quantity: number;
    confidence: number;
    notes: string;
    imageUrl?: string;
  } | null>(null);
  const [isInferenceLoading, setIsInferenceLoading] = useState(false);

  // Interactive Drawer Matchmaking
  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);

  // Profile management
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLocatingProfile, setIsLocatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: donorProfile?.name || '',
    phone: donorProfile?.phone || '',
    address: donorProfile?.address || '',
  });

  // Scheduling Modal
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingItem, setSchedulingItem] = useState<DonationItem | null>(null);
  const [selectedDate, setSelectedDate] = useState('2026-07-08');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM - 12:00 PM');

  // Custom packaging checklist
  const [checklistActiveId, setChecklistActiveId] = useState<string | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklist, setChecklist] = useState<string[]>([]);

  // Edit Correction state
  const [isUpdatingExistingId, setIsUpdatingExistingId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Synchronize profile details when loaded
  useEffect(() => {
    if (donorProfile) {
      setProfileForm({
        name: donorProfile.name,
        phone: donorProfile.phone,
        address: donorProfile.address,
      });
    }
  }, [donorProfile]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleProfileAutoLocation = async () => {
    setIsLocatingProfile(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch('/api/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: latitude, lng: longitude }),
              });
              if (response.ok) {
                const data = await response.json();
                setProfileForm(prev => ({
                  ...prev,
                  address: data.formattedAddress,
                }));
              } else {
                setProfileForm(prev => ({
                  ...prev,
                  address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                }));
              }
            } catch {
              setProfileForm(prev => ({
                ...prev,
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              }));
            } finally {
              setIsLocatingProfile(false);
            }
          },
          (error) => {
            console.error('Geolocation lookup failed:', error);
            // Fallback default coordinate geocoding
            setProfileForm(prev => ({ ...prev, address: '456 Mission St, San Francisco, CA' }));
            setIsLocatingProfile(false);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        setCameraError('Browser geolocation is unavailable.');
        setIsLocatingProfile(false);
      }
    } catch {
      setIsLocatingProfile(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setDetectedCart(null);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsSimulatorActive(false);
    } catch (err) {
      console.warn('Webcam hardware blocked or unavailable. Initializing safe visual bypass simulator.', err);
      setIsSimulatorActive(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsSimulatorActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const processImageFile = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setCameraError(null);
      setIsInferenceLoading(true);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        try {
          // Send to server-side Gemini Flash API for structured classification
          const response = await fetch('/api/detect-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image }),
          });

          if (!response.ok) throw new Error('AI Inference failed');
          const results = await response.json();

          if (results && results.length > 0) {
            const item = results[0];
            setDetectedCart({
              itemName: item.itemName,
              category: item.category as ItemCategory,
              quantity: item.quantity,
              confidence: item.confidence,
              notes: item.notes || 'Identified from uploaded file.',
              imageUrl: base64Image,
            });
          } else {
            throw new Error('Inference returned empty results.');
          }
        } catch (err: any) {
          console.error(err);
          setCameraError(err.message || 'Error processing file with Gemini.');
        } finally {
          setIsInferenceLoading(false);
          resolve();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCapture = async () => {
    if (isSimulatorActive) {
      setIsInferenceLoading(true);
      setCameraError(null);
      try {
        const activePreset = DEMO_PRESETS[simulatorItemIdx];
        const response = await fetch('/api/detect-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mockItemName: activePreset.name }),
        });

        if (!response.ok) throw new Error('Inference simulation failed');
        const results = await response.json();

        if (results && results.length > 0) {
          const item = results[0];
          setDetectedCart({
            itemName: item.itemName,
            category: item.category as ItemCategory,
            quantity: item.quantity,
            confidence: item.confidence,
            notes: item.notes || 'Identified from simulated camera feed.',
            imageUrl: activePreset.url,
          });
          setIsCameraActive(false);
          setIsSimulatorActive(false);
        } else {
          throw new Error('Inference returned empty result.');
        }
      } catch (err: any) {
        console.error(err);
        setCameraError(err.message || 'Error processing AI vision inference.');
      } finally {
        setIsInferenceLoading(false);
      }
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;
    
    setIsInferenceLoading(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();

        // Perform Server-Side Inference with Gemini 3.5 Flash
        const response = await fetch('/api/detect-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image }),
        });

        if (!response.ok) throw new Error('AI Inference failed');
        const results = await response.json();
        
        if (results && results.length > 0) {
          const item = results[0];
          setDetectedCart({
            itemName: item.itemName,
            category: item.category as ItemCategory,
            quantity: item.quantity,
            confidence: item.confidence,
            notes: item.notes || 'Identified from camera frame.',
            imageUrl: base64Image,
          });
        } else {
          throw new Error('No items detected. Try again.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setCameraError(err.message || 'Error processing AI vision inference.');
    } finally {
      setIsInferenceLoading(false);
    }
  };

  const handlePresetSelect = async (preset: typeof DEMO_PRESETS[0]) => {
    setIsInferenceLoading(true);
    setCameraError(null);
    try {
      const response = await fetch('/api/detect-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockItemName: preset.name }),
      });

      if (!response.ok) throw new Error('Simulation failed');
      const results = await response.json();
      
      if (results && results.length > 0) {
        const item = results[0];
        setDetectedCart({
          itemName: item.itemName,
          category: item.category as ItemCategory,
          quantity: item.quantity,
          confidence: item.confidence,
          notes: item.notes,
          imageUrl: preset.url,
        });
      }
    } catch (err: any) {
      setCameraError('Failed to simulate preset item.');
    } finally {
      setIsInferenceLoading(false);
    }
  };

  const handleSaveToCatalog = async () => {
    if (!detectedCart) return;

    try {
      if (isUpdatingExistingId) {
        const response = await fetch(`/api/donations/${isUpdatingExistingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: detectedCart.category,
            quantity: detectedCart.quantity,
            confidence: detectedCart.confidence,
            imageUrl: detectedCart.imageUrl,
            notes: `${detectedCart.itemName}. ${detectedCart.notes}`,
            status: 'Draft',
          }),
        });

        if (response.ok) {
          setDetectedCart(null);
          setIsUpdatingExistingId(null);
          refreshAll();
        }
      } else {
        const response = await fetch('/api/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: detectedCart.category,
            quantity: detectedCart.quantity,
            confidence: detectedCart.confidence,
            imageUrl: detectedCart.imageUrl,
            notes: `${detectedCart.itemName}. ${detectedCart.notes}`,
            status: 'Draft',
          }),
        });

        if (response.ok) {
          setDetectedCart(null);
          refreshAll();
        }
      }
    } catch (err) {
      console.error('Save to catalog error:', err);
    }
  };

  const exploreMatchesForItem = async (item: DonationItem) => {
    setSelectedDonation(item);
    setIsMatchingLoading(true);
    try {
      const res = await fetch(`/api/donations/${item.id}/matches`);
      if (res.ok) {
        const data = await res.json();
        setActiveMatches(data.matches || []);
      }
    } catch (err) {
      console.error('Match search error:', err);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const handleSelectMatch = async (match: any) => {
    if (!selectedDonation) return;

    try {
      const response = await fetch(`/api/donations/${selectedDonation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Matched',
          match: {
            ngoId: match.ngoId,
            ngoName: match.ngoName,
            demandId: match.demandId,
            matchScore: match.matchScore,
            reasons: match.reasons,
          },
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSelectedDonation(updated);
        exploreMatchesForItem(updated);
        refreshAll();
      }
    } catch (err) {
      console.error('Error selecting match:', err);
    }
  };

  const handleGenerateChecklist = async (item: DonationItem) => {
    setChecklistActiveId(item.id);
    setChecklistLoading(true);
    try {
      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: item.category,
          itemName: item.notes.split('.')[0] || `${item.category} pack`,
          notes: item.notes,
        }),
      });

      if (response.ok) {
        const steps = await response.json();
        setChecklist(steps);
        
        if (item.status === 'Matched') {
          await fetch(`/api/donations/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Packaging Notified' }),
          });
          refreshAll();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleOpenScheduler = (item: DonationItem) => {
    setSchedulingItem(item);
    setSelectedDate('2026-07-08');
    setSelectedTimeSlot('10:00 AM - 12:00 PM');
    setIsScheduling(true);
  };

  const handleConfirmSchedule = async () => {
    if (!schedulingItem) return;

    const volunteers = [
      { name: 'Michael Adams', phone: '+1 (555) 304-9871' },
      { name: 'Sophia Chen', phone: '+1 (555) 782-4412' },
      { name: 'David Lee', phone: '+1 (555) 234-5678' }
    ];
    const pickedVolunteer = volunteers[Math.floor(Math.random() * volunteers.length)];

    try {
      const response = await fetch(`/api/donations/${schedulingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Pickup Scheduled',
          pickupSlot: {
            date: selectedDate,
            timeWindow: selectedTimeSlot,
            volunteerName: pickedVolunteer.name,
            volunteerPhone: pickedVolunteer.phone,
          },
        }),
      });

      if (response.ok) {
        setIsScheduling(false);
        setSchedulingItem(null);
        refreshAll();
      }
    } catch (err) {
      console.error('Scheduling error:', err);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    setIsSubmittingManual(true);
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: manualCategory,
          quantity: manualQuantity,
          confidence: 1.0,
          imageUrl: '',
          notes: `${manualName.trim()}.${manualNotes.trim() ? ' ' + manualNotes.trim() : ''}`,
          status: 'Draft',
        }),
      });

      if (response.ok) {
        setManualName('');
        setManualCategory('clothing');
        setManualQuantity(1);
        setManualNotes('');
        refreshAll();
      }
    } catch (err) {
      console.error('Error adding donation manually:', err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingProfile(false);
    try {
      const geocodeRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: profileForm.address }),
      });
      
      let finalCoords = donorProfile?.coordinates || { lat: 37.7892, lng: -122.3994 };
      let finalAddress = profileForm.address;
      
      if (geocodeRes.ok) {
        const geocodeData = await geocodeRes.json();
        finalCoords = { lat: geocodeData.lat, lng: geocodeData.lng };
        finalAddress = geocodeData.formattedAddress;
      }

      const response = await fetch('/api/donor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          address: finalAddress,
          coordinates: finalCoords,
        }),
      });

      if (response.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error('Error updating profile with geocoding:', err);
    }
  };

  // Split donations based on status
  const draftDonations = donations.filter(d => d.status === 'Draft');
  const activeDeliveries = donations.filter(d => ['Matched', 'Packaging Notified', 'Pickup Scheduled', 'Collected'].includes(d.status));
  const completedDonations = donations.filter(d => ['Delivered', 'Acknowledged'].includes(d.status));

  // Find if there is any active pickup scheduled
  const activePickupItem = donations.find(d => d.status === 'Pickup Scheduled');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800">
      {/* LEFT COLUMN: Sidebar Navigation, Profile & Status Alert */}
      <div className="lg:col-span-3 space-y-4">
        <DonorSidebar
          donorTab={donorTab}
          setDonorTab={setDonorTab}
          draftCount={draftDonations.length}
          notificationCount={notifications.filter(n => n.recipient === donorProfile?.phone || n.recipient === donorProfile?.email || n.recipient === 'jane.donor@example.com' || n.recipient === '+1 (555) 432-1098').length}
          deliveryCount={activeDeliveries.length}
          historyCount={completedDonations.length}
          activePickupItem={activePickupItem}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          handleUpdateProfile={handleUpdateProfile}
          handleProfileAutoLocation={handleProfileAutoLocation}
          isLocatingProfile={isLocatingProfile}
          donorProfile={donorProfile}
        />
      </div>

      {/* RIGHT COLUMN: Tab content area */}
      <div className="lg:col-span-9 space-y-6">
        {donorTab === 'home' && (
          <DonorHomeTab
            donorProfile={donorProfile}
            donations={donations}
            draftCount={draftDonations.length}
            deliveryCount={activeDeliveries.length}
            completedCount={completedDonations.length}
            demands={demands}
            setDonorTab={setDonorTab}
          />
        )}

        {donorTab === 'profile' && (
          <DonorProfileTab
            donorProfile={donorProfile}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleUpdateProfile={handleUpdateProfile}
            handleProfileAutoLocation={handleProfileAutoLocation}
            isLocatingProfile={isLocatingProfile}
            donations={donations}
          />
        )}

        {donorTab === 'donation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left side of donation tab: Simple Form & Advanced Camera Scan */}
            <div className="lg:col-span-6 space-y-6">
              <div id="ai-camera-capture" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-100 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-semibold text-slate-800 text-base">
                        Register a Donation Item
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Choose between manual entry or advanced AI scan checks.</p>
                    </div>
                    {isUpdatingExistingId && (
                      <button 
                        onClick={() => {
                          setIsUpdatingExistingId(null);
                          setDetectedCart(null);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] px-2 py-0.5 rounded transition uppercase tracking-wider"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  {isUpdatingExistingId && (
                    <p className="text-xs text-amber-600 mt-1.5 font-semibold bg-amber-50 p-1.5 rounded border border-amber-100">
                      ⚠️ Correcting Item: "{donations.find(d => d.id === isUpdatingExistingId)?.notes.split('.')[0] || 'Unknown'}"
                    </p>
                  )}
                </div>

                {/* Toggle Mode headers */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
                  <button
                    type="button"
                    onClick={() => setInputMethod('manual')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer text-center ${
                      inputMethod === 'manual'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    📝 Simple Form (Manual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMethod('ai')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer text-center ${
                      inputMethod === 'ai'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    📸 AI Camera Scanner / Presets
                  </button>
                </div>

                <div className="p-5">
                  {inputMethod === 'manual' ? (
                    /* MANUAL FORM RENDERING */
                    <form onSubmit={handleAddManual} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Item Description</label>
                        <input 
                          type="text" 
                          value={manualName} 
                          onChange={e => setManualName(e.target.value)} 
                          placeholder="e.g. Warm winter coats and jackets"
                          className="w-full text-sm border border-slate-200 rounded px-2.5 py-1.5 focus:outline-emerald-600 bg-slate-50 placeholder-slate-400 font-semibold"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                          <select 
                            value={manualCategory}
                            onChange={e => setManualCategory(e.target.value as ItemCategory)}
                            className="w-full text-sm border border-slate-200 rounded p-1.5 bg-slate-50 focus:outline-emerald-600 text-slate-700 font-bold"
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
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quantity (Units)</label>
                          <div className="flex items-center border border-slate-200 rounded bg-slate-50">
                            <button 
                              type="button"
                              onClick={() => setManualQuantity(Math.max(1, manualQuantity - 1))}
                              className="px-3 py-1.5 text-slate-500 hover:text-slate-855 hover:bg-slate-100 rounded-l"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="flex-1 text-center text-sm font-bold text-slate-700">{manualQuantity}</span>
                            <button 
                              type="button"
                              onClick={() => setManualQuantity(manualQuantity + 1)}
                              className="px-3 py-1.5 text-slate-500 hover:text-slate-855 hover:bg-slate-100 rounded-r"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Additional Condition Notes (Optional)</label>
                        <textarea 
                          value={manualNotes}
                          onChange={e => setManualNotes(e.target.value)}
                          placeholder="Specify sizes, physical conditions, or food expiry dates..."
                          rows={2}
                          className="w-full text-sm border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600 placeholder-slate-400"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmittingManual}
                        className="w-full bg-emerald-700 text-white font-bold text-sm py-2 rounded shadow-sm hover:bg-emerald-800 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> 
                        {isSubmittingManual ? 'Saving...' : 'Add to My Donation Catalog'}
                      </button>
                    </form>
                  ) : (
                    /* AI CAMERA & PRESET SCANNER RENDERING */
                    <div className="space-y-4">
                      {/* Live Viewer Frame */}
                      <div className="relative bg-slate-900 rounded-lg aspect-video flex flex-col items-center justify-center text-white overflow-hidden border border-slate-800">
                        {isCameraActive ? (
                          isSimulatorActive ? (
                            <div className="relative w-full h-full flex flex-col justify-between p-3 bg-slate-950">
                              <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center z-10 pointer-events-none">
                                <div className="flex items-center gap-1.5 bg-red-600/90 text-white font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded shadow animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                  Live Simulator Feed
                                </div>
                              </div>

                              <div className="absolute inset-0 flex items-center justify-center">
                                <img 
                                  src={DEMO_PRESETS[simulatorItemIdx].url} 
                                  className="w-full h-full object-cover opacity-60 filter saturate-120" 
                                  alt="Simulator" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce z-10" style={{ animationDuration: '3s' }} />
                              </div>

                              <div className="mt-auto w-full flex flex-col gap-2 z-10">
                                <div className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg backdrop-blur-sm">
                                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-1">
                                    Point Camera At:
                                  </p>
                                  <div className="flex justify-center gap-1.5 overflow-x-auto py-0.5">
                                    {DEMO_PRESETS.map((preset, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSimulatorItemIdx(idx)}
                                        className={`px-2 py-1 rounded text-[10px] font-semibold transition cursor-pointer shrink-0 ${
                                          simulatorItemIdx === idx ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                                        }`}
                                      >
                                        {preset.icon} {preset.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex justify-center gap-2">
                                  <button 
                                    onClick={handleCapture} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded text-xs transition flex items-center gap-1 cursor-pointer shadow-md"
                                  >
                                    <Camera className="w-4 h-4" /> Analyze Video Frame
                                  </button>
                                  <button onClick={stopCamera} className="bg-slate-800 text-slate-300 font-medium px-3 py-1.5 rounded text-xs">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                                <button onClick={handleCapture} className="btn-primary py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1">
                                  <Camera className="w-4 h-4" /> Trigger Detection
                                </button>
                                <button onClick={stopCamera} className="bg-slate-700 text-slate-100 hover:bg-slate-600 font-medium px-3 py-1.5 rounded text-xs">
                                  Cancel
                                </button>
                              </div>
                            </>
                          )
                        ) : (
                          <div 
                            className="text-center p-6 space-y-3 w-full h-full flex flex-col items-center justify-center min-h-[180px] bg-slate-900 border-2 border-dashed border-slate-800 rounded-lg"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) await processImageFile(file);
                            }}
                          >
                            <div className="flex gap-4 items-center justify-center">
                              <button 
                                onClick={startCamera} 
                                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-105 transition duration-150 shadow-md border border-slate-700/50"
                                title="Activate Camera View"
                              >
                                <Camera className="w-6 h-6 text-emerald-400" />
                              </button>
                              <label 
                                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-105 transition duration-150 shadow-md border border-slate-700/50 cursor-pointer flex items-center justify-center"
                                title="Upload any file"
                              >
                                <Upload className="w-6 h-6 text-sky-400" />
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                              </label>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-300 font-semibold">Drag & drop photo here or start camera simulator</p>
                              <p className="text-[10px] text-slate-500 max-w-xs mx-auto font-sans">Upload files directly to test our high-fidelity Gemini vision model instantly!</p>
                            </div>
                          </div>
                        )}

                        {isInferenceLoading && (
                          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-2">
                            <RotateCw className="w-8 h-8 text-emerald-400 animate-spin" />
                            <p className="text-sm font-semibold text-emerald-400">Running Gemini Vision Checks...</p>
                          </div>
                        )}
                      </div>

                      {/* Canvas */}
                      <canvas ref={canvasRef} className="hidden" />

                      {cameraError && (
                        <div className="p-3 bg-amber-50 text-amber-900 rounded-lg text-xs border border-amber-200">
                          <span>{cameraError}</span>
                        </div>
                      )}

                      {/* Preset Buttons */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Presets bypass</p>
                        <div className="grid grid-cols-2 gap-2">
                          {DEMO_PRESETS.map((preset, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handlePresetSelect(preset)}
                              className="flex items-center gap-2 text-left p-2 border border-slate-100 hover:border-emerald-500 rounded hover:bg-emerald-50/20 text-xs transition cursor-pointer"
                            >
                              <span className="text-lg">{preset.icon}</span>
                              <span className="font-semibold text-slate-700">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Analysis results panel */}
                      {detectedCart && (
                        <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-4 space-y-3 animate-fade-in text-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-700 animate-pulse" /> AI Detected: {(detectedCart.confidence * 100).toFixed(0)}% Confidence
                            </span>
                            <button onClick={() => setDetectedCart(null)} className="text-slate-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex gap-3">
                            {detectedCart.imageUrl && (
                              <img src={detectedCart.imageUrl} className="w-16 h-16 rounded object-cover border border-emerald-100" alt="Detected" referrerPolicy="no-referrer" />
                            )}
                            <div className="flex-1 space-y-1">
                              <label className="block text-xs font-semibold text-slate-400 uppercase">Recognized Item</label>
                              <input 
                                type="text" 
                                value={detectedCart.itemName} 
                                onChange={e => setDetectedCart({ ...detectedCart, itemName: e.target.value })}
                                className="w-full text-sm border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-700 font-semibold text-slate-800 py-0.5"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase mb-0.5">Category</label>
                              <select 
                                value={detectedCart.category}
                                onChange={e => setDetectedCart({ ...detectedCart, category: e.target.value as ItemCategory })}
                                className="w-full text-xs border border-slate-200 rounded p-1 bg-white font-bold text-slate-700"
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
                              <label className="block text-xs font-semibold text-slate-400 uppercase mb-0.5">Quantity</label>
                              <div className="flex items-center border border-slate-200 rounded bg-white">
                                <button onClick={() => setDetectedCart({ ...detectedCart, quantity: Math.max(1, detectedCart.quantity - 1) })} className="px-2 py-1 text-slate-500">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="flex-1 text-center text-xs font-mono font-bold text-slate-700">{detectedCart.quantity}</span>
                                <button onClick={() => setDetectedCart({ ...detectedCart, quantity: detectedCart.quantity + 1 })} className="px-2 py-1 text-slate-500">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-0.5">Condition Notes</label>
                            <textarea 
                              value={detectedCart.notes}
                              onChange={e => setDetectedCart({ ...detectedCart, notes: e.target.value })}
                              rows={2}
                              className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-emerald-600 font-sans"
                            />
                          </div>

                          <button onClick={handleSaveToCatalog} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded text-xs transition cursor-pointer">
                            Add to Catalog &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side of donation tab: Drafts and match finder */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="font-display font-semibold text-slate-800 text-base mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-700" /> Pending Catalog Drafts
                </h4>
                <p className="text-xs text-slate-400">
                  These items are registered in your catalog but haven't been matched to an NGO. Click "Match NGO" to find compatible local partners.
                </p>

                {draftDonations.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400 space-y-2 mt-4">
                    <Gift className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold">No draft donations</p>
                    <p className="text-xs max-w-xs mx-auto">Use the Simple Form or AI Scanner on the left to list items.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {draftDonations.map(item => (
                      <div key={item.id} className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} className="w-10 h-10 rounded object-cover border" alt="Item" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-slate-100 border flex items-center justify-center text-lg">📦</div>
                            )}
                            <div>
                              <p className="font-bold text-xs text-slate-850">{item.notes.split('.')[0]}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Qty: {item.quantity} | Category: <span className="capitalize">{item.category}</span></p>
                            </div>
                          </div>
                          <button 
                            onClick={() => exploreMatchesForItem(item)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Match NGO
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Match Finder Drawer (renders if selecting a draft donation) */}
              {selectedDonation && selectedDonation.status === 'Draft' && (
                <div id="matching-drawer" className="bg-white rounded-xl border-2 border-emerald-500 p-5 shadow-lg animate-fade-in space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h4 className="font-display font-semibold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-emerald-700 animate-pulse" /> Active Match Finder: {selectedDonation.notes.split('.')[0]}
                      </h4>
                      <p className="text-xs text-slate-500">Category: <span className="font-bold capitalize text-slate-700">{selectedDonation.category}</span> | Qty: {selectedDonation.quantity}</p>
                    </div>
                    <button onClick={() => setSelectedDonation(null)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 bg-slate-100 rounded">
                      ✕ Close
                    </button>
                  </div>

                  {isMatchingLoading ? (
                    <div className="text-center py-6">
                      <RotateCw className="w-6 h-6 text-emerald-700 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Searching active NGO Demand Registries...</p>
                    </div>
                  ) : activeMatches.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded text-center text-xs text-slate-500">
                      No active requests matched this category currently. We will notify you once a demand surfaces!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {activeMatches.map((match, mIdx) => (
                        <div key={mIdx} className="border border-slate-150 rounded-lg p-3.5 bg-slate-50/50 hover:bg-white transition space-y-3 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-slate-850 text-sm">{match.ngoName}</h5>
                              {match.specificItem && (
                                <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 rounded font-semibold px-1.5 py-0.5">
                                  Requested: {match.specificItem}
                                </span>
                              )}
                              <p className="text-[11px] text-slate-450 mt-1 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {match.ngoAddress} ({match.distance} km)
                              </p>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                              {match.matchScore}% Score
                            </span>
                          </div>

                          <div className="bg-white border rounded p-2 text-[11px] text-slate-605 space-y-1">
                            <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider">Matching Reason:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {match.reasons.map((r: string, rIdx: number) => <li key={rIdx}>{r}</li>)}
                            </ul>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Priority: <strong className="text-red-600">{match.demandPriority}</strong></span>
                            <button 
                              onClick={() => handleSelectMatch(match)}
                              className="bg-emerald-700 text-white font-bold px-3 py-1 rounded hover:bg-emerald-800 active:scale-95 transition cursor-pointer"
                            >
                              Match & Donate
                            </button>
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

        {donorTab === 'notification' && (
          <DonorNotificationsTab
            notifications={notifications}
            donorProfile={donorProfile}
          />
        )}

        {donorTab === 'delivery' && (
          <DonorDeliveryTab
            activeDeliveries={activeDeliveries}
            handleGenerateChecklist={handleGenerateChecklist}
            checklistLoading={checklistLoading}
            checklistActiveId={checklistActiveId}
            checklist={checklist}
            onRefresh={refreshAll}
          />
        )}

        {donorTab === 'history' && (
          <DonorHistoryTab
            completedDonations={completedDonations}
          />
        )}
      </div>
    </div>
  );
}
