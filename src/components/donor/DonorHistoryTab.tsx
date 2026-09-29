import React, { useState, useMemo } from 'react';
import { 
  History, 
  CheckCircle2, 
  Check, 
  TrendingUp, 
  Package, 
  Calendar, 
  BarChart2, 
  Filter, 
  Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area, 
  AreaChart 
} from 'recharts';
import { DonationItem, ItemCategory } from '../../types';

interface DonorHistoryTabProps {
  completedDonations: DonationItem[];
}

export default function DonorHistoryTab({ completedDonations }: DonorHistoryTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [metricMode, setMetricMode] = useState<'units' | 'packages'>('units');

  // Filter completed donations based on category
  const filteredDonations = useMemo(() => {
    if (selectedCategory === 'all') return completedDonations;
    return completedDonations.filter(d => d.category === selectedCategory);
  }, [completedDonations, selectedCategory]);

  // Aggregate monthly delivered items
  const monthlyData = useMemo(() => {
    // Generate standard past 6 months structure
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthsMap: { [key: string]: { month: string; year: number; fullLabel: string; totalItems: number; packages: number } } = {};

    // Initialize past 6 months to ensure smooth continuous line graph
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const fullLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthsMap[monthKey] = {
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        fullLabel,
        totalItems: 0,
        packages: 0
      };
    }

    // Populate data from completed donations
    filteredDonations.forEach(item => {
      const itemDate = new Date(item.detectedAt);
      const monthKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = {
          month: monthNames[itemDate.getMonth()],
          year: itemDate.getFullYear(),
          fullLabel: `${monthNames[itemDate.getMonth()]} ${itemDate.getFullYear()}`,
          totalItems: 0,
          packages: 0
        };
      }
      
      monthsMap[monthKey].totalItems += item.quantity;
      monthsMap[monthKey].packages += 1;
    });

    // Return sorted array by month key
    return Object.keys(monthsMap)
      .sort()
      .map(key => ({
        ...monthsMap[key],
        displayLabel: monthsMap[key].month
      }));
  }, [filteredDonations]);

  // Summary statistics
  const totalUnits = useMemo(() => {
    return filteredDonations.reduce((sum, item) => sum + item.quantity, 0);
  }, [filteredDonations]);

  const peakMonth = useMemo(() => {
    if (monthlyData.length === 0) return { month: 'N/A', val: 0 };
    let maxObj = monthlyData[0];
    monthlyData.forEach(m => {
      const val = metricMode === 'units' ? m.totalItems : m.packages;
      const maxVal = metricMode === 'units' ? maxObj.totalItems : maxObj.packages;
      if (val > maxVal) maxObj = m;
    });
    return {
      month: maxObj.fullLabel,
      val: metricMode === 'units' ? maxObj.totalItems : maxObj.packages
    };
  }, [monthlyData, metricMode]);

  const avgMonthly = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    const sum = monthlyData.reduce((acc, m) => acc + (metricMode === 'units' ? m.totalItems : m.packages), 0);
    return Math.round(sum / monthlyData.length);
  }, [monthlyData, metricMode]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Tab Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-display font-bold text-slate-900 text-xl flex items-center gap-2">
              <History className="text-emerald-700 w-6 h-6" /> Cumulative Delivery History & Analytics
            </h4>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Track monthly delivery trends, total items distributed, and community impact growth over time.
            </p>
          </div>
          <span className="self-start sm:self-center text-xs font-mono bg-emerald-100/80 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-xs">
            {completedDonations.length} Orders Delivered
          </span>
        </div>

        {/* Impact Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-emerald-700" /> Total Items Delivered
            </span>
            <p className="text-2xl font-mono font-black text-emerald-900">{totalUnits} <span className="text-xs font-sans font-semibold text-slate-500">units</span></p>
            <p className="text-[11px] text-slate-500 font-sans">Across {filteredDonations.length} verified packages</p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" /> Monthly Average
            </span>
            <p className="text-2xl font-mono font-black text-slate-900">{avgMonthly} <span className="text-xs font-sans font-semibold text-slate-500">{metricMode === 'units' ? 'units/mo' : 'pkgs/mo'}</span></p>
            <p className="text-[11px] text-slate-500 font-sans">Steady community contribution rate</p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Peak Impact Month
            </span>
            <p className="text-xl font-mono font-bold text-slate-900">{peakMonth.month}</p>
            <p className="text-[11px] text-emerald-800 font-semibold font-mono">{peakMonth.val} {metricMode === 'units' ? 'items delivered' : 'packages delivered'}</p>
          </div>
        </div>

        {/* Monthly Line Graph Container */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-700" />
              <h5 className="font-bold text-sm text-slate-800">Monthly Items Delivered Trend</h5>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none pr-2 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="clothing">Clothing</option>
                  <option value="food">Food</option>
                  <option value="books">Books</option>
                  <option value="electronics">Electronics</option>
                  <option value="utensils">Utensils</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>

              {/* Metric Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => setMetricMode('units')}
                  className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                    metricMode === 'units' ? 'bg-emerald-800 text-white shadow-xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Total Items
                </button>
                <button
                  onClick={() => setMetricMode('packages')}
                  className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                    metricMode === 'packages' ? 'bg-emerald-800 text-white shadow-xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Packages
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Line Chart (Line Mode) */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="deliveredColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="displayLabel" 
                  tickLine={false} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis 
                  allowDecimals={false}
                  tickLine={false} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#FFF', 
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
                  }}
                  formatter={(value: any) => [`${value} ${metricMode === 'units' ? 'delivered items' : 'packages'}`, 'Delivered Total']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={metricMode === 'units' ? 'totalItems' : 'packages'} 
                  name="Items Delivered / Month" 
                  stroke="#047857" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#deliveredColor)" 
                  activeDot={{ r: 6, fill: '#047857', stroke: '#FFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Delivery History Records */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="font-display font-semibold text-slate-800 text-md flex items-center gap-2">
          <Calendar className="text-emerald-700 w-4 h-4" /> Delivered Items Archive ({filteredDonations.length})
        </h4>

        {filteredDonations.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-sm font-semibold">No completed items found</p>
            <p className="text-xs max-w-xs mx-auto font-sans">Once your scheduled pickups are collected, delivered, and acknowledged by our NGO partners, they will be archived here.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredDonations.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 hover:border-emerald-200 transition shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-slate-100 rounded-lg border border-slate-200">
                      {item.category === 'clothing' ? '🧥' :
                       item.category === 'food' ? '🥫' :
                       item.category === 'books' ? '📚' :
                       item.category === 'electronics' ? '📱' :
                       item.category === 'furniture' ? '🪑' : '🍳'}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{item.notes.split('.')[0]}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        Qty: <span className="font-mono font-bold text-slate-700">{item.quantity} units</span> | Completed: <span className="font-mono">{new Date(item.detectedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 font-mono uppercase self-start sm:self-center">
                    <Check className="w-3.5 h-3.5 text-emerald-700" /> {item.status}
                  </span>
                </div>

                {/* NGO Thank You letter */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3.5 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    💌 Acknowledgment Receipt from {item.match?.ngoName || 'NGO Partner'}
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
    </div>
  );
}
