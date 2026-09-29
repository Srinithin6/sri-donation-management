import React from 'react';
import { Bell } from 'lucide-react';
import { DonorProfile, NotificationLog } from '../../types';

interface DonorNotificationsTabProps {
  notifications: NotificationLog[];
  donorProfile: DonorProfile | null;
}

export default function DonorNotificationsTab({
  notifications,
  donorProfile
}: DonorNotificationsTabProps) {
  // Filter notifications sent to the donor (matching phone, email, or a placeholder)
  const donorNotifications = notifications.filter(notif => 
    notif.recipient === donorProfile?.phone || 
    notif.recipient === donorProfile?.email || 
    notif.recipient === 'jane.donor@example.com' ||
    notif.recipient === '+1 (555) 432-1098'
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in text-slate-800">
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h4 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
            <Bell className="text-emerald-700 w-5 h-5 animate-pulse" /> Live SMS & Email Alerts
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">Simulated mobile cellular gateway. Live Twilio SMS alerts are rendered here instantly when NGOs claim donations.</p>
        </div>
        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
          {donorNotifications.length} Messages
        </span>
      </div>

      {donorNotifications.length === 0 ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold">No recent alerts</p>
          <p className="text-xs max-w-xs mx-auto">You will be notified as soon as an NGO schedules a pickup for one of your claimed donations.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {donorNotifications.map((notif) => (
            <div key={notif.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50/40 flex items-start gap-3 hover:bg-slate-50 transition">
              <div className={`px-2.5 py-1 rounded-lg shrink-0 text-[10px] font-mono font-bold ${
                notif.channel === 'SMS' ? 'bg-indigo-50 text-indigo-700' :
                notif.channel === 'WhatsApp' ? 'bg-emerald-50 text-emerald-700' :
                'bg-sky-50 text-sky-700'
              }`}>
                {notif.channel}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-slate-850 font-medium leading-relaxed">
                  {notif.message}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Sent on {new Date(notif.sentAt).toLocaleString()} | Target: {notif.recipient}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
