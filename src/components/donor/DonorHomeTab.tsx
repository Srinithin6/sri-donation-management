import React, { useState } from 'react';
import { 
  Heart, 
  Gift, 
  Truck, 
  CheckCircle2, 
  Sparkles,
  X,
  Building2,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Info,
  Eye,
  Package,
  ExternalLink
} from 'lucide-react';
import { DonorProfile, DonationItem, NGODemand } from '../../types';

interface DonorHomeTabProps {
  donorProfile: DonorProfile | null;
  donations: DonationItem[];
  draftCount: number;
  deliveryCount: number;
  completedCount: number;
  demands: NGODemand[];
  setDonorTab: (tab: any) => void;
}

export default function DonorHomeTab({
  donorProfile,
  donations,
  draftCount,
  deliveryCount,
  completedCount,
  demands,
  setDonorTab
}: DonorHomeTabProps) {
  const [selectedDemand, setSelectedDemand] = useState<NGODemand | null>(null);
  const [selectedStatModal, setSelectedStatModal] = useState<{
    title: string;
    filterKey: 'all' | 'draft' | 'scheduled' | 'delivered';
    tabTarget: string;
    icon: any;
    colorClass: string;
  } | null>(null);

  // Helper to filter items for stat modal
  const getModalItems = () => {
    if (!selectedStatModal) return [];
    switch (selectedStatModal.filterKey) {
      case 'all':
        return donations;
      case 'draft':
        return donations.filter(d => d.status === 'Draft');
      case 'scheduled':
        return donations.filter(d => d.status === 'Pickup Scheduled' || d.status === 'Matched' || d.status === 'Packaging Notified' || d.status === 'Collected');
      case 'delivered':
        return donations.filter(d => d.status === 'Delivered' || d.status === 'Acknowledged');
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in text-slate-800">
      {/* Slogan Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10 space-y-1.5 sm:space-y-2">
          <span className="bg-emerald-600/30 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20">
            Welcome back, {donorProfile?.name || 'Jane'}
          </span>
          <h3 className="font-display font-bold text-lg sm:text-2xl">Your Sustainability Footprint</h3>
          <p className="text-slate-400 text-[11px] sm:text-xs max-w-lg leading-relaxed">
            Every shared garment, canned good, or unused tablet makes Springfield a more resilient community. Thank you for your active, verified contributions!
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
          <Heart className="w-32 h-32 sm:w-48 sm:h-48 fill-white animate-pulse" />
        </div>
      </div>

      {/* Impact Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { 
            label: 'Total Contributions', 
            val: donations.length, 
            icon: Heart, 
            color: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300',
            filterKey: 'all' as const,
            tabTarget: 'history',
            title: 'Total Contributions Registry'
          },
          { 
            label: 'Active Drafts', 
            val: draftCount, 
            icon: Gift, 
            color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300',
            filterKey: 'draft' as const,
            tabTarget: 'donation',
            title: 'Active Draft Donations'
          },
          { 
            label: 'Scheduled Pickups', 
            val: donations.filter(d => d.status === 'Pickup Scheduled' || d.status === 'Matched' || d.status === 'Packaging Notified' || d.status === 'Collected').length, 
            icon: Truck, 
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300',
            filterKey: 'scheduled' as const,
            tabTarget: 'delivery',
            title: 'Scheduled Pickup Pipelines'
          },
          { 
            label: 'Delivered Packages', 
            val: completedCount, 
            icon: CheckCircle2, 
            color: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300',
            filterKey: 'delivered' as const,
            tabTarget: 'history',
            title: 'Delivered Packages Log'
          },
        ].map((stat, sIdx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={sIdx} 
              onClick={() => setSelectedStatModal({
                title: stat.title,
                filterKey: stat.filterKey,
                tabTarget: stat.tabTarget,
                icon: Icon,
                colorClass: stat.color
              })}
              className={`bg-white border rounded-xl p-2.5 sm:p-4 flex items-center justify-between gap-2 shadow-xs ${stat.color} cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition group`}
              title="Click to view details"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 bg-white rounded-lg border shadow-xs group-hover:scale-105 transition shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wide truncate">{stat.label}</span>
                  <span className="font-display font-bold text-base sm:text-lg text-slate-800">{stat.val}</span>
                </div>
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition flex items-center gap-0.5 shrink-0">
                <span className="hidden sm:inline">View</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Urgent Community Demands Bulletin */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-display font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700 animate-pulse" /> Urgent Local NGO Demand Registry
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click on any registered demand below to inspect detailed requirements and fulfill items.
            </p>
          </div>
          <button
            onClick={() => setDonorTab('donation')}
            className="text-xs text-emerald-800 hover:underline font-bold cursor-pointer flex items-center gap-1"
          >
            Create Donation <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {demands.slice(0, 6).map(demand => {
            const percentFilled = Math.round((demand.quantityFilled / demand.quantityRequired) * 100);
            return (
              <div 
                key={demand.id} 
                onClick={() => setSelectedDemand(demand)}
                className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/30 hover:bg-emerald-50/40 hover:border-emerald-300 hover:shadow-md transition cursor-pointer space-y-2 group relative"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 bg-white border border-slate-100 rounded-md shadow-xs group-hover:scale-105 transition">
                      {demand.category === 'clothing' ? '🧥' :
                       demand.category === 'food' ? '🥫' :
                       demand.category === 'books' ? '📚' :
                       demand.category === 'electronics' ? '📱' :
                       demand.category === 'furniture' ? '🪑' : '🍳'}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-slate-800 capitalize group-hover:text-emerald-800 transition flex items-center gap-1">
                        {demand.specificItem || demand.category}
                        <Info className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 inline-block opacity-0 group-hover:opacity-100 transition" />
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" /> {demand.ngoName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      demand.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
                      demand.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {demand.priority} Priority
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 group-hover:underline">
                      View details &rarr;
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Progress: {demand.quantityFilled} / {demand.quantityRequired} units</span>
                    <span className="font-bold text-emerald-800">{percentFilled}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${percentFilled}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demand Detail Modal */}
      {selectedDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-slate-800 rounded-lg border border-slate-700">
                  {selectedDemand.category === 'clothing' ? '🧥' :
                   selectedDemand.category === 'food' ? '🥫' :
                   selectedDemand.category === 'books' ? '📚' :
                   selectedDemand.category === 'electronics' ? '📱' :
                   selectedDemand.category === 'furniture' ? '🪑' : '🍳'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white capitalize">
                      {selectedDemand.specificItem || selectedDemand.category}
                    </h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      selectedDemand.priority === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                      selectedDemand.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {selectedDemand.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> {selectedDemand.ngoName}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedDemand(null)}
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
                  <span>Fulfillment Status</span>
                  <span className="text-emerald-700 font-mono">
                    {selectedDemand.quantityFilled} / {selectedDemand.quantityRequired} units ({Math.round((selectedDemand.quantityFilled / selectedDemand.quantityRequired) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300" 
                    style={{ width: `${Math.round((selectedDemand.quantityFilled / selectedDemand.quantityRequired) * 100)}%` }} 
                  />
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Still needing <strong className="text-slate-800 font-mono">{Math.max(0, selectedDemand.quantityRequired - selectedDemand.quantityFilled)} units</strong> to complete this community registry target.
                </p>
              </div>

              {/* Requirement Description */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-700" /> Need Statement & Guidelines
                </h4>
                <p className="bg-white border border-slate-200 rounded-lg p-3 text-slate-700 text-xs leading-relaxed">
                  {selectedDemand.description || 'This item requirement was logged by verified local partners to serve immediate neighborhood relief programs.'}
                </p>
              </div>

              {/* NGO Contact & Delivery Hub Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Dropoff / Pickup Hub</span>
                  <p className="font-medium text-slate-800 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{selectedDemand.ngoAddress || 'Springfield Central NGO Hub'}</span>
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">NGO Direct Line</span>
                  <p className="font-medium text-slate-800 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{selectedDemand.ngoPhone || '+1 (555) 234-5678'}</span>
                  </p>
                </div>
              </div>

              {/* Expiry Date */}
              {selectedDemand.expiryDate && (
                <div className="flex items-center gap-2 text-slate-500 bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-[11px]">
                    Target Requirement Deadline: <strong className="text-slate-800 font-mono">{selectedDemand.expiryDate}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedDemand(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedDemand(null);
                  setDonorTab('donation');
                }}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer active:scale-98"
              >
                <Gift className="w-4 h-4" /> Donate to Fulfill This Need
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stat Items Inspector Modal */}
      {selectedStatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400">
                  <selectedStatModal.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white">
                      {selectedStatModal.title}
                    </h3>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {getModalItems().length} Items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Inspecting filtered records for your donor profile
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedStatModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3.5 overflow-y-auto text-xs text-slate-700">
              {getModalItems().length === 0 ? (
                <div className="text-center py-10 space-y-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <div>
                    <p className="font-bold text-slate-700 text-sm">No items in this category yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                      You haven't logged any items under this status. Create a new donation entry to get started!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStatModal(null);
                      setDonorTab('donation');
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Gift className="w-3.5 h-3.5" /> Log New Donation
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {getModalItems().map((item) => (
                    <div 
                      key={item.id} 
                      className="border border-slate-200 rounded-lg p-3 bg-slate-50/40 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0" alt="Item" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-2xl p-1 bg-white border border-slate-100 rounded shrink-0">
                              {item.category === 'clothing' ? '🧥' :
                               item.category === 'food' ? '🥫' :
                               item.category === 'books' ? '📚' :
                               item.category === 'electronics' ? '📱' :
                               item.category === 'furniture' ? '🪑' : '🍳'}
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-xs text-slate-800">{item.notes.split('.')[0] || 'Donation Item'}</p>
                            <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                              <span>Category: <strong>{item.category}</strong></span>
                              <span>•</span>
                              <span>Logged: {new Date(item.detectedAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                          item.status === 'Delivered' || item.status === 'Acknowledged' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          item.status === 'Pickup Scheduled' || item.status === 'Matched' || item.status === 'Packaging Notified' || item.status === 'Collected' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] bg-white border border-slate-150 rounded px-2.5 py-1 text-slate-600">
                        <span>Quantity: <strong className="text-slate-800 font-mono">{item.quantity} units</strong></span>
                        {item.match ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Matched: {item.match.ngoName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unmatched / In Review</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedStatModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedStatModal.tabTarget;
                  setSelectedStatModal(null);
                  setDonorTab(target);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-98"
              >
                <span>Go to full tab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

