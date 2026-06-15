'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend 
} from 'recharts';
import { Filter, TrendingUp, DollarSign, Calendar, ListOrdered } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

// Helper to convert Excel Serial Date to JS Date
function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  return new Date(utc_value * 1000);
}

function getMonthYearStr(serial) {
  const date = excelDateToJSDate(serial);
  if (!date) return 'Unknown';
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function getMonthSortKey(serial) {
  const date = excelDateToJSDate(serial);
  if (!date) return 0;
  return date.getFullYear() * 100 + date.getMonth(); // e.g., 202605
}

function getDayStr(serial) {
  const date = excelDateToJSDate(serial);
  if (!date) return 'Unknown';
  // Return just the day number (1-31)
  return date.getDate().toString();
}

function getWeekOfMonth(serial) {
  const date = excelDateToJSDate(serial);
  if (!date) return 'Unknown';
  const day = date.getDate();
  if (day <= 7) return '1 - 7';
  if (day <= 14) return '8 - 14';
  if (day <= 21) return '15 - 21';
  if (day <= 28) return '22 - 28';
  return '29 - 31';
}

// Format IDR Rupiah
const formatRp = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};
const formatCompactRp = (value) => {
  if (value >= 1e9) return 'Rp ' + (value / 1e9).toFixed(1) + 'M';
  if (value >= 1e6) return 'Rp ' + (value / 1e6).toFixed(1) + 'Jt';
  if (value >= 1e3) return 'Rp ' + (value / 1e3).toFixed(0) + 'K';
  return 'Rp ' + value;
};

export default function SalesDashboard({ masterData }) {
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Add parsed date & revenue properties to data
  const processedData = useMemo(() => {
    return masterData.map(d => {
      const monthYear = getMonthYearStr(d.SalesDate);
      const monthSortKey = getMonthSortKey(d.SalesDate);
      const day = getDayStr(d.SalesDate);
      const week = getWeekOfMonth(d.SalesDate);
      return { 
        ...d, 
        monthYear, 
        monthSortKey,
        day, 
        week,
        revenue: Number(d.Total) || 0 
      };
    });
  }, [masterData]);

  // Extract unique branches and months
  const branches = useMemo(() => {
    const b = new Set(processedData.map(d => d.Branch).filter(Boolean));
    return ['All', ...Array.from(b)];
  }, [processedData]);

  const months = useMemo(() => {
    const m = Array.from(new Set(processedData.filter(d => d.monthYear !== 'Unknown').map(d => JSON.stringify({ name: d.monthYear, key: d.monthSortKey }))));
    const sortedMonths = m.map(s => JSON.parse(s)).sort((a, b) => a.key - b.key).map(m => m.name);
    return ['All', ...sortedMonths];
  }, [processedData]);

  // Filter data for standard charts (Branch & Month applied)
  const filteredData = useMemo(() => {
    return processedData.filter(d => {
      const matchBranch = selectedBranch === 'All' || d.Branch === selectedBranch;
      const matchMonth = selectedMonth === 'All' || d.monthYear === selectedMonth;
      return matchBranch && matchMonth;
    });
  }, [processedData, selectedBranch, selectedMonth]);

  // Filter data for Month-over-Month (Only Branch applied, ignores Month filter to show all months)
  const dataForMoM = useMemo(() => {
    return processedData.filter(d => {
      return selectedBranch === 'All' || d.Branch === selectedBranch;
    });
  }, [processedData, selectedBranch]);

  // Metrics
  const totalRevenue = useMemo(() => filteredData.reduce((sum, d) => sum + d.revenue, 0), [filteredData]);

  // Daily Trend Data (Bar Chart)
  const dailyTrendData = useMemo(() => {
    const dailyMap = {};
    filteredData.forEach(d => {
      if (d.day !== 'Unknown') {
        dailyMap[d.day] = (dailyMap[d.day] || 0) + d.revenue;
      }
    });
    return Object.entries(dailyMap)
      .map(([dayStr, revenue]) => ({ dayNum: Number(dayStr), day: dayStr, revenue }))
      .sort((a, b) => a.dayNum - b.dayNum);
  }, [filteredData]);

  // Weekly Revenue Data (Bar Chart)
  const weeklyData = useMemo(() => {
    const weekMap = {};
    filteredData.forEach(d => {
      if (d.week !== 'Unknown') {
        weekMap[d.week] = (weekMap[d.week] || 0) + d.revenue;
      }
    });
    return Object.entries(weekMap)
      .map(([week, revenue]) => ({ week, revenue }))
      .sort((a, b) => parseInt(a.week) - parseInt(b.week)); // e.g., "1 - 7" -> 1
  }, [filteredData]);

  // Month-over-Month Data (Bar Chart)
  const momData = useMemo(() => {
    const monthMap = {};
    dataForMoM.forEach(d => {
      if (d.monthYear !== 'Unknown') {
        if (!monthMap[d.monthYear]) {
          monthMap[d.monthYear] = { revenue: 0, sortKey: d.monthSortKey };
        }
        monthMap[d.monthYear].revenue += d.revenue;
      }
    });
    return Object.entries(monthMap)
      .map(([month, data]) => ({ month, revenue: data.revenue, sortKey: data.sortKey }))
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [dataForMoM]);

  // Branch Distribution Data (Pie Chart)
  const branchDistData = useMemo(() => {
    const bMap = {};
    filteredData.forEach(d => {
      const b = d.Branch || 'Unknown';
      bMap[b] = (bMap[b] || 0) + d.revenue;
    });
    return Object.entries(bMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Category Sales Data (Bar Chart)
  const categoryData = useMemo(() => {
    const catMap = {};
    filteredData.forEach(d => {
      const cat = d.Category || 'Lainnya';
      catMap[cat] = (catMap[cat] || 0) + d.revenue;
    });
    return Object.entries(catMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Peak Hours Data (Area Chart)
  const peakHoursData = useMemo(() => {
    const hrMap = {};
    filteredData.forEach(d => {
      if (d.Hour !== 'Unknown' && d.Hour != null) {
        const hrStr = String(d.Hour).padStart(2, '0') + ':00';
        hrMap[hrStr] = (hrMap[hrStr] || 0) + (Number(d.Qty) || 0);
      }
    });
    return Object.entries(hrMap)
      .map(([hour, qty]) => ({ hour, qty }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [filteredData]);

  // Payment Method Data (Pie Chart)
  const paymentMethodData = useMemo(() => {
    const payMap = {};
    filteredData.forEach(d => {
      const pm = d.PaymentMethod || 'Unknown';
      payMap[pm] = (payMap[pm] || 0) + d.revenue;
    });
    return Object.entries(payMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Top 10 Menus
  const topMenus = useMemo(() => {
    const menuMap = {};
    filteredData.forEach(d => {
      menuMap[d.Menu] = (menuMap[d.Menu] || 0) + d.revenue;
    });
    return Object.entries(menuMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData]);

  const CustomTooltip = ({ active, payload, label, isQty }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.95)', padding: '12px', color: '#fff', backdropFilter: 'blur(10px)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#94a3b8' }}>{label}</p>
          <p style={{ margin: 0, fontWeight: 'bold', color: payload[0].fill || payload[0].stroke || 'var(--accent-color)' }}>
            {isQty ? `${Number(payload[0].value).toLocaleString('id-ID')} Transaksi/Porsi` : formatRp(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card animate-fade-in mb-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="text-accent" />
            <span className="header-gradient">Analisa Pendapatan (Revenue)</span>
          </h2>
          <p className="text-secondary text-sm">Dashboard performa penjualan perusahaan berdasarkan pendapatan</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
            <Calendar size={16} className="text-secondary ml-1" />
            <select 
              className="input-control !bg-transparent !border-none !py-1" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">Semua Bulan</option>
              {months.filter(m => m !== 'All').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
            <Filter size={16} className="text-secondary ml-1" />
            <select 
              className="input-control !bg-transparent !border-none !py-1" 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="All">Semua Cabang</option>
              {branches.filter(b => b !== 'All').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card flex flex-col gap-2 border-t-4" style={{ borderTopColor: 'var(--accent-color)' }}>
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
              <DollarSign className="text-accent" size={20} />
            </div>
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider">Total Pendapatan</p>
          </div>
          <p className="text-2xl font-bold header-gradient mt-2">{formatRp(totalRevenue)}</p>
        </div>

        {paymentMethodData.map((pm, index) => (
          <div key={pm.name} className="glass-card flex flex-col gap-2 border-t-4" style={{ borderTopColor: COLORS[(index + 1) % COLORS.length] }}>
            <div className="flex items-center gap-3">
              <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}>
                <DollarSign style={{ color: COLORS[(index + 1) % COLORS.length] }} size={20} />
              </div>
              <p className="text-sm font-semibold text-secondary uppercase tracking-wider">{pm.name}</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatRp(pm.value)}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        
        {/* Daily Trend Chart (Bar) */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Tren Pendapatan Harian</h3>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={formatCompactRp} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Pendapatan" radius={[4, 4, 0, 0]} fill="var(--accent-color)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Revenue Chart */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Pendapatan Mingguan</h3>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={formatCompactRp} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Pendapatan" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % 2 === 0 ? 1 : 2]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month-over-Month Chart */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Perbandingan Antar Bulan</h3>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={momData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={formatCompactRp} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Pendapatan" radius={[4, 4, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Distribution Pie Chart */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Kontribusi Cabang</h3>
          <div style={{ height: 250, width: '100%' }}>
            {branchDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {branchDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'var(--card-shadow)', background: 'rgba(15, 23, 42, 0.95)', color: '#fff', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value) => [formatRp(value), 'Pendapatan']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-secondary">
                Data tidak tersedia
              </div>
            )}
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Pendapatan Berdasarkan Kategori</h3>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={formatCompactRp} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Pendapatan" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Area Chart */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Trafik Jam Sibuk (Berdasarkan Qty)</h3>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHoursData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[4]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[4]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={40} />
                <Tooltip content={<CustomTooltip isQty={true} />} />
                <Area type="monotone" dataKey="qty" name="Qty / Porsi" stroke={COLORS[4]} strokeWidth={3} fillOpacity={1} fill="url(#colorHour)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Top 10 Menus - Moved to Bottom */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-6">
          <ListOrdered className="text-accent" size={20} />
          <h3 className="text-lg font-semibold text-white">Top 10 Menu Paling Laris</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
          {topMenus.map((m, i) => (
            <div key={m.name} className="flex justify-between items-center group p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-accent font-bold text-sm">
                  {i + 1}
                </span>
                <span className="font-medium text-white group-hover:text-accent transition-colors">{m.name}</span>
              </div>
              <span className="font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm">
                {formatRp(m.revenue)}
              </span>
            </div>
          ))}
          {topMenus.length === 0 && <p className="text-secondary text-sm p-3">Tidak ada data untuk filter ini.</p>}
        </div>
      </div>

    </div>
  );
}
