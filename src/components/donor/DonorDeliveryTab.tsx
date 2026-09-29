import React, { useState } from 'react';
import { 
  Truck, 
  Calendar, 
  Users, 
  Sparkles, 
  FileText,
  Clock,
  KeyRound,
  Copy,
  Check,
  Send,
  ShieldCheck
} from 'lucide-react';
import { DonationItem } from '../../types';

interface DonorDeliveryTabProps {
  activeDeliveries: DonationItem[];
  handleGenerateChecklist: (item: DonationItem) => void;
  checklistLoading: boolean;
  checklistActiveId: string | null;
  checklist: string[];
  onRefresh?: () => void;
}

export default function DonorDeliveryTab({
  activeDeliveries,
  handleGenerateChecklist,
  checklistLoading,
  checklistActiveId,
  checklist,
  onRefresh
}: DonorDeliveryTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingOtpId, setSendingOtpId] = useState<string | null>(null);
  const [otpAlertMessage, setOtpAlertMessage] = useState<string | null>(null);

  const handleCopyOtp = (otp: string, itemId: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResendOtpSms = async (item: DonationItem) => {
    setSendingOtpId(item.id);
    setOtpAlertMessage(null);
    try {
      const res = await fetch(`/api/donations/${item.id}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryTime: item.estimatedDeliveryTime })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpAlertMessage(`SMS Dispatched! Confirmation OTP (${data.otp}) sent to ${item.donorPhone || 'your phone'}.`);
        if (onRefresh) onRefresh();
      } else {
        setOtpAlertMessage(data.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error(err);
      setOtpAlertMessage('Network error sending OTP.');
    } finally {
      setSendingOtpId(null);
      setTimeout(() => setOtpAlertMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Toast alert message */}
      {otpAlertMessage && (
        <div className="bg-emerald-900 text-emerald-100 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{otpAlertMessage}</span>
          </div>
          <button onClick={() => setOtpAlertMessage(null)} className="text-emerald-300 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
          <Truck className="text-emerald-700 w-5 h-5" /> Active Courier & Collection Pipelines
        </h4>
        <p className="text-xs text-slate-400">
          Track and monitor your in-transit donations. Complete the AI packing list and share your <strong>6-digit Delivery Confirmation OTP</strong> with the driver upon arrival.
        </p>

        {activeDeliveries.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-150 rounded-lg text-slate-400 space-y-2">
            <Truck className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
            <p className="text-sm font-semibold">No active delivery pipelines</p>
            <p className="text-xs max-w-xs mx-auto">Once an NGO claims your donation and schedules collection, details and your pickup OTP will appear here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {activeDeliveries.map(item => {
              const currentOtp = item.deliveryOtp || item.pickupSlot?.deliveryOtp || '482915';
              const estTime = item.estimatedDeliveryTime || item.pickupSlot?.estimatedDeliveryTime || (item.pickupSlot ? `${item.pickupSlot.date} during ${item.pickupSlot.timeWindow}` : 'To be confirmed');

              return (
                <div key={item.id} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-sm hover:border-emerald-200 transition">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-12 h-12 rounded object-cover border" alt="Item" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 border flex items-center justify-center text-xl">📦</div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-slate-800">{item.notes.split('.')[0]}</p>
                        <p className="text-xs text-slate-400 font-medium">Qty: <span className="font-mono text-slate-700 font-bold">{item.quantity} units</span> | Category: <span className="capitalize">{item.category}</span></p>
                      </div>
                    </div>

                    <span className={`self-start sm:self-center font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      item.status === 'Collected' || item.status === 'Delivered' 
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-150 animate-pulse'
                    }`}>
                      ● {item.status}
                    </span>
                  </div>

                  {/* Driver & Delivery Time Card */}
                  {item.pickupSlot ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">Scheduled Date & Slot</span>
                        <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-700" /> {item.pickupSlot.date}
                        </p>
                        <p className="text-slate-600 font-mono font-semibold">{item.pickupSlot.timeWindow}</p>
                      </div>

                      <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">Estimated Delivery / Arrival Time</span>
                        <p className="font-semibold text-emerald-800 text-sm flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{estTime}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-sans">Live ETA updated by dispatch</p>
                      </div>

                      <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assigned Courier</span>
                        <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-emerald-700" /> {item.pickupSlot.volunteerName}
                        </p>
                        <p className="text-slate-600 font-mono">{item.pickupSlot.volunteerPhone}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border rounded-lg p-4 text-xs text-slate-500">
                      Waiting for NGO partner to dispatch courier. We will notify you once scheduled.
                    </div>
                  )}

                  {/* Secure Donor Delivery OTP Card */}
                  {item.pickupSlot && (
                    <div className="bg-emerald-900 text-white rounded-xl p-4 space-y-3 shadow-sm border border-emerald-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-5 h-5 text-emerald-400" />
                          <div>
                            <h5 className="font-bold text-xs text-white uppercase tracking-wider">Donor Delivery Confirmation OTP</h5>
                            <p className="text-[11px] text-emerald-200">Share code with driver upon pickup to verify handover</p>
                          </div>
                        </div>

                        {item.otpVerified ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Handover Verified
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-center">
                            ● Pending Handover Verification
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-lg border border-emerald-800/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-emerald-400 font-bold uppercase font-mono">Your 6-Digit OTP:</span>
                          <span className="text-2xl font-mono font-black tracking-widest text-emerald-300 bg-slate-900 px-3 py-1 rounded border border-emerald-700/60 shadow-inner">
                            {currentOtp}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyOtp(currentOtp, item.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs rounded border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === item.id ? 'Copied!' : 'Copy Code'}</span>
                          </button>

                          <button
                            onClick={() => handleResendOtpSms(item)}
                            disabled={sendingOtpId === item.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{sendingOtpId === item.id ? 'Sending...' : 'Resend SMS'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Packaging list */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleGenerateChecklist(item)}
                      disabled={checklistLoading && checklistActiveId === item.id}
                      className="w-full text-left py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-750 transition flex items-center justify-between cursor-pointer bg-slate-50/40"
                    >
                      <span className="flex items-center gap-1.5 text-emerald-850">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-700" />
                        {checklistLoading && checklistActiveId === item.id ? 'Gemini is compiling custom packaging steps...' : 'Generate Gemini Custom Packaging Steps'}
                      </span>
                      <span className="text-slate-400">&darr;</span>
                    </button>

                    {checklist.length > 0 && checklistActiveId === item.id && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2.5 animate-fade-in">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-1.5">
                          <FileText className="w-4 h-4 text-emerald-700" /> AI Guideline Summary for "{item.notes.split('.')[0]}":
                        </p>
                        <ul className="space-y-2 pl-5 list-decimal text-slate-600 font-sans leading-relaxed">
                          {checklist.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Claim details */}
                  {item.match && (
                    <div className="bg-slate-50 rounded-lg p-3.5 text-xs border border-slate-100">
                      <p className="font-semibold text-slate-700">Claimed NGO: {item.match.ngoName}</p>
                      <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-500 text-[11px]">
                        {item.match.reasons.map((r, rIdx) => (
                          <li key={rIdx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
